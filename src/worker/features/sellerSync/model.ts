export type Seller = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string;
  adapterKey: string;
  enabled: boolean;
};

export type SyncCard = {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: number;
};

export type ExternalListing = {
  externalId: string;
  productName: string;
  condition: string | null;
  priceNzd: number;
  quantity: number;
  productUrl: string;
  raw: unknown;
};

export type MatchedListing = ExternalListing & {
  cardId: string;
};

export type SellerCartListing = {
  externalId: string;
  productUrl: string;
  quantity: number;
  requestedQuantity: number;
};

export type SellerAdapter = {
  key: string;
  fetchListings(seller: Seller, cards: SyncCard[]): Promise<ExternalListing[]>;
  createCartUrl?(seller: Seller, listings: SellerCartListing[]): string | null;
};

export type SyncRunStatus = 'running' | 'succeeded' | 'failed';

export type SyncRunUpdate = {
  status: SyncRunStatus;
  finishedAt?: string;
  cardsChecked?: number;
  listingsFound?: number;
  listingsUpdated?: number;
  listingsMarkedStale?: number;
  errorMessage?: string;
};

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

export type ParsedListingIdentity = {
  setName: string;
  collectorNumber: number;
};

export function parseListingIdentity(productName: string): ParsedListingIdentity | null {
  const match = productName.match(/\((\d+)(?:\/\d+)?\)\s*\[([^\]]+)\]/);

  if (!match) return null;

  return {
    collectorNumber: Number.parseInt(match[1], 10),
    setName: match[2].trim()
  };
}
