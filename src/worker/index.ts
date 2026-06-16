import type { WorkerEnv } from './env';
import { createJsonResponse, createOptionsResponse } from './shared/http/createJsonResponse';
import { cardRoutes } from './features/cards/api';
import { sellerSyncRoutes } from './features/sellerSync/api';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return createOptionsResponse(request);
    }

    if (url.pathname === '/api/cards' || url.pathname.startsWith('/api/cards/')) {
      return cardRoutes(request, env);
    }

    if (url.pathname.startsWith('/api/sync/')) {
      return sellerSyncRoutes(request, env);
    }

    if (url.pathname === '/api/health') {
      return createJsonResponse({ status: 'ok' }, 200, request);
    }

    return createJsonResponse({ error: 'Not found' }, 404, request);
  }
};
