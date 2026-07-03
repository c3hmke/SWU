import { createShopifyCollectionAdapter } from '../integrations/shopifyIntegration';
import { normalizeCondition } from '../../../shared/conditionNormalizer';

export const ironKnightGamingAdapter = createShopifyCollectionAdapter({
  key: 'ironknightgaming-shopify',
  sellerName: 'Iron Knight Gaming',
  baseUrl: 'https://ironknightgaming.co.nz',
  collectionHandle: 'all',
  productType: 'Star Wars: Unlimited Singles',
  source: 'products-json',
  mapProductName(product) {
    const match = product.title.match(/^(.*?)\s+\[[^\]]+\]\s+-\s+(\d+(?:\/\d+)?)/);

    if (!match || !product.vendor) {
      return product.title;
    }

    return `${match[1].trim()} (${match[2]}) [${product.vendor}]`;
  },
  mapCondition(_product, variant) {
    if (!variant.option3 || variant.option3 === 'Normal') {
      return null;
    }

    return normalizeCondition(variant.option3);
  }
});
