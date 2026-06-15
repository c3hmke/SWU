import type { ExternalListing } from './ExternalListing';
import type { Seller } from './Seller';
import type { SyncCard } from './SyncCard';

export interface SellerAdapter {
  key: string;
  fetchListings(seller: Seller, cards: SyncCard[]): Promise<ExternalListing[]>;
}
