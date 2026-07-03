import type {
  BulkCardSearchListingDto,
  BulkCardSearchRequestDto,
  BulkCardSearchResponseDto,
  BulkCardSearchSellerCartDto,
  CardListItemDto,
  CardDetailsDto
} from '../../../shared/contracts/cards';
import type { WorkerEnv } from '../../env';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { createJsonResponse } from '../../shared/http/createJsonResponse';
import { createAdapterRegistry } from '../sellerSync/adapters';
import type { Seller, SellerAdapter } from '../sellerSync/model';
import type { Card } from './model';
import {
  getCardById,
  listActiveListingsByCardId,
  listActiveListingsByCardIds,
  listCardsByChasePrice,
  listCardsByExactNormalizedNames
} from './queries';

const maxBulkSearchNames = 150;
const defaultCardListLimit = 50;
const maxCardListLimit = 150;

type BulkSearchListing = Awaited<ReturnType<typeof listActiveListingsByCardIds>>[number] & {
  requestedQuantity: number;
};

type RequestedCard = {
  normalizedName: string;
  originalName: string;
  quantity: number;
};

export async function cardRoutes(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/api/cards' && request.method === 'GET') {
    const name = url.searchParams.get('name')?.trim() || null;
    const pageSize = parseBoundedInteger(url.searchParams.get('pageSize'), defaultCardListLimit, 1, maxCardListLimit);
    const page = parseBoundedInteger(url.searchParams.get('page'), 1, 1, 1_000);
    const cards = await listCardsByChasePrice(env.DB, { name, limit: pageSize, offset: (page - 1) * pageSize });
    return createJsonResponse(cards.map(card => mapCardListItemDto(request, card)), 200, request);
  }

  if (url.pathname === '/api/cards/bulk-search' && request.method === 'POST') {
    try {
      const response = await bulkSearchCards(request, env.DB);
      return createJsonResponse(response, 200, request);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return createJsonResponse({ error: 'Invalid JSON body' }, 400, request);
      }

      if (error instanceof Error && (error.message === 'Invalid card names' || error.message === 'Too many card names')) {
        return createJsonResponse({ error: error.message }, 400, request);
      }

      console.error(error);
      return createJsonResponse({ error: 'Internal server error' }, 500, request);
    }
  }

  const match = url.pathname.match(/^\/api\/cards\/([^/]+)$/);

  if (!match || request.method !== 'GET') {
    return createJsonResponse({ error: 'Not found' }, 404, request);
  }

  try {
    const card = await getCardDetails(env.DB, decodeURIComponent(match[1]));
    return createJsonResponse(card, 200, request);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createJsonResponse({ error: error.message }, 404, request);
    }

    console.error(error);
    return createJsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

function mapCardListItemDto(request: Request, card: Awaited<ReturnType<typeof listCardsByChasePrice>>[number]): CardListItemDto {
  return {
    ...card,
    proxiedImageUrl: card.imageUrl ? createProxiedImageUrl(request, card.imageUrl) : null,
    thumbnailImageUrl: card.imageUrl ? createProxiedImageUrl(request, card.imageUrl, 'thumbnail') : null
  };
}

function createProxiedImageUrl(request: Request, imageUrl: string, variant?: 'thumbnail'): string {
  const url = new URL('/api/card-images', request.url);
  url.searchParams.set('url', imageUrl);

  if (variant) {
    url.searchParams.set('variant', variant);
    url.searchParams.set('width', '240');
  }

  return url.toString();
}

