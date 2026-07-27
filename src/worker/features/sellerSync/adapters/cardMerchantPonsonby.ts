import { createShopifyCollectionAdapter } from '../integrations/shopifyIntegration';

export const cardMerchantPonsonbyAdapter = createShopifyCollectionAdapter({
  key: 'cardmerchantponsonby-shopify',
  sellerName: 'Card Merchant Ponsonby',
  baseUrl: 'https://cardmerchantponsonby.co.nz',
  collectionHandle: 'star-wars-unlimited-single',
  productType: 'Star Wars: Unlimited Single',
  source: 'products-json',
  mapProductName(product) {
    if (/\(\d+(?:\/\d+)?\)\s*\[[^\]]+\]$/.test(product.title)) {
      return product.title;
    }

    const collectorNumber = product.body_html?.match(
      /<td[^>]*>\s*Card Number:?\s*<\/td>\s*<td[^>]*>\s*(\d+(?:\/\d+)?)/i
    )?.[1];

    if (!collectorNumber) {
      return product.title;
    }

    return product.title.replace(/\s*(\[[^\]]+\])$/, ` (${collectorNumber}) $1`);
  }
});
