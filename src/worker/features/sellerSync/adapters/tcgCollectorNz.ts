import { createShopifyCollectionAdapter } from '../integrations/shopifyIntegration';

export const tcgCollectorNzAdapter = createShopifyCollectionAdapter({
  key: 'tcgcollector-shopify',
  sellerName: 'TCG Collector NZ',
  baseUrl: 'https://tcgcollectornz.com',
  collectionHandle: 'star-wars-unlimited-singles',
  productType: 'Star Wars: Unlimited Single',
  source: 'products-json'
});
