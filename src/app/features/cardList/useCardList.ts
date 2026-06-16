import type { CardListItemDto } from '../../../shared/contracts/cards';

export async function listCards(filters: { name: string }): Promise<CardListItemDto[]> {
  const searchParams = new URLSearchParams();

  if (filters.name.trim()) {
    searchParams.set('name', filters.name.trim());
  }

  const queryString = searchParams.toString();
  const response = await fetch(`/api/cards${queryString ? `?${queryString}` : ''}`);

  if (!response.ok) {
    throw new Error('Unable to load cards');
  }

  return response.json();
}
