import type { ExternalListing, Seller, SellerAdapter, SellerCartListing, SyncCard } from '../model';
import { normalizeCondition } from '../../../shared/conditionNormalizer';

const BATCH_SIZE = 200;

type StorepassAdapterConfig = {
  key: string;
  sellerName: string;
  storeId: string;
  productLine: string;
};

type StorepassListResponse = StorepassTermResult[];

type StorepassTermResult = {
  term: string;
  quantity: number;
  products?: StorepassProduct[];
};

type StorepassProduct = {
  name: string;
  price: number;
  url: string;
  image_url?: string;
  product_id: number;
  variantInfo?: StorepassVariant[];
};

type StorepassVariant = {
  id: number;
  title: string;
  price: number;
  inventory_quantity: number;
  price_text?: string;
};

export function createStorepassAdapter(config: StorepassAdapterConfig): SellerAdapter {
  return {
    key: config.key,

    async fetchListings(_seller: Seller, cards: SyncCard[]): Promise<ExternalListing[]> {
      return fetchStorepassListings(config, cards);
    },

    createCartUrl(seller: Seller, listings: SellerCartListing[]): string | null {
      return createStorepassCartUrl(seller, listings);
    }
  };
}

async function fetchStorepassListings(config: StorepassAdapterConfig, cards: SyncCard[]): Promise<ExternalListing[]> {
  const listings: ExternalListing[] = [];

  for (let index = 0; index < cards.length; index += BATCH_SIZE) {
    const batch = cards.slice(index, index + BATCH_SIZE);
    const results = await searchCards(config, batch);

    for (const result of results) {
      for (const product of result.products ?? []) {
        for (const variant of product.variantInfo ?? []) {
          if (variant.inventory_quantity <= 0) {
            continue;
          }

          listings.push({
            externalId: variant.id.toString(),
            productName: product.name,
            condition: normalizeCondition(variant.title === 'Default Title' ? null : variant.title),
            priceNzd: variant.price,
            quantity: variant.inventory_quantity,
            productUrl: product.url,
            raw: { term: result.term, product, variant }
          });
        }
      }
    }
  }

  return listings;
}

async function searchCards(config: StorepassAdapterConfig, cards: { name: string }[]): Promise<StorepassListResponse> {
  const response = await fetch(
    `https://store.storepass.co/saas/list?product_line=${encodeURIComponent(config.productLine)}&store_id=${config.storeId}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cards.map(card => ({ name: card.name, quantity: 1 })))
    }
  );

  if (!response.ok) {
    throw new Error(`${config.sellerName} Storepass request failed with status ${response.status}`);
  }

  return response.json();
}

function createStorepassCartUrl(seller: Seller, listings: SellerCartListing[]): string | null {
  const cartItems = listings
    .filter(listing => /^\d+$/.test(listing.externalId))
    .map(listing => `${listing.externalId}:${listing.requestedQuantity}`);

  if (cartItems.length === 0) {
    return null;
  }

  const origin = getCartOrigin(seller, listings[0]);
  return `${origin}/cart/${cartItems.join(',')}`;
}

function getCartOrigin(seller: Seller, listing: SellerCartListing | undefined): string {
  if (listing) {
    try {
      return new URL(listing.productUrl).origin;
    } catch {
      // Fall back to the seller URL below.
    }
  }

  return new URL(seller.websiteUrl).origin;
}
