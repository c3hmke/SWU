import type {
  BulkCardSearchListingDto,
  BulkCardSearchRequestDto,
  BulkCardSearchResponseDto,
  BulkCardSearchSellerCartDto,
  CardDetailsDto
} from '../../../shared/contracts/cards';
import type { WorkerEnv } from '../../env';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { createJsonResponse } from '../../shared/http/createJsonResponse';
import { createAdapterRegistry } from '../sellerSync/calicoKeep';
import type { Seller, SellerAdapter } from '../sellerSync/model';
import {
  getCardById,
  listActiveListingsByCardId,
  listActiveListingsByCardIds,
  listCardsByChasePrice,
  listCardsByExactNormalizedNames
} from './queries';

const maxBulkSearchNames = 150;

type BulkSearchListing = Awaited<ReturnType<typeof listActiveListingsByCardIds>>[number] & {
  requestedQuantity: number;
};

export async function cardRoutes(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/api/cards' && request.method === 'GET') {
    const name = url.searchParams.get('name')?.trim() || null;
    const cards = await listCardsByChasePrice(env.DB, { name });
    return createJsonResponse(cards, 200, request);
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

  const cards = await listCardsByExactNormalizedNames(db, names.map(name => name.normalizedName));
  const matchedNormalizedNames = new Set(cards.map(card => normalizeCardName(card.name)));
  const requestedQuantityByCardId = new Map(
    cards.map(card => [card.id, names.find(name => name.normalizedName === normalizeCardName(card.name))?.quantity ?? 1])
  );
  const listings: BulkSearchListing[] = (await listActiveListingsByCardIds(db, cards.map(card => card.id)))
    .map(listing => ({ ...listing, requestedQuantity: requestedQuantityByCardId.get(listing.cardId) ?? 1 }))
    .filter(listing => listing.quantity >= listing.requestedQuantity);
  const adapters = createAdapterRegistry();

  return {
    matchedCards: cards.map(card => ({
      id: card.id,
      name: card.name,
      imageUrl: card.imageUrl,
      requestedQuantity: requestedQuantityByCardId.get(card.id) ?? 1
    })),
    listings: listings.map(mapBulkListingDto),
    sellerCarts: createSellerCarts(listings, adapters),
    unmatchedNames: names
      .filter(name => !matchedNormalizedNames.has(name.normalizedName))
      .map(name => name.originalName)
  };
}

function normalizeRequestedCards(cards: BulkCardSearchRequestDto['cards']): Array<{
  normalizedName: string;
  originalName: string;
  quantity: number;
}> {
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
    const cartListings = selectCheapestListingPerCard(sellerListings);
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

function selectCheapestListingPerCard(
  listings: BulkSearchListing[]
): BulkSearchListing[] {
  const listingsByCard = new Map<string, BulkSearchListing>();

  for (const listing of listings) {
    const current = listingsByCard.get(listing.cardId);

    if (!current || listing.priceNzd < current.priceNzd) {
      listingsByCard.set(listing.cardId, listing);
    }
  }

  return [...listingsByCard.values()];
}

function normalizeCardName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
