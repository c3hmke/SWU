import type { WorkerEnv } from './env';
import { createJsonResponse, createOptionsResponse } from './shared/http/createJsonResponse';
import { cardRoutes } from './features/cards/api';
import { sellerSyncRoutes } from './features/sellerSync/api';
import { createAdapterRegistry } from './features/sellerSync/calicoKeep';
import { syncSeller } from './features/sellerSync/syncSeller';

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
  },

  async scheduled(_controller: ScheduledController, env: WorkerEnv, _ctx: ExecutionContext): Promise<void> {
    await syncSeller(env.DB, createAdapterRegistry(), 'calico-keep');
  }
};
