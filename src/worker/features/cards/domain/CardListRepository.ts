import type { CardListItem } from './CardListItem';

export type CardListSearchCriteria = {
  name: string | null;
};

export interface CardListRepository {
  listWithCurrentPrices(criteria: CardListSearchCriteria): Promise<CardListItem[]>;
}
