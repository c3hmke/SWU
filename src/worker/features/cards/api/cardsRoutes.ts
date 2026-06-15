import type { WorkerEnv } from '../../../env';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { createJsonResponse } from '../../../shared/http/createJsonResponse';
import { GetCardHandler } from '../application/GetCard/GetCardHandler';
import { ListCardsHandler } from '../application/ListCards/ListCardsHandler';
import { D1CardListingRepository } from '../infrastructure/D1CardListingRepository';
import { D1CardListRepository } from '../infrastructure/D1CardListRepository';
import { D1CardRepository } from '../infrastructure/D1CardRepository';

export async function cardRoutes(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/api/cards' && request.method === 'GET') {
    const handler = new ListCardsHandler(new D1CardListRepository(env.DB));
    const cards = await handler.execute();
    return createJsonResponse(cards);
  }

  const match = url.pathname.match(/^\/api\/cards\/([^/]+)$/);

  if (!match || request.method !== 'GET') {
    return createJsonResponse({ error: 'Not found' }, 404);
  }

  const handler = new GetCardHandler(
    new D1CardRepository(env.DB),
    new D1CardListingRepository(env.DB)
  );

  try {
    const card = await handler.execute({ cardId: decodeURIComponent(match[1]) });
    return createJsonResponse(card);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createJsonResponse({ error: error.message }, 404);
    }

    console.error(error);
    return createJsonResponse({ error: 'Internal server error' }, 500);
  }
}
