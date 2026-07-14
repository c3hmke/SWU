const baseUrl = (process.env.SEO_BASE_URL ?? 'https://www.swu.nz').replace(/\/$/, '');

const checks = [];

await checkRobotsTxt();
const sitemapXml = await checkSitemap();
const cardPath = extractFirstCardPath(sitemapXml);
await checkCardsPage();
await checkCardPage(cardPath);

console.log(`SEO checks passed for ${baseUrl}`);
for (const check of checks) {
  console.log(`- ${check}`);
}

async function checkRobotsTxt() {
  const response = await fetchUrl('/robots.txt', 'text/plain');
  assertIncludes(response.body, 'User-agent: *', 'robots.txt should define user-agent rules');
  assertIncludes(response.body, 'Allow: /', 'robots.txt should allow crawling');
  assertIncludes(response.body, `Sitemap: ${baseUrl}/sitemap.xml`, 'robots.txt should point to the canonical sitemap');
  checks.push('robots.txt allows crawling and references sitemap.xml');
}

async function checkSitemap() {
  const response = await fetchUrl('/sitemap.xml', 'application/xml');
  assertIncludes(response.body, '<urlset', 'sitemap.xml should contain a urlset');
  assertIncludes(response.body, `<loc>${baseUrl}/cards</loc>`, 'sitemap.xml should include the card list page');
  assertIncludes(response.body, `<loc>${baseUrl}/bulk-search</loc>`, 'sitemap.xml should include bulk search');
  assertIncludes(response.body, `<loc>${baseUrl}/contact</loc>`, 'sitemap.xml should include contact');
  assert(!response.body.includes('api.swu.nz'), 'sitemap.xml should not contain API-domain URLs');
  assert(!response.body.includes('workers.dev'), 'sitemap.xml should not contain workers.dev URLs');
  checks.push('sitemap.xml contains canonical public URLs');
  return response.body;
}

async function checkCardsPage() {
  const response = await fetchUrl('/cards', 'text/html');
  assertIncludes(response.body, '<link rel="canonical" href="https://www.swu.nz/cards"', '/cards should include canonical metadata');
  assertIncludes(response.body, 'High value Star Wars: Unlimited cards', '/cards should include crawlable high-value heading');
  assertMatches(response.body, /<a href="\/cards\/[^"]+">[^<]+<\/a>/, '/cards should include crawlable card links');
  checks.push('/cards initial HTML contains crawlable high-value card links');
}

async function checkCardPage(cardPath) {
  const response = await fetchUrl(cardPath, 'text/html');
  assertIncludes(response.body, '<!-- card seo -->', 'card page should include server-injected SEO marker');
  assertMatches(response.body, /<title>[^<]+ \| SWU Singles NZ<\/title>/, 'card page should include card-specific title');
  assertIncludes(response.body, `<link rel="canonical" href="${baseUrl}${cardPath}"`, 'card page should include canonical URL');
  assertIncludes(response.body, `<meta property="og:url" content="${baseUrl}${cardPath}"`, 'card page should include Open Graph URL');
  assertMatches(response.body, /<meta property="og:image" content="https?:\/\/[^"]+"/, 'card page should include Open Graph image');
  assertIncludes(response.body, '<script type="application/ld+json">', 'card page should include JSON-LD');
  assertIncludes(response.body, '"@type":"Product"', 'card JSON-LD should describe a Product');
  assertIncludes(response.body, '<script type="module"', 'card page should still include the app bundle');
  assert(!response.body.includes('api.swu.nz/api/cards'), 'card page metadata should not canonicalize API URLs');
  assert(!response.body.includes('workers.dev'), 'card page metadata should not contain workers.dev URLs');
  checks.push(`${cardPath} initial HTML contains card-specific SEO metadata`);
}

function extractFirstCardPath(sitemapXml) {
  const matches = [...sitemapXml.matchAll(/<loc>https:\/\/www\.swu\.nz(\/cards\/[^<]+)<\/loc>/g)];
  const cardPath = matches.find(match => match[1] !== '/cards')?.[1];
  assert(cardPath, 'sitemap.xml should include at least one card detail URL');
  return cardPath;
}

async function fetchUrl(path, expectedContentType) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      accept: expectedContentType
    }
  });
  const body = await response.text();

  assert(response.ok, `${url} should return 2xx, got ${response.status}\n${body.slice(0, 500)}`);

  const contentType = response.headers.get('content-type') ?? '';
  assert(
    contentType.includes(expectedContentType),
    `${url} should return ${expectedContentType}, got ${contentType || 'no content-type'}`
  );

  return { body, response };
}

function assertIncludes(value, expected, message) {
  assert(value.includes(expected), `${message}\nExpected to find: ${expected}`);
}

function assertMatches(value, pattern, message) {
  assert(pattern.test(value), `${message}\nExpected to match: ${pattern}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
