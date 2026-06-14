import type { CardListing } from '../domain/CardListing';
import type { CardListingRepository } from '../domain/CardListingRepository';
import { mapListingRow } from './listingRowMapper';

export class D1CardListingRepository implements CardListingRepository {
  constructor(private readonly db: D1Database) {}

  async listActiveByCardId(cardId: string): Promise<CardListing[]> {
    const result = await this.db
      .prepare(
        `select l.id, l.seller_id, s.name as seller_name, s.slug as seller_slug,
                l.condition, l.price_nzd, l.quantity, l.product_url, l.last_seen_at
         from listings l
         inner join sellers s on s.id = l.seller_id
         where l.card_id = ?1
         and l.quantity > 0
         order by l.price_nzd asc, s.name asc`
      )
      .bind(cardId)
      .all();

    return result.results.map(row => mapListingRow(row as Parameters<typeof mapListingRow>[0]));
  }
}
