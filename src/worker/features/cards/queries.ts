import type { Card, CardListItem, CardListSearchCriteria, CardListing } from './model';

type CardRow = {
  id: string;
  name: string;
  set_code: string;
  set_name: string | null;
  collector_number: number;
  image_url: string | null;
};

type CardListRow = {
  id: string;
  name: string;
  lowest_price_nzd: number;
};

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

export async function listCardsWithCurrentPrices(
  db: D1Database,
  criteria: CardListSearchCriteria
): Promise<CardListItem[]> {
  const query = `select c.id, c.name, min(l.price_nzd) as lowest_price_nzd
                 from cards c
                 inner join listings l on l.card_id = c.id
                 where l.quantity > 0
                   and (?1 is null or lower(c.name) like '%' || lower(?1) || '%')
                 group by c.id, c.name
                 order by c.name asc`;

  const result = await db.prepare(query).bind(criteria.name).all<CardListRow>();

  return result.results.map(row => ({
    id: row.id,
    name: row.name,
    lowestPriceNzd: row.lowest_price_nzd
  }));
}

export async function getCardById(db: D1Database, id: string): Promise<Card | null> {
  const row = await db
    .prepare(
      `select c.id, c.name, c.set_code, s.name as set_name,
              c.collector_number, c.image_url
       from cards c
       left join sets s on s.code = c.set_code
       where c.id = ?1`
    )
    .bind(id)
    .first<CardRow>();

  return row ? mapCard(row) : null;
}

export async function listActiveListingsByCardId(db: D1Database, cardId: string): Promise<CardListing[]> {
  const result = await db
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
    .all<ListingRow>();

  return result.results.map(mapListing);
}

function mapCard(row: CardRow): Card {
  return {
    id: row.id,
    name: row.name,
    setCode: row.set_code,
    setName: row.set_name,
    collectorNumber: row.collector_number,
    imageUrl: row.image_url
  };
}

function mapListing(row: ListingRow): CardListing {
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
