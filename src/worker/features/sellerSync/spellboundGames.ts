import type { ExternalListing, Seller, SellerAdapter, SellerCartListing, SyncCard } from './model';

const BASE_URL = 'https://spellboundgames.co.nz';
const COLLECTION_HANDLE = 'starwars-unlimited-singles-in-stock';
const MAX_PAGES = 50;
const SINGLE_PRODUCT_TYPE = 'Star Wars: Unlimited Single';

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  type: string;
  variants: ShopifyVariant[];
};

type ShopifyVariant = {
  id: number;
  title: string;
  sku: string | null;
  available: boolean;
  price: number;
};

export class SpellboundGamesAdapter implements SellerAdapter {
  readonly key = 'spellboundgames-shopify';

  async fetchListings(_seller: Seller, _cards: SyncCard[]): Promise<ExternalListing[]> {
    const listings: ExternalListing[] = [];
    const seenVariantIds = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const html = await fetchCollectionPage(page);
      const handles = parseProductHandles(html);

      if (handles.length === 0) {
        break;
      }

      const products = await Promise.all(handles.map(fetchProduct));

      for (const product of products) {
        if (product.type !== SINGLE_PRODUCT_TYPE) {
          continue;
        }

        for (const variant of product.variants) {
          const externalId = variant.id.toString();

          if (!variant.available || seenVariantIds.has(externalId)) {
            continue;
          }

          seenVariantIds.add(externalId);

          listings.push({
            externalId,
            productName: product.title,
            condition: variant.title === 'Default Title' ? null : variant.title,
            priceNzd: variant.price / 100,
            quantity: 1,
            productUrl: `${BASE_URL}/products/${product.handle}`,
            raw: {
              productId: product.id,
              handle: product.handle,
              productType: product.type,
              variantId: variant.id,
              variantTitle: variant.title,
              sku: variant.sku,
              available: variant.available
            }
          });
        }
      }

      if (!hasNextPage(html)) {
        break;
      }
    }

    return listings;
  }

  createCartUrl(seller: Seller, listings: SellerCartListing[]): string | null {
    const cartItems = listings
      .filter(listing => /^\d+$/.test(listing.externalId))
      .map(listing => `${listing.externalId}:${listing.requestedQuantity}`);

    if (cartItems.length === 0) {
      return null;
    }

    return `${new URL(seller.websiteUrl).origin}/cart/${cartItems.join(',')}`;
  }
}

async function fetchCollectionPage(page: number): Promise<string> {
  const url = new URL(`/collections/${COLLECTION_HANDLE}`, BASE_URL);

  if (page > 1) {
    url.searchParams.set('page', page.toString());
  }

  const response = await fetch(url.toString(), {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': 'SWU Singles NZ inventory sync (+https://swu-singles-nz.pages.dev)'
    }
  });

  if (!response.ok) {
    throw new Error(`Spellbound Games collection request failed with status ${response.status}`);
  }

  return response.text();
}

async function fetchProduct(handle: string): Promise<ShopifyProduct> {
  const response = await fetch(`${BASE_URL}/products/${handle}.js`, {
    headers: {
      accept: 'application/json',
      'user-agent': 'SWU Singles NZ inventory sync (+https://swu-singles-nz.pages.dev)'
    }
  });

  if (!response.ok) {
    throw new Error(`Spellbound Games product request failed for ${handle} with status ${response.status}`);
  }

  return response.json() as Promise<ShopifyProduct>;
}

function parseProductHandles(html: string): string[] {
  const handles = new Set<string>();
  const productPathPattern = new RegExp(`/collections/${COLLECTION_HANDLE}/products/([^"?#]+)`, 'g');
  let match: RegExpExecArray | null;

  while ((match = productPathPattern.exec(html))) {
    handles.add(decodeHtml(match[1]).trim());
  }

  return [...handles];
}

function hasNextPage(html: string): boolean {
  return /<link\s+rel="next"/i.test(html);
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
