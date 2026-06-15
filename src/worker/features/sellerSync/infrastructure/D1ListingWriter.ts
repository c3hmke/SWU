import { createUlid } from '../../../shared/kernel/createUlid';
import type { ListingWriter, MatchedListing } from '../domain/ListingWriter';

export class D1ListingWriter implements ListingWriter {
  constructor(private readonly db: D1Database) {}

  async upsertMatched(sellerId: string, listings: MatchedListing[], seenAt: string): Promise<number> {
    if (listings.length === 0) {
      return 0;
    }

    const statements = listings.map(listing =>
      this.db
        .prepare(
          `insert into listings (id, seller_id, external_id, card_id, condition, price_nzd, quantity, product_url, last_seen_at)
           values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
           on conflict(seller_id, external_id) do update set
             card_id = excluded.card_id,
             condition = excluded.condition,
             price_nzd = excluded.price_nzd,
             quantity = excluded.quantity,
             product_url = excluded.product_url,
             last_seen_at = excluded.last_seen_at`
        )
        .bind(
          createUlid(),
          sellerId,
          listing.externalId,
          listing.cardId,
          listing.condition,
          listing.priceNzd,
          listing.quantity,
          listing.productUrl,
          seenAt
        )
    );

    await this.db.batch(statements);
    return listings.length;
  }

  async markMissingAsUnavailable(sellerId: string, seenAt: string): Promise<number> {
    const result = await this.db
      .prepare('update listings set quantity = 0 where seller_id = ?1 and quantity > 0 and last_seen_at <> ?2')
      .bind(sellerId, seenAt)
      .run();

    return result.meta.changes ?? 0;
  }
}
