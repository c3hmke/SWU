insert into sellers (id, name, slug, website_url, enabled, adapter_key)
values ('01K8Z9Q2W8V7M4N3P2R1T0S9A8', 'Calico Keep', 'calico-keep', 'https://www.calicokeep.co.nz', 1, 'calicokeep-storepass');

insert into sets (code, swu_id, name, total_cards)
values ('SOR', 2, 'Spark of Rebellion', 252);

insert into cards (
  id, name, set_code, collector_number, image_url
) values (
  'SOR005',
  'Luke Skywalker - Faithful Friend',
  'SOR',
  5,
  'https://cdn.shopify.com/s/files/1/0272/1828/0515/files/540380_22460454-fa92-4d76-960e-9d669de7e288.jpg?v=1762696845'
);

insert into listings (
  id, seller_id, card_id, external_id, condition, price_nzd, quantity, product_url, last_seen_at
) values (
  '01K8Z9Q2W8V7M4N3P2R1T0S9A9',
  '01K8Z9Q2W8V7M4N3P2R1T0S9A8',
  'SOR005',
  '42421224800323',
  'Near Mint',
  6.10,
  2,
  'https://www.calicokeep.co.nz/products/luke-skywalker-faithful-friend-005-252-spark-of-rebellion',
  CURRENT_TIMESTAMP
);
