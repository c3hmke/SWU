import { listCardsByChasePrice } from '../cards/queries';
import { prewarmCardImage } from './api';

const DEFAULT_PREWARM_LIMIT = 144;
const DEFAULT_PREWARM_CONCURRENCY = 6;

type PrewarmStatus = Awaited<ReturnType<typeof prewarmCardImage>>;

export type CardImagePrewarmResult = Record<PrewarmStatus, number> & {
  total: number;
};

export async function prewarmHighValueCardImages(db: D1Database): Promise<CardImagePrewarmResult> {
  const cards = await listCardsByChasePrice(db, { name: null, limit: DEFAULT_PREWARM_LIMIT, offset: 0 });
  const imageUrls = cards
    .map(card => card.imageUrl)
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl));
  const statuses = await runWithConcurrency(imageUrls, DEFAULT_PREWARM_CONCURRENCY, prewarmCardImage);

  return statuses.reduce<CardImagePrewarmResult>(
    (result, status) => {
      result[status] += 1;
      result.total += 1;
      return result;
    },
    { cached: 0, warmed: 0, skipped: 0, failed: 0, total: 0 }
  );
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await worker(items[index]);
      }
    })
  );

  return results;
}
