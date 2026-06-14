import type { CardDetailsDto } from '../../../../../shared/contracts/cards';
import { NotFoundError } from '../../../../shared/errors/NotFoundError';
import type { CardListingRepository } from '../../domain/CardListingRepository';
import type { CardRepository } from '../../domain/CardRepository';
import type { GetCardQuery } from './GetCardQuery';

export class GetCardHandler {
  constructor(
    private readonly cards: CardRepository,
    private readonly listings: CardListingRepository
  ) {}

  async execute(query: GetCardQuery): Promise<CardDetailsDto> {
    const card = await this.cards.getById(query.cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const listings = await this.listings.listActiveByCardId(card.id);

    return {
      ...card,
      listings
    };
  }
}
