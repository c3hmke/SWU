import type { WorkerEnv } from '../../../env';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { createJsonResponse } from '../../../shared/http/createJsonResponse';
import { SyncSellerHandler } from '../application/SyncSeller/SyncSellerHandler';
import { createAdapterRegistry } from '../infrastructure/adapterRegistry';
import { D1ListingWriter } from '../infrastructure/D1ListingWriter';
import { D1SellerRepository } from '../infrastructure/D1SellerRepository';
import { D1SyncCardRepository } from '../infrastructure/D1SyncCardRepository';
import { D1SyncRunRepository } from '../infrastructure/D1SyncRunRepository';
import { D1UnmatchedListingWriter } from '../infrastructure/D1UnmatchedListingWriter';

export async function sellerSyncRoutes(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname !== '/api/sync/calico-keep' || request.method !== 'POST') {
    return createJsonResponse({ error: 'Not found' }, 404);
  }

  const handler = new SyncSellerHandler(
    new D1SellerRepository(env.DB),
    new D1SyncCardRepository(env.DB),
    createAdapterRegistry(),
    new D1ListingWriter(env.DB),
    new D1UnmatchedListingWriter(env.DB),
    new D1SyncRunRepository(env.DB)
  );

  try {
    const result = await handler.execute({ sellerSlug: 'calico-keep' });
    return createJsonResponse(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createJsonResponse({ error: error.message }, 404);
    }

    console.error(error);
    return createJsonResponse({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
}
