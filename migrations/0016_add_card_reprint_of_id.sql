-- Official cardUid of the original card represented by a reprint.
-- This is intentionally not a foreign key: cards currently use generated IDs, and the
-- referenced official card may not have been imported when a newer set is imported.
alter table cards add column reprint_of_id text;

create index idx_cards_reprint_of_id on cards(reprint_of_id);
