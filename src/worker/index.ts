import type { SellerSyncQueueMessage, WorkerEnv } from './env';
import { createJsonResponse, createOptionsResponse } from './shared/http/createJsonResponse';
import { cardRoutes } from './features/cards/api';
import { cardImageRoutes } from './features/cardImages/api';
import { prewarmHighValueCardImages } from './features/cardImages/prewarm';
import { sellerSyncRoutes } from './features/sellerSync/api';
import { createAdapterRegistry } from './features/sellerSync/adapters';
import { syncSeller } from './features/sellerSync/syncSeller';
import { contactRoutes } from './features/contact/api';

const SCHEDULED_SELLER_SLUGS = [
  'calico-keep',
  'rogue-ops',
  'spellbound-games',
  'tcg-collector-nz',
  'badgers-sett-nz',
  'bea-dnd-games',
  'goblin-games',
  'iron-knight-gaming',
  'fetch-marketplace'
];

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return createOptionsResponse(request);
    }

    if (url.pathname === '/api/card-images') {
      if (!isAuthorizedApiRequest(request, env)) {
        const rateLimit = await env.IMAGE_RATE_LIMITER.limit({ key: createImageRateLimitKey(request) });
        if (!rateLimit.success)
          return createJsonResponse({ error: 'Too many requests' }, 429, request);
      }

      return cardImageRoutes(request, ctx);
    }

    if (url.pathname === '/api/cards' || url.pathname.startsWith('/api/cards/')) {
      const rateLimit = await env.READ_RATE_LIMITER.limit({ key: createReadRateLimitKey(request) });
      if (!rateLimit.success)
        return createJsonResponse({ error: 'Too many requests' }, 429, request);

      return cardRoutes(request, env);
    }

    if (url.pathname.startsWith('/api/sync/')) {
      return sellerSyncRoutes(request, env);
    }

    if (url.pathname === '/api/contact') {
      const rateLimit = await env.CONTACT_RATE_LIMITER.limit({ key: createContactRateLimitKey(request) });
      if (!rateLimit.success)
        return createJsonResponse({ error: 'Too many contact enquiries' }, 429, request);

      return contactRoutes(request, env);
    }

    if (url.pathname === '/api/health')
      return createJsonResponse({ status: 'ok' }, 200, request);

    return createJsonResponse({ error: 'Not found' }, 404, request);
  },

  async scheduled(_controller: ScheduledController, env: WorkerEnv, _ctx: ExecutionContext): Promise<void> {
    await env.SELLER_SYNC_QUEUE.sendBatch(
      SCHEDULED_SELLER_SLUGS.map(sellerSlug => ({
        body: { sellerSlug }
      }))
    );

    try {
      const result = await prewarmHighValueCardImages(env.DB);
      console.log('Scheduled card image prewarm complete', result);
    } catch (error) {
      console.error('Scheduled card image prewarm failed', error);
    }
  },

  async queue(batch: MessageBatch<SellerSyncQueueMessage>, env: WorkerEnv): Promise<void> {
    for (const message of batch.messages) {
      const sellerSlug = message.body.sellerSlug;

      try {
        await syncSeller(env.DB, createAdapterRegistry(), sellerSlug);
        message.ack();
      } catch (error) {
        console.error(`Queued sync failed for ${sellerSlug}`, error);
        message.retry({ delaySeconds: 300 });
      }
    }
  }
};

function createReadRateLimitKey(request: Request): string {
  return `cards:${request.headers.get('cf-connecting-ip') ?? 'unknown'}`;
}

function createImageRateLimitKey(request: Request): string {
  return `card-images:${request.headers.get('cf-connecting-ip') ?? 'unknown'}`;
}

function createContactRateLimitKey(request: Request): string {
  return `contact:${request.headers.get('cf-connecting-ip') ?? 'unknown'}`;
}

function isAuthorizedApiRequest(request: Request, env: WorkerEnv): boolean {
  return request.headers.get('authorization') === `Bearer ${env.SYNC_API_TOKEN}`;
}
