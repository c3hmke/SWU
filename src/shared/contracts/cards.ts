export type CardDetailsDto = {
  id: string;
  name: string;
  setCode: string;
  setName: string | null;
  collectorNumber: number;
  imageUrl: string | null;
  listings: CardListingDto[];
};

export type CardListingDto = {
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
