import { createShopifyCollectionAdapter } from '../integrations/shopifyIntegration';

export const beaDndGamesAdapter = createShopifyCollectionAdapter({
  key: 'beadndgames-shopify',
  sellerName: 'Bea DnD Games',
  baseUrl: 'https://beadndgames.co.nz',
  collectionHandle: 'star-wars-unlimited-singles',
  productType: 'Star Wars: Unlimited Single',
  source: 'products-json'
});
