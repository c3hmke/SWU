import type { BulkCardListing, Card, CardListItem, CardListSearchCriteria, CardListing } from './model';

type CardRow = {
  id: string;
  name: string;
  set_code: string;
  set_name: string | null;
  collector_number: number;
  total_cards: number | null;
  image_url: string | null;
  variant_of: string | null;
};

type CardListRow = {
  id: string;
  name: string;
  image_url: string | null;
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
  marketplace_seller_name: string | null;
  marketplace_seller_profile_name: string | null;
  marketplace_seller_location: string | null;
  marketplace_seller_rating: number | null;
  marketplace_is_store: number | null;
  marketplace_allow_pickups: number | null;
  last_seen_at: string;
};

type BulkListingRow = ListingRow & {
  external_id: string;
  seller_adapter_key: string;
  seller_website_url: string;
  card_id: string;
  card_name: string;
  card_image_url: string | null;
};

export async function listCardsByChasePrice(
  db: D1Database,
  criteria: CardListSearchCriteria
): Promise<CardListItem[]> {
  const query = `select c.id, c.name, c.image_url, min(l.price_nzd) as lowest_price_nzd
                 from cards c
                 inner join listings l on l.card_id = c.id
                 where l.quantity > 0
                   and (?1 is null or lower(c.name) like '%' || lower(?1) || '%')
                 group by c.id, c.name, c.image_url
                 order by lowest_price_nzd desc, c.name asc
                 limit ?2 offset ?3`;

  const result = await db.prepare(query).bind(criteria.name, criteria.limit, criteria.offset).all<CardListRow>();

  return result.results.map(row => ({
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    lowestPriceNzd: row.lowest_price_nzd
  }));
}

export async function getCardById(db: D1Database, id: string): Promise<Card | null> {
  const row = await db
    .prepare(
      `select c.id, c.name, c.set_code, s.name as set_name,
              c.collector_number, s.total_cards, c.image_url, c.variant_of
       from cards c
       left join sets s on s.code = c.set_code
       where c.id = ?1`
    )
    .bind(id)
    .first<CardRow>();

  return row ? mapCard(row) : null;
}

export async function listCardsByExactNormalizedNames(db: D1Database, normalizedNames: string[]): Promise<Card[]> {
  if (normalizedNames.length === 0) {
    return [];
  }

  const placeholders = normalizedNames.map((_, index) => `?${index + 1}`).join(', ');
  const result = await db
    .prepare(
      `select c.id, c.name, c.set_code, s.name as set_name,
              c.collector_number, s.total_cards, c.image_url, c.variant_of
       from cards c
       left join sets s on s.code = c.set_code
       where lower(trim(c.name)) in (${placeholders})
       order by c.name asc, c.set_code asc, c.collector_number asc`
    )
    .bind(...normalizedNames)
    .all<CardRow>();

  return result.results.map(mapCard);
}

export async function listActiveListingsByCardId(db: D1Database, cardId: string): Promise<CardListing[]> {
  const result = await db
    .prepare(
      `select l.id, l.seller_id, s.name as seller_name, s.slug as seller_slug,
              l.condition, l.price_nzd, l.quantity, l.product_url,
              l.marketplace_seller_name, l.marketplace_seller_profile_name, l.marketplace_seller_location,
              l.marketplace_seller_rating, l.marketplace_is_store, l.marketplace_allow_pickups,
              l.last_seen_at
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

export async function listActiveListingsByCardIds(db: D1Database, cardIds: string[]): Promise<BulkCardListing[]> {
  if (cardIds.length === 0) {
    return [];
  }

  const placeholders = cardIds.map((_, index) => `?${index + 1}`).join(', ');
  const result = await db
    .prepare(
      `select l.id, l.external_id, l.seller_id, s.name as seller_name, s.slug as seller_slug,
              s.adapter_key as seller_adapter_key, s.website_url as seller_website_url,
              l.condition, l.price_nzd, l.quantity, l.product_url,
              l.marketplace_seller_name, l.marketplace_seller_profile_name, l.marketplace_seller_location,
              l.marketplace_seller_rating, l.marketplace_is_store, l.marketplace_allow_pickups,
              l.last_seen_at,
              c.id as card_id, c.name as card_name, c.image_url as card_image_url
       from listings l
       inner join sellers s on s.id = l.seller_id
       inner join cards c on c.id = l.card_id
       where l.card_id in (${placeholders})
       and l.quantity > 0
       order by s.name asc, c.name asc, l.price_nzd asc`
    )
    .bind(...cardIds)
    .all<BulkListingRow>();

  return result.results.map(row => ({
    ...mapListing(row),
    externalId: row.external_id,
    sellerAdapterKey: row.seller_adapter_key,
    sellerWebsiteUrl: row.seller_website_url,
    cardId: row.card_id,
    cardName: row.card_name,
    cardImageUrl: row.card_image_url
  }));
}

function mapCard(row: CardRow): Card {
  return {
    id: row.id,
    name: row.name,
    setCode: row.set_code,
    setName: row.set_name,
    collectorNumber: row.collector_number,
    totalCards: row.total_cards,
    imageUrl: row.image_url,
    variantOf: row.variant_of
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
    marketplaceSellerName: row.marketplace_seller_name,
    marketplaceSellerProfileName: row.marketplace_seller_profile_name,
    marketplaceSellerLocation: row.marketplace_seller_location,
    marketplaceSellerRating: row.marketplace_seller_rating,
    marketplaceIsStore: row.marketplace_is_store === null ? null : row.marketplace_is_store === 1,
    marketplaceAllowPickups: row.marketplace_allow_pickups === null ? null : row.marketplace_allow_pickups === 1,
    lastSeenAt: row.last_seen_at
  };
}
