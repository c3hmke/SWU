import type { CardListItemDto } from '../../../shared/contracts/cards';

export async function listCards(): Promise<CardListItemDto[]> {
  const response = await fetch('/api/cards');

  if (!response.ok) {
    throw new Error('Unable to load cards');
  }

  return response.json();
}
