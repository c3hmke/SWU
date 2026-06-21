import type { WorkerEnv } from './env';
import { createJsonResponse, createOptionsResponse } from './shared/http/createJsonResponse';
import { cardRoutes } from './features/cards/api';
import { sellerSyncRoutes } from './features/sellerSync/api';
import { createAdapterRegistry } from './features/sellerSync/adapters';
import { syncSeller } from './features/sellerSync/syncSeller';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return createOptionsResponse(request);
    }

    if (url.pathname === '/api/cards' || url.pathname.startsWith('/api/cards/')) {
      const rateLimit = await env.READ_RATE_LIMITER.limit({ key: createReadRateLimitKey(request) });
      if (!rateLimit.success) {
        return createJsonResponse({ error: 'Too many requests' }, 429, request);
      }

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
    for (const sellerSlug of ['calico-keep', 'rogue-ops', 'spellbound-games', 'tcg-collector-nz', 'badgers-sett-nz']) {
      try {
        await syncSeller(env.DB, createAdapterRegistry(), sellerSlug);
      } catch (error) {
        console.error(`Scheduled sync failed for ${sellerSlug}`, error);
      }
    }
  }
};

function createReadRateLimitKey(request: Request): string {
  return `cards:${request.headers.get('cf-connecting-ip') ?? 'unknown'}`;
}
