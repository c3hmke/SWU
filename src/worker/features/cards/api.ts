import type { BulkCardSearchRequestDto, BulkCardSearchResponseDto, CardDetailsDto } from '../../../shared/contracts/cards';
import type { WorkerEnv } from '../../env';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { createJsonResponse } from '../../shared/http/createJsonResponse';
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

  return {
    matchedCards: cards.map(card => ({
      id: card.id,
      name: card.name,
      imageUrl: card.imageUrl
    })),
    listings,
    unmatchedNames: names
      .filter(name => !matchedNormalizedNames.has(name.normalizedName))
      .map(name => name.originalName)
  };
}

function normalizeCardName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
