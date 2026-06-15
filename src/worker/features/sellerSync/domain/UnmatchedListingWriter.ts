import type { ExternalListing } from './ExternalListing';

export interface UnmatchedListingWriter {
  upsertMany(sellerId: string, listings: ExternalListing[], seenAt: string): Promise<number>;
}
