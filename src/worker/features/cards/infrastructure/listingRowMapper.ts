import type { CardListing } from '../domain/CardListing';

type ListingRow = {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_slug: string;
  condition: string | null;
  price_nzd: number;
  quantity: number;
  product_url: string;
  last_seen_at: string;
};

export function mapListingRow(row: ListingRow): CardListing {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerSlug: row.seller_slug,
    condition: row.condition,
    priceNzd: row.price_nzd,
    quantity: row.quantity,
    productUrl: row.product_url,
    lastSeenAt: row.last_seen_at
  };
}
