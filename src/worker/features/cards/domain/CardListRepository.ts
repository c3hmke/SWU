import type { CardListItem } from './CardListItem';

export interface CardListRepository {
  listWithCurrentPrices(): Promise<CardListItem[]>;
}
