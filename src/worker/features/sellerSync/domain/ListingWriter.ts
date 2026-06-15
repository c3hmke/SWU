import type { ExternalListing } from './ExternalListing';

export type MatchedListing = ExternalListing & {
  cardId: string;
};

export interface ListingWriter {
  upsertMatched(sellerId: string, listings: MatchedListing[], seenAt: string): Promise<number>;
  markMissingAsUnavailable(sellerId: string, seenExternalIds: string[]): Promise<number>;
}
