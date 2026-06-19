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

  if (!body || typeof body !== 'object' || !Array.isArray(body.names)) {
    throw new Error('Invalid card names');
  }

  const names = [...new Map(
    body.names
      .filter((name): name is string => typeof name === 'string')
      .map(name => [normalizeCardName(name), name.trim()] as const)
      .filter(([normalizedName]) => normalizedName.length > 0)
  ).entries()]
    .map(([normalizedName, originalName]) => ({ normalizedName, originalName }));

  if (names.length > maxBulkSearchNames) {
    throw new Error('Too many card names');
  }

  const cards = await listCardsByExactNormalizedNames(db, names.map(name => name.normalizedName));
  const matchedNormalizedNames = new Set(cards.map(card => normalizeCardName(card.name)));
  const listings = await listActiveListingsByCardIds(db, cards.map(card => card.id));
  const adapters = createAdapterRegistry();

  return {
    matchedCards: cards.map(card => ({
      id: card.id,
      name: card.name,
      imageUrl: card.imageUrl
    })),
    listings: listings.map(mapBulkListingDto),
    sellerCarts: createSellerCarts(listings, adapters),
    unmatchedNames: names
      .filter(name => !matchedNormalizedNames.has(name.normalizedName))
      .map(name => name.originalName)
  };
}

function mapBulkListingDto(listing: Awaited<ReturnType<typeof listActiveListingsByCardIds>>[number]): BulkCardSearchListingDto {
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
    cardImageUrl: listing.cardImageUrl
  };
}

function createSellerCarts(
  listings: Awaited<ReturnType<typeof listActiveListingsByCardIds>>,
  adapters: Map<string, SellerAdapter>
): BulkCardSearchSellerCartDto[] {
  const listingsBySeller = new Map<string, Awaited<ReturnType<typeof listActiveListingsByCardIds>>>();

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
      itemCount: cartUrl ? cartListings.length : 0
    };
  });
}

function selectCheapestListingPerCard(
  listings: Awaited<ReturnType<typeof listActiveListingsByCardIds>>
): Awaited<ReturnType<typeof listActiveListingsByCardIds>> {
  const listingsByCard = new Map<string, Awaited<ReturnType<typeof listActiveListingsByCardIds>>[number]>();

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
