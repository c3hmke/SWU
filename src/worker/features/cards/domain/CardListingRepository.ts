import type { CardListing } from './CardListing';

export interface CardListingRepository {
  listActiveByCardId(cardId: string): Promise<CardListing[]>;
}
