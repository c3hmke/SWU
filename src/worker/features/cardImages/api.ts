import { createJsonResponse } from '../../shared/http/createJsonResponse';

const allowedImageHosts = new Set(['cdn.starwarsunlimited.com']);
const browserCacheSeconds = 60 * 60 * 24;
const edgeCacheSeconds = 60 * 60 * 24 * 30;
const imageCacheOrigin = 'https://card-image-cache.swu-singles-nz.internal';

export async function cardImageRoutes(request: Request, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname !== '/api/card-images' || request.method !== 'GET') {
    return createJsonResponse({ error: 'Not found' }, 404, request);
  }

  const imageUrl = parseAllowedImageUrl(url.searchParams.get('url'));
  if (!imageUrl) {
    return createJsonResponse({ error: 'Invalid image URL' }, 400, request);
  }

  const cacheKey = createCacheKey(imageUrl);
  const cachedResponse = await caches.default.match(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetchImageResponse(imageUrl);
  if (!response) {
    return createJsonResponse({ error: 'Image unavailable' }, 502, request);
  }

  ctx.waitUntil(caches.default.put(cacheKey, response.clone()));

  return response;
}

export async function prewarmCardImage(imageUrlValue: string): Promise<'cached' | 'warmed' | 'skipped' | 'failed'> {
  const imageUrl = parseAllowedImageUrl(imageUrlValue);
  if (!imageUrl) {
    return 'skipped';
  }

  const cacheKey = createCacheKey(imageUrl);
  const cachedResponse = await caches.default.match(cacheKey);
  if (cachedResponse) {
    return 'cached';
  }

  const response = await fetchImageResponse(imageUrl);
  if (!response) {
    return 'failed';
  }

  await caches.default.put(cacheKey, response);
  return 'warmed';
}

async function fetchImageResponse(imageUrl: URL): Promise<Response | null> {
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
    return null;
  }

  const contentType = upstreamResponse.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('image/')) {
    await upstreamResponse.body?.cancel();
    return null;
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: createImageHeaders(contentType)
  });
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

function createCacheKey(imageUrl: URL): Request {
  const cacheUrl = new URL('/api/card-images', imageCacheOrigin);
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
