export type CardDetailsDto = {
  id: string;
  slug: string;
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
  slug: string;
  name: string;
  imageUrl: string | null;
  proxiedImageUrl: string | null;
  thumbnailImageUrl: string | null;
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
  marketplaceSellerName: string | null;
  marketplaceSellerProfileName: string | null;
  marketplaceSellerLocation: string | null;
  marketplaceSellerRating: number | null;
  marketplaceIsStore: boolean | null;
  marketplaceAllowPickups: boolean | null;
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
  slug: string;
  name: string;
  imageUrl: string | null;
  requestedQuantity: number;
  missingQuantity: number;
};

export type BulkCardSearchListingDto = CardListingDto & {
  cardId: string;
  cardSlug: string;
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
