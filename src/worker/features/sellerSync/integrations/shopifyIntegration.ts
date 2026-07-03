import type { ExternalListing, Seller, SellerAdapter, SellerCartListing, SyncCard } from '../model';
import { normalizeCondition } from '../../../shared/conditionNormalizer';

const DEFAULT_MAX_PAGES = 50;
const DEFAULT_PAGE_SIZE = 250;
const USER_AGENT = 'SWU Singles NZ inventory sync (+https://swu-singles-nz.pages.dev)';

type ShopifyCollectionSource = 'products-json' | 'collection-html-product-js';

type ShopifyCollectionAdapterConfig = {
  key: string;
  sellerName: string;
  baseUrl: string;
  collectionHandle: string;
  productType: string;
  source: ShopifyCollectionSource;
  mapProductName?: (product: ShopifyProduct) => string;
  mapCondition?: (product: ShopifyProduct, variant: ShopifyVariant) => string | null;
  priceDivisor?: number;
  maxPages?: number;
  pageSize?: number;
};

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  vendor?: string;
  body_html?: string | null;
  description?: string | null;
  type?: string;
  product_type?: string;
  variants: ShopifyVariant[];
};

type ShopifyVariant = {
  id: number;
  title: string;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  sku: string | null;
  available: boolean;
  price: string | number;
};

type ShopifyProductsResponse = {
  products?: ShopifyProduct[];
};

export function createShopifyCollectionAdapter(config: ShopifyCollectionAdapterConfig): SellerAdapter {
  return {
    key: config.key,

    async fetchListings(_seller: Seller, _cards: SyncCard[]): Promise<ExternalListing[]> {
      return config.source === 'products-json' ? fetchJsonFeedListings(config) : fetchHtmlProductListings(config);
    },

    createCartUrl(seller: Seller, listings: SellerCartListing[]): string | null {
      return createShopifyCartUrl(seller, listings);
    }
  };
}

function createShopifyCartUrl(seller: Seller, listings: SellerCartListing[]): string | null {
  const cartItems = listings
    .filter(listing => /^\d+$/.test(listing.externalId))
    .map(listing => `${listing.externalId}:${listing.requestedQuantity}`);

  if (cartItems.length === 0) {
    return null;
  }

  return `${new URL(seller.websiteUrl).origin}/cart/${cartItems.join(',')}`;
}

async function fetchJsonFeedListings(config: ShopifyCollectionAdapterConfig): Promise<ExternalListing[]> {
  const listings: ExternalListing[] = [];
  const maxPages = config.maxPages ?? DEFAULT_MAX_PAGES;
  const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;

  for (let page = 1; page <= maxPages; page += 1) {
    const products = await fetchCollectionProducts(config, page, pageSize);

    if (products.length === 0) {
      break;
    }

    listings.push(...mapProductsToListings(config, products));

    if (products.length < pageSize) {
      break;
    }
  }

  return listings;
}

async function fetchHtmlProductListings(config: ShopifyCollectionAdapterConfig): Promise<ExternalListing[]> {
  const listings: ExternalListing[] = [];
  const seenVariantIds = new Set<string>();
  const maxPages = config.maxPages ?? DEFAULT_MAX_PAGES;

  for (let page = 1; page <= maxPages; page += 1) {
    const html = await fetchCollectionPage(config, page);
    const handles = parseProductHandles(html, config.collectionHandle);

    if (handles.length === 0) {
      break;
    }

    const products = await Promise.all(handles.map(handle => fetchProduct(config, handle)));
    const pageListings = mapProductsToListings(config, products).filter(listing => {
      if (seenVariantIds.has(listing.externalId)) {
        return false;
      }

      seenVariantIds.add(listing.externalId);
      return true;
    });

    listings.push(...pageListings);

    if (!hasNextPage(html)) {
      break;
    }
  }

  return listings;
}

function mapProductsToListings(config: ShopifyCollectionAdapterConfig, products: ShopifyProduct[]): ExternalListing[] {
  const listings: ExternalListing[] = [];

  for (const product of products) {
    if (getProductType(product) !== config.productType) {
      continue;
    }

    for (const variant of product.variants) {
      if (!variant.available) {
        continue;
      }

      const priceNzd = parsePrice(variant.price, config.priceDivisor ?? 1);

      if (priceNzd === null) {
        continue;
      }

      listings.push({
        externalId: variant.id.toString(),
        productName: config.mapProductName ? config.mapProductName(product) : product.title,
        condition: config.mapCondition ? config.mapCondition(product, variant) : defaultCondition(variant),
        priceNzd,
        quantity: 1,
        productUrl: `${config.baseUrl}/products/${product.handle}`,
        raw: {
          productId: product.id,
          handle: product.handle,
          productType: getProductType(product),
          variantId: variant.id,
          variantTitle: variant.title,
          option1: variant.option1,
          option2: variant.option2,
          option3: variant.option3,
          sku: variant.sku,
          available: variant.available
        }
      });
    }
  }

  return listings;
}

async function fetchCollectionProducts(
  config: ShopifyCollectionAdapterConfig,
  page: number,
  pageSize: number
): Promise<ShopifyProduct[]> {
  const url = new URL(`/collections/${config.collectionHandle}/products.json`, config.baseUrl);
  url.searchParams.set('limit', pageSize.toString());
  url.searchParams.set('page', page.toString());

  const response = await fetch(url.toString(), {
    headers: {
      accept: 'application/json',
      'user-agent': USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`${config.sellerName} collection request failed with status ${response.status}`);
  }

  const data = (await response.json()) as ShopifyProductsResponse;
  return data.products ?? [];
}

async function fetchCollectionPage(config: ShopifyCollectionAdapterConfig, page: number): Promise<string> {
  const url = new URL(`/collections/${config.collectionHandle}`, config.baseUrl);

  if (page > 1) {
    url.searchParams.set('page', page.toString());
  }

  const response = await fetch(url.toString(), {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`${config.sellerName} collection request failed with status ${response.status}`);
  }

  return response.text();
}

async function fetchProduct(config: ShopifyCollectionAdapterConfig, handle: string): Promise<ShopifyProduct> {
  const response = await fetch(`${config.baseUrl}/products/${handle}.js`, {
    headers: {
      accept: 'application/json',
      'user-agent': USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`${config.sellerName} product request failed for ${handle} with status ${response.status}`);
  }

  return response.json() as Promise<ShopifyProduct>;
}

function parseProductHandles(html: string, collectionHandle: string): string[] {
  const handles = new Set<string>();
  const productPathPattern = new RegExp(`/collections/${collectionHandle}/products/([^"?#]+)`, 'g');
  let match: RegExpExecArray | null;

  while ((match = productPathPattern.exec(html))) {
    handles.add(decodeHtml(match[1]).trim());
  }

  return [...handles];
}

function hasNextPage(html: string): boolean {
  return /<link\s+rel="next"/i.test(html);
}

function getProductType(product: ShopifyProduct): string | undefined {
  return product.product_type ?? product.type;
}

function defaultCondition(variant: ShopifyVariant): string | null {
  return normalizeCondition(variant.title === 'Default Title' ? null : variant.title);
}

function parsePrice(price: string | number, divisor: number): number | null {
  const value = typeof price === 'number' ? price : Number.parseFloat(price);

  if (!Number.isFinite(value)) {
    return null;
  }

  return value / divisor;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number.parseInt(code, 10)));
}
