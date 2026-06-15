export type SyncSellerResult = {
  syncRunId: string;
  sellerId: string;
  sellerName: string;
  cardsChecked: number;
  listingsFound: number;
  listingsUpdated: number;
  listingsMarkedUnavailable: number;
  unmatchedListings: number;
};
