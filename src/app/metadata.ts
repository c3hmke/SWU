export type PageMetadata = {
  title: string;
  description: string;
  canonicalPath: string;
  imageUrl?: string | null;
  type?: 'website' | 'product';
};

const siteName = 'SWU Singles NZ';
const siteBaseUrl = 'https://www.swu.nz';
const defaultMetadata: PageMetadata = {
  title: 'SWU Singles NZ | Star Wars: Unlimited Card Prices in New Zealand',
  description: 'Search Star Wars: Unlimited singles from New Zealand sellers, compare current prices, and find available SWU cards.',
  canonicalPath: '/cards',
  type: 'website'
};

export function applyPageMetadata(metadata: Partial<PageMetadata>) {
  const nextMetadata = { ...defaultMetadata, ...metadata };
  const canonicalUrl = new URL(nextMetadata.canonicalPath, siteBaseUrl).toString();

  document.title = nextMetadata.title;
  setLinkTag('canonical', canonicalUrl);
  setMetaTag('name', 'description', nextMetadata.description);
  setMetaTag('property', 'og:type', nextMetadata.type ?? 'website');
  setMetaTag('property', 'og:site_name', siteName);
  setMetaTag('property', 'og:title', nextMetadata.title);
  setMetaTag('property', 'og:description', nextMetadata.description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('name', 'twitter:card', nextMetadata.imageUrl ? 'summary_large_image' : 'summary');
  setMetaTag('name', 'twitter:title', nextMetadata.title);
  setMetaTag('name', 'twitter:description', nextMetadata.description);

  if (nextMetadata.imageUrl) {
    setMetaTag('property', 'og:image', nextMetadata.imageUrl);
    setMetaTag('name', 'twitter:image', nextMetadata.imageUrl);
  } else {
    removeMetaTag('property', 'og:image');
    removeMetaTag('name', 'twitter:image');
  }
}

function setMetaTag(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${escapeSelector(key)}"]`;
  const element = document.head.querySelector<HTMLMetaElement>(selector) ?? createMetaTag(attribute, key);
  element.content = content;
}

function removeMetaTag(attribute: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attribute}="${escapeSelector(key)}"]`)?.remove();
}

function createMetaTag(attribute: 'name' | 'property', key: string): HTMLMetaElement {
  const element = document.createElement('meta');
  element.setAttribute(attribute, key);
  document.head.append(element);
  return element;
}

function setLinkTag(rel: string, href: string) {
  const element = document.head.querySelector<HTMLLinkElement>(`link[rel="${escapeSelector(rel)}"]`) ?? createLinkTag(rel);
  element.href = href;
}

function createLinkTag(rel: string): HTMLLinkElement {
  const element = document.createElement('link');
  element.rel = rel;
  document.head.append(element);
  return element;
}

function escapeSelector(value: string): string {
  return window.CSS?.escape ? window.CSS.escape(value) : value.replace(/"/g, '\\"');
}
