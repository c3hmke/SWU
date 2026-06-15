import type { CardListItem } from '../domain/CardListItem';
import type { CardListRepository } from '../domain/CardListRepository';

type CardListRow = {
  id: string;
  name: string;
  lowest_price_nzd: number;
};

export class D1CardListRepository implements CardListRepository {
  constructor(private readonly db: D1Database) {}

  async listWithCurrentPrices(): Promise<CardListItem[]> {
    const result = await this.db
      .prepare(
        `select c.id, c.name, min(l.price_nzd) as lowest_price_nzd
         from cards c
         inner join listings l on l.card_id = c.id
         where l.quantity > 0
         group by c.id, c.name
         order by c.name asc`
      )
      .all<CardListRow>();

    return result.results.map(row => ({
      id: row.id,
      name: row.name,
      lowestPriceNzd: row.lowest_price_nzd
    }));
  }
}
