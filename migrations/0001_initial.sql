-- Initial schema for the SWU Singles NZ MVP.
-- Holds canonical card data, seller integrations, current listings, and sync diagnostics.

-- Star Wars: Unlimited sets used to group card printings and display set-level metadata.
create table sets (
  code text primary key,                                -- Unique set code, e.g. "SOR" for "Spark of Rebellion"         
  swu_id integer not null unique,                       -- Official SWU expansion id from admin.starwarsunlimited.com
  name text not null,                                   -- Set name, e.g. "Spark of Rebellion"    
  total_cards integer not null,                         -- Total number of cards in the set, e.g. 100

  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);

-- Canonical SWU card printings.
create table cards (
  id text primary key,                                  -- Format: {set_code}{collector_number}, e.g. "SOR005"
  set_code text not null references sets(code),         -- Foreign key to sets table, e.g. "SOR"
  collector_number integer not null,                    -- Card's collector number within the set, e.g. 5  
  name text not null,                                   -- Full rules-distinct card name, e.g. "Luke Skywalker - Faithful Friend"
  image_url text,                                       -- Optional URL to a card image, e.g. "https://example.com/sor005.jpg"

  created_at text not null default CURRENT_TIMESTAMP,   
  updated_at text not null default CURRENT_TIMESTAMP,

  check (id = set_code || printf('%03d', collector_number))
);

-- Sellers whose listings can be synced and shown in search results.
create table sellers (
  id text primary key check (                           -- Seller ULID, e.g. "01K8Z9Q2W8V7M4N3P2R1T0S9A8"
    length(id) = 26
    and id not glob '*[^0123456789ABCDEFGHJKMNPQRSTVWXYZ]*'),
  name text not null,                                   -- Display name, e.g. "Calico Keep"
  slug text not null unique,                            -- URL-friendly seller slug, e.g. "calico-keep"
  website_url text not null,                            -- Seller website URL, e.g. "https://www.calicokeep.co.nz"
  enabled integer not null default 1,                   -- Whether this seller should be included in sync jobs
  adapter_key text not null,                            -- Integration adapter used to sync this seller, e.g. "calicokeep-storepass"

  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);

-- Current known availability for a card from a seller. This is not price history.
create table listings (
  id text primary key check (                           -- Listing ULID, e.g. "01K8Z9Q2W8V7M4N3P2R1T0S9A9"
    length(id) = 26
    and id not glob '*[^0123456789ABCDEFGHJKMNPQRSTVWXYZ]*'),
  seller_id text not null references sellers(id),       -- Seller offering this listing
  external_id text not null,                            -- Seller/platform listing identifier used for upserts
  card_id text not null references cards(id),           -- Matched SWU card id, e.g. "SOR005"
  condition text,                                       -- Optional card condition, e.g. "Near Mint"
  price_nzd real not null,                              -- Current listing price in NZD
  quantity integer not null,                            -- Current available quantity
  product_url text not null,                            -- URL where the listing can be viewed or purchased
  last_seen_at text not null,                           -- Most recent time this listing was seen during sync
  
  unique (seller_id, external_id)
);

create index idx_listings_card_quantity on listings(card_id, quantity);
create index idx_listings_seller on listings(seller_id);

-- Audit/debug record for each seller sync attempt.
create table sync_runs (
  id text primary key check (                           -- Sync run ULID
    length(id) = 26
    and id not glob '*[^0123456789ABCDEFGHJKMNPQRSTVWXYZ]*'),
  seller_id text not null references sellers(id),       -- Seller being synced
  status text not null check (status in                 -- Current sync outcome/state
    ('running', 'succeeded', 'failed')), 
  started_at text not null,                             -- Time the sync run started
  finished_at text,                                     -- Time the sync run finished, if completed
  cards_checked integer not null default 0,             -- Number of canonical cards checked against the seller
  listings_found integer not null default 0,            -- Number of listings returned by the seller integration
  listings_updated integer not null default 0,          -- Number of matched listings inserted or updated
  listings_marked_stale integer not null default 0,     -- Number of previously known listings no longer seen
  error_message text                                    -- Error details when the sync fails
);

-- Listings found during sync that could not be matched to a card.
-- This table can be cleared and rebuilt.
create table unmatched_listings (
  id text primary key check (                           -- Unmatched listing ULID
    length(id) = 26
    and id not glob '*[^0123456789ABCDEFGHJKMNPQRSTVWXYZ]*'),
  seller_id text not null references sellers(id),       -- Seller that returned the unmatched listing
  external_id text not null,                            -- Seller/platform listing identifier used for upserts
  product_name text not null,                           -- Raw product/listing name returned by the seller
  condition text,                                       -- Optional card condition, e.g. "Near Mint"
  price_nzd real not null,                              -- Current listing price in NZD
  quantity integer not null,                            -- Current available quantity
  product_url text not null,                            -- URL where the unmatched listing can be inspected
  raw_payload_json text not null,                       -- Full raw payload for debugging parser/matcher issues
  seen_at text not null,                                -- Time this unmatched listing was seen during sync
  
  unique (seller_id, external_id)
);
