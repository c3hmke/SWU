import type { BulkCardSearchResponseDto } from '../../../shared/contracts/cards';
import { apiUrl } from '../../api';

export async function bulkSearchCards(names: string[]): Promise<BulkCardSearchResponseDto> {
  const response = await fetch(apiUrl('/api/cards/bulk-search'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ names })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? 'Unable to run bulk lookup');
  }

  return response.json();
}
