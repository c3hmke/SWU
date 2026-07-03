import type { CardListItemDto } from '../../../shared/contracts/cards';
import { apiUrl } from '../../api';

export async function listCards(filters: { name: string; page?: number; pageSize?: number; signal?: AbortSignal }): Promise<CardListItemDto[]> {
  const searchParams = new URLSearchParams();

  if (filters.name.trim()) {
    searchParams.set('name', filters.name.trim());
  }

  if (filters.page !== undefined) {
    searchParams.set('page', filters.page.toString());
  }

  if (filters.pageSize !== undefined) {
    searchParams.set('pageSize', filters.pageSize.toString());
  }

  const queryString = searchParams.toString();
  const response = await fetch(apiUrl(`/api/cards${queryString ? `?${queryString}` : ''}`), {
    signal: filters.signal
  });

  if (!response.ok) {
    throw new Error('Unable to load cards');
  }

  return response.json();
}
