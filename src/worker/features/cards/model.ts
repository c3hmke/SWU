export type Card = {
  id: string;
  name: string;
  setCode: string;
  setName: string | null;
  collectorNumber: number;
  totalCards: number | null;
  imageUrl: string | null;
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
  lastSeenAt: string;
};

export type CardListSearchCriteria = {
  name: string | null;
};