function parseBoundedInteger(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = value === null ? Number.NaN : Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

async function getCardDetails(db: D1Database, cardId: string): Promise<CardDetailsDto> {
  const card = await getCardById(db, cardId);

  if (!card) {
    throw new NotFoundError('Card not found');
  }

  return {
    ...card,
    listings: await listActiveListingsByCardId(db, card.id)
  };
}

async function bulkSearchCards(request: Request, db: D1Database): Promise<BulkCardSearchResponseDto> {
  const body = (await request.json()) as BulkCardSearchRequestDto;

  if (!body || typeof body !== 'object' || !Array.isArray(body.cards)) {
    throw new Error('Invalid card names');
  }

  const names = normalizeRequestedCards(body.cards);

  if (names.length > maxBulkSearchNames) {
    throw new Error('Too many card names');
  }

  const matchedCards = await listCardsByExactNormalizedNames(db, names.map(name => name.normalizedName));
  const matchedNormalizedNames = new Set(matchedCards.map(card => normalizeCardName(card.name)));
  const matchedListings = await listActiveListingsByCardIds(db, matchedCards.map(card => card.id));
  const cards = selectRepresentativeCards(names, matchedCards, matchedListings);
  const requestedQuantityByCardId = new Map(
    cards.map(card => [card.id, names.find(name => name.normalizedName === normalizeCardName(card.name))?.quantity ?? 1])
  );
  const allocation = allocateListings(
    matchedListings.filter(listing => requestedQuantityByCardId.has(listing.cardId)),
    requestedQuantityByCardId
  );
  const adapters = createAdapterRegistry();

  return {
    matchedCards: cards.map(card => ({
      id: card.id,
      name: card.name,
      imageUrl: card.imageUrl,
      requestedQuantity: requestedQuantityByCardId.get(card.id) ?? 1,
      missingQuantity: allocation.remainingQuantityByCardId.get(card.id) ?? 0
    })),
    listings: allocation.listings.map(mapBulkListingDto),
    sellerCarts: createSellerCarts(allocation.listings, adapters),
    unmatchedNames: names
      .filter(name => !matchedNormalizedNames.has(name.normalizedName))
      .map(name => name.originalName)
  };
}

function allocateListings(
  listings: Awaited<ReturnType<typeof listActiveListingsByCardIds>>,
  requestedQuantityByCardId: Map<string, number>
): { listings: BulkSearchListing[]; remainingQuantityByCardId: Map<string, number> } {
  const remainingQuantityByCardId = new Map(requestedQuantityByCardId);
  const allocatedListings: BulkSearchListing[] = [];

  for (const listing of [...listings].sort(compareListingsForAllocation)) {
    const remainingQuantity = remainingQuantityByCardId.get(listing.cardId) ?? 0;
    const allocatedQuantity = Math.min(remainingQuantity, listing.quantity);

    if (allocatedQuantity <= 0) {
      continue;
    }

    allocatedListings.push({ ...listing, requestedQuantity: allocatedQuantity });
    remainingQuantityByCardId.set(listing.cardId, remainingQuantity - allocatedQuantity);
  }

  return { listings: allocatedListings, remainingQuantityByCardId };
}

function compareListingsForAllocation(
  left: Awaited<ReturnType<typeof listActiveListingsByCardIds>>[number],
  right: Awaited<ReturnType<typeof listActiveListingsByCardIds>>[number]
): number {
  return left.cardName.localeCompare(right.cardName)
    || left.priceNzd - right.priceNzd
    || left.sellerName.localeCompare(right.sellerName);
}

function selectRepresentativeCards(
  requestedCards: RequestedCard[],
  matchedCards: Card[],
  listings: Awaited<ReturnType<typeof listActiveListingsByCardIds>>
): Card[] {
  const cheapestListingByCardId = new Map<string, Awaited<ReturnType<typeof listActiveListingsByCardIds>>[number]>();
  const hasListingByCardId = new Set<string>();

  for (const listing of listings) {
    hasListingByCardId.add(listing.cardId);
    const current = cheapestListingByCardId.get(listing.cardId);

    if (!current || listing.priceNzd < current.priceNzd) {
      cheapestListingByCardId.set(listing.cardId, listing);
    }
  }

  return requestedCards.flatMap(requestedCard => {
    return matchedCards
      .filter(card => normalizeCardName(card.name) === requestedCard.normalizedName && hasListingByCardId.has(card.id))
      .sort((left, right) => compareCardVariants(left, right, cheapestListingByCardId));
  });
}

function compareCardVariants(
  left: Card,
  right: Card,
  cheapestListingByCardId: Map<string, Awaited<ReturnType<typeof listActiveListingsByCardIds>>[number]>
): number {
  const leftListing = cheapestListingByCardId.get(left.id);
  const rightListing = cheapestListingByCardId.get(right.id);

  if (leftListing && rightListing) {
    return leftListing.priceNzd - rightListing.priceNzd
      || left.setCode.localeCompare(right.setCode)
      || left.collectorNumber - right.collectorNumber;
  }

  if (leftListing) return -1;
  if (rightListing) return 1;

  return left.setCode.localeCompare(right.setCode)
    || left.collectorNumber - right.collectorNumber;
}

function normalizeRequestedCards(cards: BulkCardSearchRequestDto['cards']): RequestedCard[] {
  const names = new Map<string, { normalizedName: string; originalName: string; quantity: number }>();

  for (const card of cards) {
    if (!card || typeof card !== 'object' || typeof card.name !== 'string') {
      continue;
    }

    const normalizedName = normalizeCardName(card.name);
    const quantity = Number.isFinite(card.quantity) ? Math.floor(card.quantity) : 0;

    if (!normalizedName || quantity < 1) {
      continue;
    }

    const existing = names.get(normalizedName);
    if (existing) {
      existing.quantity += quantity;
    } else {
      names.set(normalizedName, {
        normalizedName,
        originalName: card.name.trim(),
        quantity
      });
    }
  }

  return [...names.values()];
}

function mapBulkListingDto(listing: BulkSearchListing): BulkCardSearchListingDto {
  return {
    id: listing.id,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    sellerSlug: listing.sellerSlug,
    condition: listing.condition,
    priceNzd: listing.priceNzd,
    quantity: listing.quantity,
    productUrl: listing.productUrl,
    marketplaceSellerName: listing.marketplaceSellerName,
    marketplaceSellerProfileName: listing.marketplaceSellerProfileName,
    marketplaceSellerLocation: listing.marketplaceSellerLocation,
    marketplaceSellerRating: listing.marketplaceSellerRating,
    marketplaceIsStore: listing.marketplaceIsStore,
    marketplaceAllowPickups: listing.marketplaceAllowPickups,
    lastSeenAt: listing.lastSeenAt,
    cardId: listing.cardId,
    cardName: listing.cardName,
    cardImageUrl: listing.cardImageUrl,
    requestedQuantity: listing.requestedQuantity
  };
}

function createSellerCarts(
  listings: BulkSearchListing[],
  adapters: Map<string, SellerAdapter>
): BulkCardSearchSellerCartDto[] {
  const listingsBySeller = new Map<string, BulkSearchListing[]>();

  for (const listing of listings) {
    const group = listingsBySeller.get(listing.sellerId) ?? [];
    group.push(listing);
    listingsBySeller.set(listing.sellerId, group);
  }

  return [...listingsBySeller.values()].map(sellerListings => {
    const firstListing = sellerListings[0];
    const seller: Seller = {
      id: firstListing.sellerId,
      name: firstListing.sellerName,
      slug: firstListing.sellerSlug,
      websiteUrl: firstListing.sellerWebsiteUrl,
      adapterKey: firstListing.sellerAdapterKey,
      enabled: true
    };
    const cartListings = sellerListings;
    const cartUrl = adapters.get(seller.adapterKey)?.createCartUrl?.(seller, cartListings) ?? null;

    return {
      sellerId: seller.id,
      sellerName: seller.name,
      sellerSlug: seller.slug,
      cartUrl,
      itemCount: cartUrl ? cartListings.reduce((total, listing) => total + listing.requestedQuantity, 0) : 0
    };
  });
}

function normalizeCardName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
