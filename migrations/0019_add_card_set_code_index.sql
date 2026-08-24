-- Browsing cards by set (e.g. /api/cards?set=SOR) filtered on cards.set_code with no
-- supporting index, forcing a full table scan on every request. Add the missing index.
create index idx_cards_set_code on cards(set_code);
