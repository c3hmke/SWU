-- Add variant mapping to link card variants to their base card.
-- This enables faster variant lookups and better data organization.

alter table cards add column variant_of text;

-- For each card, find its base variant (the one without foil/prestige/serialized, or first alphabetically)
-- Update all variants to point to their base card.

update cards
set variant_of = (
  select min(base.id)
  from cards base
  where base.set_code = cards.set_code
    and base.collector_number = cards.collector_number
    and base.id != cards.id
    -- Prioritize cards without variant keywords
    and (
      -- This base card has no variant keywords
      (lower(base.name) not like '%foil%' 
       and lower(base.name) not like '%prestige%' 
       and lower(base.name) not like '%serialized%')
      -- OR our current card has variant keywords (so prefer any non-variant base)
      or (lower(cards.name) like '%foil%' 
          or lower(cards.name) like '%prestige%' 
          or lower(cards.name) like '%serialized%')
    )
  order by 
    -- Prioritize non-variant versions
    (lower(base.name) like '%foil%' or lower(base.name) like '%prestige%' or lower(base.name) like '%serialized%') asc,
    base.name asc
  limit 1
)
where exists (
  select 1
  from cards other
  where other.set_code = cards.set_code
    and other.collector_number = cards.collector_number
    and other.id != cards.id
);

-- Create an index for efficient variant lookups
create index idx_cards_variant_of on cards(variant_of);
