import { createShopifyCollectionAdapter } from '../integrations/shopifyIntegration';

export const goblinGamesAdapter = createShopifyCollectionAdapter({
  key: 'goblingames-shopify',
  sellerName: 'Goblin Games',
  baseUrl: 'https://goblingames.nz',
  collectionHandle: 'star-wars-unlimited-single-cards',
  productType: 'Star Wars: Unlimited Single',
  source: 'products-json'
});
