import type { ExternalListing, Seller, SellerAdapter, SellerCartListing, SyncCard } from './model';

const BASE_URL = 'https://badgerssettnz.com';
const COLLECTION_HANDLE = 'star-wars-unlimited-singles';
const MAX_PAGES = 50;
const PAGE_SIZE = 250;
const SINGLE_PRODUCT_TYPE = 'Star Wars: Unlimited Single';

type ShopifyProductsResponse = {
  products: ShopifyProduct[];
};

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  variants: ShopifyVariant[];
};

type ShopifyVariant = {
  id: number;
  title: string;
  sku: string | null;
  available: boolean;
  price: string;
};

export class BadgersSettNzAdapter implements SellerAdapter {
  readonly key = 'badgerssett-shopify';

  async fetchListings(_seller: Seller, _cards: SyncCard[]): Promise<ExternalListing[]> {
    const listings: ExternalListing[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const products = await fetchCollectionProducts(page);

      if (products.length === 0) {
        break;
      }

      for (const product of products) {
        if (product.product_type !== SINGLE_PRODUCT_TYPE) {
          continue;
        }

        for (const variant of product.variants) {
          if (!variant.available) {
            continue;
          }

          const priceNzd = Number.parseFloat(variant.price);

          if (!Number.isFinite(priceNzd)) {
            continue;
          }

          listings.push({
            externalId: variant.id.toString(),
            productName: product.title,
            condition: variant.title === 'Default Title' ? null : variant.title,
            priceNzd,
            quantity: 1,
            productUrl: `${BASE_URL}/products/${product.handle}`,
            raw: {
              productId: product.id,
              handle: product.handle,
              productType: product.product_type,
              variantId: variant.id,
              variantTitle: variant.title,
              sku: variant.sku,
              available: variant.available
            }
          });
        }
      }

      if (products.length < PAGE_SIZE) {
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

async function fetchCollectionProducts(page: number): Promise<ShopifyProduct[]> {
  const url = new URL(`/collections/${COLLECTION_HANDLE}/products.json`, BASE_URL);
  url.searchParams.set('limit', PAGE_SIZE.toString());
  url.searchParams.set('page', page.toString());

  const response = await fetch(url.toString(), {
    headers: {
      accept: 'application/json',
      'user-agent': 'SWU Singles NZ inventory sync (+https://swu-singles-nz.pages.dev)'
    }
  });

  if (!response.ok) {
    throw new Error(`Badgers Sett NZ collection request failed with status ${response.status}`);
  }

  const data = (await response.json()) as ShopifyProductsResponse;
  return data.products ?? [];
}
