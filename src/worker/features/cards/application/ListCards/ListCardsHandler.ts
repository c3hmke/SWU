import type { CardListItemDto } from '../../../../../shared/contracts/cards';
import type { CardListRepository } from '../../domain/CardListRepository';

export class ListCardsHandler {
  constructor(private readonly cards: CardListRepository) {}

  async execute(): Promise<CardListItemDto[]> {
    return this.cards.listWithCurrentPrices();
  }
}
