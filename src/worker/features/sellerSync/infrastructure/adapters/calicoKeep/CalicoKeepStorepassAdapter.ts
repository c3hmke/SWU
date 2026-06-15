import type { ExternalListing } from '../../../domain/ExternalListing';
import type { Seller } from '../../../domain/Seller';
import type { SellerAdapter } from '../../../domain/SellerAdapter';
import type { SyncCard } from '../../../domain/SyncCard';
import type { CalicoKeepStorepassClient } from './CalicoKeepStorepassClient';

const BATCH_SIZE = 50;

export class CalicoKeepStorepassAdapter implements SellerAdapter {
  readonly key = 'calicokeep-storepass';

  constructor(private readonly client: CalicoKeepStorepassClient) {}

  async fetchListings(_seller: Seller, cards: SyncCard[]): Promise<ExternalListing[]> {
    const listings: ExternalListing[] = [];

    for (let index = 0; index < cards.length; index += BATCH_SIZE) {
      const batch = cards.slice(index, index + BATCH_SIZE);
      const results = await this.client.searchCards(batch);

      for (const result of results) {
        for (const product of result.products ?? []) {
          for (const variant of product.variantInfo ?? []) {
            if (variant.inventory_quantity <= 0) {
              continue;
            }

            listings.push({
              externalId: variant.id.toString(),
              productName: product.name,
              condition: variant.title === 'Default Title' ? null : variant.title,
              priceNzd: variant.price,
              quantity: variant.inventory_quantity,
              productUrl: product.url,
              raw: { term: result.term, product, variant }
            });
          }
        }
      }
    }

    return listings;
  }
}
