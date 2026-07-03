export type Card = {
  id: string;
  name: string;
  setCode: string;
  setName: string | null;
  collectorNumber: number;
  totalCards: number | null;
  imageUrl: string | null;
  variantOf: string | null;
};

export type CardListItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  lowestPriceNzd: number;
};

export type CardListing = {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerSlug: string;
  condition: string | null;
  priceNzd: number;
  quantity: number;
  productUrl: string;
  marketplaceSellerName: string | null;
  marketplaceSellerProfileName: string | null;
  marketplaceSellerLocation: string | null;
  marketplaceSellerRating: number | null;
  marketplaceIsStore: boolean | null;
  marketplaceAllowPickups: boolean | null;
  lastSeenAt: string;
};

export type BulkCardListing = CardListing & {
  externalId: string;
  sellerAdapterKey: string;
  sellerWebsiteUrl: string;
  cardId: string;
  cardName: string;
  cardImageUrl: string | null;
};

export type CardListSearchCriteria = {
  name: string | null;
};
