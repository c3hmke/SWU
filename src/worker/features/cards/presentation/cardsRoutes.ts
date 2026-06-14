import type { WorkerEnv } from '../../../env';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { createJsonResponse } from '../../../shared/http/createJsonResponse';
import { GetCardHandler } from '../application/GetCard/GetCardHandler';
import { D1CardListingRepository } from '../infrastructure/D1CardListingRepository';
import { D1CardRepository } from '../infrastructure/D1CardRepository';

export async function cardRoutes(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
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
