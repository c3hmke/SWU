import type { Card } from './Card';

export interface CardRepository {
  getById(id: string): Promise<Card | null>;
}
