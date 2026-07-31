-- Official identifiers used to group equivalent printings and identify the physical printing.
-- Both are text because official values can begin with zero.
alter table cards add column validation_id text;
alter table cards add column swu_serial text;

create index idx_cards_validation_id on cards(validation_id);
create index idx_cards_swu_serial on cards(swu_serial);
