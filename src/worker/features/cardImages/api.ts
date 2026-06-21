import { createJsonResponse } from '../../shared/http/createJsonResponse';

const allowedImageHosts = new Set(['cdn.starwarsunlimited.com']);
const browserCacheSeconds = 60 * 60 * 24;
const edgeCacheSeconds = 60 * 60 * 24 * 30;

export async function cardImageRoutes(request: Request, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname !== '/api/card-images' || request.method !== 'GET') {
    return createJsonResponse({ error: 'Not found' }, 404, request);
  }

  const imageUrl = parseAllowedImageUrl(url.searchParams.get('url'));
  if (!imageUrl) {
    return createJsonResponse({ error: 'Invalid image URL' }, 400, request);
  }

  const cacheKey = createCacheKey(request, imageUrl);
  const cachedResponse = await caches.default.match(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const upstreamResponse = await fetch(imageUrl.toString(), {
    headers: {
      accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    },
    cf: {
      cacheEverything: true,
      cacheTtl: edgeCacheSeconds
    }
  });

  if (!upstreamResponse.ok) {
    return createJsonResponse({ error: 'Image unavailable' }, upstreamResponse.status, request);
  }

  const contentType = upstreamResponse.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('image/')) {
    return createJsonResponse({ error: 'Invalid image response' }, 502, request);
  }

  const response = new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: createImageHeaders(contentType)
  });
  ctx.waitUntil(caches.default.put(cacheKey, response.clone()));

  return response;
}

function parseAllowedImageUrl(value: string | null): URL | null {
  if (!value) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || !allowedImageHosts.has(url.hostname)) {
    return null;
  }

  return url;
}

function createCacheKey(request: Request, imageUrl: URL): Request {
  const cacheUrl = new URL('/api/card-images', request.url);
  cacheUrl.searchParams.set('url', imageUrl.toString());

  return new Request(cacheUrl.toString(), { method: 'GET' });
}

function createImageHeaders(contentType: string): Headers {
  return new Headers({
    'cache-control': `public, max-age=${browserCacheSeconds}, s-maxage=${edgeCacheSeconds}, immutable`,
    'content-type': contentType,
    'x-content-type-options': 'nosniff'
  });
}
