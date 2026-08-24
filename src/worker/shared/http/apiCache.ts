const cacheOrigin = 'https://api-cache.swu-singles-nz.internal';

// Card and listing data only changes once a day, via the seller sync cron ("0 14 * * *" in
// wrangler.toml). Rather than expiring cache entries on a short timer, the cache key itself
// embeds the current "data epoch" - the most recent 14:00 UTC boundary - so every entry is
// naturally busted at the moment fresh data lands, and stays hot for the ~24h between syncs
// otherwise. A manual/ad-hoc sync outside the cron won't be reflected until the next epoch.
const dailyRefreshUtcHour = 14;
const cacheStorageTtlSeconds = 26 * 60 * 60;

export async function readThroughCache<T>(
  request: Request,
  ctx: ExecutionContext,
  compute: () => Promise<T>
): Promise<T> {
  const cacheKey = createCacheKey(request);
  const cached = await caches.default.match(cacheKey);

  if (cached) {
    return cached.json<T>();
  }

  const value = await compute();

  ctx.waitUntil(
    caches.default.put(
      cacheKey,
      new Response(JSON.stringify(value), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': `public, max-age=${cacheStorageTtlSeconds}`
        }
      })
    )
  );

  return value;
}

function createCacheKey(request: Request): Request {
  const url = new URL(request.url);
  const cacheUrl = new URL(url.pathname, cacheOrigin);
  const sortedParams = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));

  for (const [key, value] of sortedParams) {
    cacheUrl.searchParams.append(key, value);
  }

  cacheUrl.searchParams.append('_epoch', currentDataEpoch());

  return new Request(cacheUrl.toString(), { method: 'GET' });
}

function currentDataEpoch(): string {
  const now = new Date();
  const mostRecentBoundary = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), dailyRefreshUtcHour));

  if (now.getTime() < mostRecentBoundary.getTime()) {
    mostRecentBoundary.setUTCDate(mostRecentBoundary.getUTCDate() - 1);
  }

  return mostRecentBoundary.toISOString();
}
