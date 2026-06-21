const DEFAULT_LIMIT = 144;
const DEFAULT_CONCURRENCY = 6;

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

const baseUrl = readStringOption('--base-url') ?? process.env.SWU_API_BASE_URL;
const limit = readNumberOption('--limit', DEFAULT_LIMIT);
const concurrency = readNumberOption('--concurrency', DEFAULT_CONCURRENCY);

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  if (!baseUrl) {
    console.error('Missing --base-url or SWU_API_BASE_URL.');
    printUsage();
    process.exit(1);
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const cards = await fetchCardList(normalizedBaseUrl);
  const imageUrls = cards
    .slice(0, limit)
    .map(card => createPrewarmImageUrl(normalizedBaseUrl, card))
    .filter(url => typeof url === 'string' && url.length > 0);

  if (imageUrls.length === 0) {
    console.log('No proxied image URLs found to prewarm.');
    process.exit(0);
  }

  console.log(`Prewarming ${imageUrls.length} card images from ${normalizedBaseUrl} with concurrency ${concurrency}.`);

  const results = await runWithConcurrency(imageUrls, concurrency, prewarmImage);
  const succeeded = results.filter(result => result.ok).length;
  const failed = results.length - succeeded;

  console.log(`Prewarm complete: ${succeeded} succeeded, ${failed} failed.`);

  if (failed > 0) {
    for (const result of results.filter(result => !result.ok)) {
      console.error(`Failed: ${result.url} (${result.status ?? result.error})`);
    }

    process.exit(1);
  }
}

async function fetchCardList(baseUrl) {
  const response = await fetch(`${baseUrl}/api/cards`);

  if (!response.ok) {
    throw new Error(`Unable to fetch card list: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const preview = (await response.text()).slice(0, 80).replace(/\s+/g, ' ').trim();
    throw new Error(
      `Expected JSON from ${baseUrl}/api/cards but received ${contentType || 'unknown content type'}. ` +
      `Use the Worker/API base URL, not the Pages frontend URL. Response started with: ${preview}`
    );
  }

  const cards = await response.json();

  if (!Array.isArray(cards)) {
    throw new Error('Card list response was not an array.');
  }

  return cards;
}

function createPrewarmImageUrl(baseUrl, card) {
  if (typeof card.proxiedImageUrl === 'string' && card.proxiedImageUrl.length > 0) {
    return card.proxiedImageUrl;
  }

  if (typeof card.imageUrl !== 'string' || card.imageUrl.length === 0) {
    return null;
  }

  const url = new URL('/api/card-images', baseUrl);
  url.searchParams.set('url', card.imageUrl);
  return url.toString();
}

async function prewarmImage(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      await response.body?.cancel();
      return { ok: false, url, status: response.status };
    }

    await response.arrayBuffer();
    return { ok: true, url, status: response.status };
  } catch (error) {
    return { ok: false, url, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
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

function readStringOption(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }

  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }

  return value;
}

function readNumberOption(name, fallback) {
  const value = readStringOption(name);
  if (value === null) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

function printUsage() {
  console.log(`Usage: npm run images:prewarm -- --base-url <url> [--limit 144] [--concurrency 6]

Examples:
  npm run images:prewarm -- --base-url https://swu-singles-nz.pages.dev
  SWU_API_BASE_URL=https://swu-singles-nz.pages.dev npm run images:prewarm
`);
}
