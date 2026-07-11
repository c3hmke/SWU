import type { CardListItemDto } from '../../src/shared/contracts/cards';

type PagesEnv = {
  API_BASE_URL?: string;
  VITE_API_BASE_URL?: string;
};

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const response = await context.next();

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return response;
  }

  const [html, cards] = await Promise.all([
    readHtml(response, context.request),
    fetchHighValueCards(context.env)
  ]);

  if (!html || cards.length === 0) {
    return response;
  }

  return new Response(injectHighValueLinks(html, cards), {
    status: response.status,
    statusText: response.statusText,
    headers: createHtmlHeaders(response.headers)
  });
};

async function fetchHighValueCards(env: PagesEnv): Promise<CardListItemDto[]> {
  const apiBaseUrl = (env.API_BASE_URL || env.VITE_API_BASE_URL || 'https://api.swu.nz').replace(/\/$/, '');
  const response = await fetch(`${apiBaseUrl}/api/cards?page=1&pageSize=12`, {
    headers: { accept: 'application/json' }
  });

  if (!response.ok) {
    return [];
  }

  return response.json<CardListItemDto[]>();
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

function injectHighValueLinks(html: string, cards: CardListItemDto[]): string {
  const links = cards
    .map(card => `      <li><a href="/cards/${escapeAttribute(card.slug)}">${escapeHtml(card.name)}</a></li>`)
    .join('\n');
  const section = [
    '<section aria-label="High value Star Wars Unlimited cards">',
    '    <h1>SWU Singles NZ</h1>',
    '    <h2>High value Star Wars: Unlimited cards</h2>',
    '    <ul>',
    links,
    '    </ul>',
    '  </section>'
  ].join('\n  ');

  return html.replace('<div id="app"></div>', `<div id="app">\n  ${section}\n  </div>`);
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
