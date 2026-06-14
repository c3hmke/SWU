import type { Card } from '../domain/Card';
import type { CardRepository } from '../domain/CardRepository';
import { mapCardRow } from './cardRowMapper';

export class D1CardRepository implements CardRepository {
  constructor(private readonly db: D1Database) {}

  async getById(id: string): Promise<Card | null> {
    const row = await this.db
      .prepare(
        `select c.id, c.name, c.set_code, s.name as set_name,
                c.collector_number, c.image_url
         from cards c
         left join sets s on s.code = c.set_code
         where c.id = ?1`
      )
      .bind(id)
      .first();

    return row ? mapCardRow(row as Parameters<typeof mapCardRow>[0]) : null;
  }
}
