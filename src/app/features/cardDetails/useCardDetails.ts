import type { CardDetailsDto } from '../../../shared/contracts/cards';

export async function getCardDetails(cardId: string): Promise<CardDetailsDto> {
  const response = await fetch(`/api/cards/${encodeURIComponent(cardId)}`);

  if (response.status === 404) {
    throw new Error('Card not found');
  }

  if (!response.ok) {
    throw new Error('Unable to load card details');
  }

  return response.json();
}
