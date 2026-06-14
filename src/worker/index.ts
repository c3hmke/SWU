import type { WorkerEnv } from './env';
import { createJsonResponse } from './shared/http/createJsonResponse';
import { cardRoutes } from './features/cards/presentation/cardsRoutes';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/cards/')) {
      return cardRoutes(request, env);
    }

    if (url.pathname === '/api/health') {
      return createJsonResponse({ status: 'ok' });
    }

    return createJsonResponse({ error: 'Not found' }, 404);
  }
};
