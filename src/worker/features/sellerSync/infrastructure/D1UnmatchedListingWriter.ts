import { createUlid } from '../../../shared/kernel/createUlid';
import type { ExternalListing } from '../domain/ExternalListing';
import type { UnmatchedListingWriter } from '../domain/UnmatchedListingWriter';

export class D1UnmatchedListingWriter implements UnmatchedListingWriter {
  constructor(private readonly db: D1Database) {}

  async upsertMany(sellerId: string, listings: ExternalListing[], seenAt: string): Promise<number> {
    if (listings.length === 0) {
      return 0;
    }

    const statements = listings.map(listing =>
      this.db
        .prepare(
          `insert into unmatched_listings (id, seller_id, external_id, product_name, condition, price_nzd, quantity, product_url, raw_payload_json, seen_at)
           values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
           on conflict(seller_id, external_id) do update set
             product_name = excluded.product_name,
             condition = excluded.condition,
             price_nzd = excluded.price_nzd,
             quantity = excluded.quantity,
             product_url = excluded.product_url,
             raw_payload_json = excluded.raw_payload_json,
             seen_at = excluded.seen_at`
        )
        .bind(
          createUlid(),
          sellerId,
          listing.externalId,
          listing.productName,
          listing.condition,
          listing.priceNzd,
          listing.quantity,
          listing.productUrl,
          JSON.stringify(listing.raw),
          seenAt
        )
    );

    await this.db.batch(statements);
    return listings.length;
  }
}
