import { createShopifyCollectionAdapter } from '../integrations/shopifyIntegration';

export const badgersSettNzAdapter = createShopifyCollectionAdapter({
  key: 'badgerssett-shopify',
  sellerName: 'Badgers Sett NZ',
  baseUrl: 'https://badgerssettnz.com',
  collectionHandle: 'star-wars-unlimited-singles',
  productType: 'Star Wars: Unlimited Single',
  source: 'products-json'
});
