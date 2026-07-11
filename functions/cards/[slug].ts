import type { CardDetailsDto } from '../../src/shared/contracts/cards';

type PagesEnv = {
  API_BASE_URL?: string;
  VITE_API_BASE_URL?: string;
};

type SeoTag = {
  name?: string;
  property?: string;
  content: string;
};

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const response = await context.next();

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return response;
  }

  const slug = readSlug(context.params.slug);
  if (!slug) {
    return response;
  }

  const card = await fetchCard(context.env, slug);
  if (!card) {
    return response;
  }

  const requestUrl = new URL(context.request.url);
  const canonicalPath = `/cards/${card.slug}`;

  if (requestUrl.pathname !== canonicalPath) {
    requestUrl.pathname = canonicalPath;
    return Response.redirect(requestUrl.toString(), 301);
  }

  const html = await readHtml(response, context.request);
  if (!html) {
    return response;
  }

  return new Response(injectCardSeo(html, card, requestUrl), {
    status: response.status,
    statusText: response.statusText,
    headers: createHtmlHeaders(response.headers)
  });
};

function readSlug(value: string | string[]): string | null {
  return Array.isArray(value) ? value[0] ?? null : value || null;
}

async function fetchCard(env: PagesEnv, slug: string): Promise<CardDetailsDto | null> {
  const apiBaseUrl = (env.API_BASE_URL || env.VITE_API_BASE_URL || 'https://api.swu.nz').replace(/\/$/, '');
  const response = await fetch(`${apiBaseUrl}/api/cards/${encodeURIComponent(slug)}`, {
    headers: { accept: 'application/json' }
  });

  if (!response.ok) {
    return null;
  }

  return response.json<CardDetailsDto>();
}

async function readHtml(response: Response, request: Request): Promise<string | null> {
  const contentType = response.headers.get('content-type') ?? '';

  if (response.ok && contentType.includes('text/html')) {
    return response.text();
  }

  const appShellResponse = await fetch(new URL('/', request.url));
  if (!appShellResponse.ok) {
    return null;
  }

  return appShellResponse.text();
}

function createHtmlHeaders(headers: Headers): Headers {
  const nextHeaders = new Headers(headers);
  nextHeaders.set('content-type', 'text/html; charset=utf-8');
  nextHeaders.set('cache-control', 'public, max-age=300');
  nextHeaders.delete('content-length');
  return nextHeaders;
}

function injectCardSeo(html: string, card: CardDetailsDto, requestUrl: URL): string {
  const title = `${card.name} | SWU Singles NZ`;
  const description = createDescription(card);
  const imageUrl = card.imageUrl ?? `${requestUrl.origin}/favicon.ico`;
  const canonicalUrl = `${requestUrl.origin}/cards/${card.slug}`;
  const tags: SeoTag[] = [
    { name: 'description', content: description },
    { property: 'og:type', content: 'product' },
    { property: 'og:site_name', content: 'SWU Singles NZ' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:image', content: imageUrl },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl }
  ];
  const seo = [
    '<!-- card seo -->',
    `<title>${escapeHtml(title)}</title>`,
    `<link rel="canonical" href="${escapeAttribute(canonicalUrl)}">`,
    ...tags.map(renderMetaTag),
    `<script type="application/ld+json">${escapeJsonScript(createStructuredData(card, canonicalUrl, imageUrl))}</script>`
  ].join('\n    ');

  return html
    .replace(/<title>.*?<\/title>/i, '')
    .replace('</head>', `    ${seo}\n  </head>`);
}

function createDescription(card: CardDetailsDto): string {
  const setLabel = card.setName || card.setCode;
  const lowestPrice = card.listings.length
    ? Math.min(...card.listings.map(listing => listing.priceNzd))
    : null;

  if (lowestPrice !== null) {
    return `Compare current NZ listings for ${card.name} from ${setLabel}. Lowest listed price: ${formatPrice(lowestPrice)}.`;
  }

  return `View ${card.name} from ${setLabel} in the SWU Singles NZ card database.`;
}

function createStructuredData(card: CardDetailsDto, canonicalUrl: string, imageUrl: string): Record<string, unknown> {
  const prices = card.listings.map(listing => listing.priceNzd);
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: card.name,
    image: imageUrl,
    url: canonicalUrl,
    sku: card.id,
    category: 'Star Wars: Unlimited trading card',
    brand: {
      '@type': 'Brand',
      name: 'Star Wars: Unlimited'
    }
  };

  if (prices.length > 0) {
    structuredData.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'NZD',
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: card.listings.length,
      availability: 'https://schema.org/InStock',
      url: canonicalUrl
    };
  }

  return structuredData;
}

function renderMetaTag(tag: SeoTag): string {
  const key = tag.name ? 'name' : 'property';
  const value = tag.name ?? tag.property ?? '';
  return `<meta ${key}="${escapeAttribute(value)}" content="${escapeAttribute(tag.content)}">`;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD'
  }).format(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function escapeJsonScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
