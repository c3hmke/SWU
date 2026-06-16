import type { WorkerEnv } from '../../env';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { createJsonResponse } from '../../shared/http/createJsonResponse';
import { createAdapterRegistry } from './calicoKeep';
import { syncSeller } from './syncSeller';

export async function sellerSyncRoutes(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname !== '/api/sync/calico-keep' || request.method !== 'POST') {
    return createJsonResponse({ error: 'Not found' }, 404, request);
  }

  try {
    const result = await syncSeller(env.DB, createAdapterRegistry(), 'calico-keep');
    return createJsonResponse(result, 200, request);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createJsonResponse({ error: error.message }, 404, request);
    }

    console.error(error);
    return createJsonResponse({ error: error instanceof Error ? error.message : 'Internal server error' }, 500, request);
  }
}
