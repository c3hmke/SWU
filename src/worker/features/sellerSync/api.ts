import type { WorkerEnv } from '../../env';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { createJsonResponse } from '../../shared/http/createJsonResponse';
import { createAdapterRegistry } from './adapters';
import { syncSeller } from './syncSeller';

export async function sellerSyncRoutes(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/sync\/([^/]+)$/);

  if (!match || request.method !== 'POST') {
    return createJsonResponse({ error: 'Not found' }, 404, request);
  }

  if (!isAuthorizedSyncRequest(request, env)) {
    return createJsonResponse({ error: 'Unauthorized' }, 401, request);
  }

  try {
    const result = await syncSeller(env.DB, createAdapterRegistry(), decodeURIComponent(match[1]));
    return createJsonResponse(result, 200, request);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return createJsonResponse({ error: error.message }, 404, request);
    }

    console.error(error);
    return createJsonResponse({ error: error instanceof Error ? error.message : 'Internal server error' }, 500, request);
  }
}

function isAuthorizedSyncRequest(request: Request, env: WorkerEnv): boolean {
  const authorization = request.headers.get('authorization');
  return authorization === `Bearer ${env.SYNC_API_TOKEN}`;
}
