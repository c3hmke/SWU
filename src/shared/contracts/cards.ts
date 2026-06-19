export type CardDetailsDto = {
  id: string;
  name: string;
  setCode: string;
  setName: string | null;
  collectorNumber: number;
  totalCards: number | null;
  imageUrl: string | null;
  listings: CardListingDto[];
};

export type CardListItemDto = {
  id: string;
  name: string;
  imageUrl: string | null;
  lowestPriceNzd: number;
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

export type BulkCardSearchRequestCardDto = {
  name: string;
  quantity: number;
};

export type BulkCardSearchRequestDto = {
  cards: BulkCardSearchRequestCardDto[];
};

export type BulkCardSearchCardDto = {
  id: string;
  name: string;
  imageUrl: string | null;
  requestedQuantity: number;
  missingQuantity: number;
};

export type BulkCardSearchListingDto = CardListingDto & {
  cardId: string;
  cardName: string;
  cardImageUrl: string | null;
  requestedQuantity: number;
};

export type BulkCardSearchSellerCartDto = {
  sellerId: string;
  sellerName: string;
  sellerSlug: string;
  cartUrl: string | null;
  itemCount: number;
};

export type BulkCardSearchResponseDto = {
  matchedCards: BulkCardSearchCardDto[];
  listings: BulkCardSearchListingDto[];
  sellerCarts: BulkCardSearchSellerCartDto[];
  unmatchedNames: string[];
};
