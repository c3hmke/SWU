import { createCardSlug } from '../../../shared/cardSlugs';
import type { WorkerEnv } from '../../env';
import { listCardsForSitemap } from '../cards/queries';

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: string;
};

export async function createSitemapResponse(env: WorkerEnv): Promise<Response> {
  const siteBaseUrl = (env.SITE_BASE_URL || 'https://www.swu.nz').replace(/\/$/, '');
  const cards = await listCardsForSitemap(env.DB);
  const urls: SitemapUrl[] = [
    { loc: `${siteBaseUrl}/cards`, changefreq: 'daily', priority: '1.0' },
    { loc: `${siteBaseUrl}/bulk-search`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${siteBaseUrl}/contact`, changefreq: 'monthly', priority: '0.3' },
    ...cards.map(card => ({
      loc: `${siteBaseUrl}/cards/${createCardSlug(card)}`,
      lastmod: formatSitemapDate(card.updated_at),
      changefreq: 'weekly' as const,
      priority: '0.8'
    }))
  ];

  return new Response(renderSitemap(urls), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
}

function renderSitemap(urls: SitemapUrl[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(renderUrl),
    '</urlset>'
  ].join('\n');
}

function renderUrl(url: SitemapUrl): string {
  return [
    '  <url>',
    `    <loc>${escapeXml(url.loc)}</loc>`,
    url.lastmod ? `    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : null,
    url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>` : null,
    url.priority ? `    <priority>${url.priority}</priority>` : null,
    '  </url>'
  ].filter(Boolean).join('\n');
}

function formatSitemapDate(value: string): string | undefined {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString().slice(0, 10);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
