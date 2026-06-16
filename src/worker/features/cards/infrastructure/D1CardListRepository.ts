import type { CardListItem } from '../domain/CardListItem';
import type { CardListRepository, CardListSearchCriteria } from '../domain/CardListRepository';

type CardListRow = {
  id: string;
  name: string;
  lowest_price_nzd: number;
};

export class D1CardListRepository implements CardListRepository {
  constructor(private readonly db: D1Database) {}

  async listWithCurrentPrices(criteria: CardListSearchCriteria): Promise<CardListItem[]> {
    const query = `select c.id, c.name, min(l.price_nzd) as lowest_price_nzd
                   from cards c
                   inner join listings l on l.card_id = c.id
                   where l.quantity > 0
                     and (?1 is null or lower(c.name) like '%' || lower(?1) || '%')
                   group by c.id, c.name
                   order by c.name asc`;

    const result = await this.db.prepare(query).bind(criteria.name).all<CardListRow>();

    return result.results.map(row => ({
      id: row.id,
      name: row.name,
      lowestPriceNzd: row.lowest_price_nzd
    }));
  }
}
