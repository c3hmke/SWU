import { createShopifyCollectionAdapter } from '../integrations/shopifyIntegration';

export const spellboundGamesAdapter = createShopifyCollectionAdapter({
  key: 'spellboundgames-shopify',
  sellerName: 'Spellbound Games',
  baseUrl: 'https://spellboundgames.co.nz',
  collectionHandle: 'starwars-unlimited-singles-in-stock',
  productType: 'Star Wars: Unlimited Single',
  source: 'collection-html-product-js',
  priceDivisor: 100
});
