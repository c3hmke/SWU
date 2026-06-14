import type { Card } from '../domain/Card';

type CardRow = {
  id: string;
  name: string;
  set_code: string;
  set_name: string | null;
  collector_number: number;
  image_url: string | null;
};

export function mapCardRow(row: CardRow): Card {
  return {
    id: row.id,
    name: row.name,
    setCode: row.set_code,
    setName: row.set_name,
    collectorNumber: row.collector_number,
    imageUrl: row.image_url
  };
}
