-- Official card-printing classifications, such as Standard, Weekly Play, and Judge Program.
-- The official catalogue currently assigns at most one variant type to each card. Keeping the
-- type in a lookup table preserves the official metadata while allowing a junction-table
-- migration later if cards are ever assigned multiple types.
create table card_variant_types (
  id text primary key,                                  -- Official variantId, e.g. "60"
  name text not null,                                   -- Display name, e.g. "Weekly Play"
  foil integer check (foil in (0, 1) or foil is null),
  sort_value integer,

  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);

alter table cards add column variant_type_id text references card_variant_types(id);

create index idx_cards_variant_type_id on cards(variant_type_id);
