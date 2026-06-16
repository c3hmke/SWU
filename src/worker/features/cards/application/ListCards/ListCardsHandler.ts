import type { CardListItemDto } from '../../../../../shared/contracts/cards';
import type { CardListSearchCriteria } from '../../domain/CardListRepository';
import type { CardListRepository } from '../../domain/CardListRepository';

export class ListCardsHandler {
  constructor(private readonly cards: CardListRepository) {}

  async execute(criteria: CardListSearchCriteria): Promise<CardListItemDto[]> {
    return this.cards.listWithCurrentPrices(criteria);
  }
}
