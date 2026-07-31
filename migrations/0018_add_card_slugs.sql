-- Stable public URL identifier. It is nullable during rollout so the application can be
-- deployed before the one-time backfill runs; SQLite permits multiple NULLs in a unique index.
alter table cards add column slug text;

create unique index idx_cards_slug on cards(slug);
