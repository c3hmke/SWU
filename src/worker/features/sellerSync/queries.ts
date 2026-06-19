import { createUlid } from '../../shared/kernel/createUlid';
import type { ExternalListing, MatchedListing, Seller, SyncCard, SyncRunUpdate } from './model';

type SellerRow = {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  adapter_key: string;
  enabled: number;
};

type SyncCardRow = {
  id: string;
  name: string;
  set_code: string;
  set_name: string;
  collector_number: number;
};

export async function getSellerBySlug(db: D1Database, slug: string): Promise<Seller | null> {
  const row = await db
    .prepare('select id, name, slug, website_url, adapter_key, enabled from sellers where slug = ?1')
    .bind(slug)
    .first<SellerRow>();

  return row
    ? {
        id: row.id,
        name: row.name,
        slug: row.slug,
        websiteUrl: row.website_url,
        adapterKey: row.adapter_key,
        enabled: row.enabled === 1
      }
    : null;
}

export async function listSyncCards(db: D1Database): Promise<SyncCard[]> {
  const result = await db
    .prepare(
      `select c.id, c.name, c.set_code, s.name as set_name, c.collector_number
       from cards c
       inner join sets s on s.code = c.set_code
       order by c.set_code, c.collector_number`
    )
    .all<SyncCardRow>();

  return result.results.map(mapSyncCard);
}

export async function upsertMatchedListings(
  db: D1Database,
  sellerId: string,
  listings: MatchedListing[],
  seenAt: string
): Promise<number> {
  if (listings.length === 0) {
    return 0;
  }

  const statements = listings.map(listing =>
    db
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

  await db.batch(statements);
  return listings.length;
}

export async function markMissingListingsUnavailable(
  db: D1Database,
  sellerId: string,
  seenAt: string
): Promise<number> {
  const result = await db
    .prepare('update listings set quantity = 0 where seller_id = ?1 and quantity > 0 and last_seen_at <> ?2')
    .bind(sellerId, seenAt)
    .run();

  return result.meta.changes ?? 0;
}

export async function upsertUnmatchedListings(
  db: D1Database,
  sellerId: string,
  listings: ExternalListing[],
  seenAt: string
): Promise<number> {
  if (listings.length === 0) {
    return 0;
  }

  const statements = listings.map(listing =>
    db
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

  await db.batch(statements);
  return listings.length;
}

export async function createSyncRun(
  db: D1Database,
  input: { id: string; sellerId: string; startedAt: string }
): Promise<void> {
  await db
    .prepare('insert into sync_runs (id, seller_id, status, started_at) values (?1, ?2, ?3, ?4)')
    .bind(input.id, input.sellerId, 'running', input.startedAt)
    .run();
}

export async function updateSyncRun(db: D1Database, id: string, update: SyncRunUpdate): Promise<void> {
  await db
    .prepare(
      `update sync_runs set
         status = ?2,
         finished_at = coalesce(?3, finished_at),
         cards_checked = coalesce(?4, cards_checked),
         listings_found = coalesce(?5, listings_found),
         listings_updated = coalesce(?6, listings_updated),
         listings_marked_stale = coalesce(?7, listings_marked_stale),
         error_message = ?8
       where id = ?1`
    )
    .bind(
      id,
      update.status,
      update.finishedAt ?? null,
      update.cardsChecked ?? null,
      update.listingsFound ?? null,
      update.listingsUpdated ?? null,
      update.listingsMarkedStale ?? null,
      update.errorMessage ?? null
    )
    .run();
}

function mapSyncCard(row: SyncCardRow): SyncCard {
  return {
    id: row.id,
    name: row.name,
    setCode: row.set_code,
    setName: row.set_name,
    collectorNumber: row.collector_number
  };
}
