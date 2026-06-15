import type { SyncCard } from '../domain/SyncCard';
import type { SyncCardRepository } from '../domain/SyncCardRepository';

type SyncCardRow = {
  id: string;
  name: string;
  set_code: string;
  set_name: string;
  collector_number: number;
};

export class D1SyncCardRepository implements SyncCardRepository {
  constructor(private readonly db: D1Database) {}

  async listAll(): Promise<SyncCard[]> {
    const result = await this.db
      .prepare(
        `select c.id, c.name, c.set_code, s.name as set_name, c.collector_number
         from cards c
         inner join sets s on s.code = c.set_code
         order by c.set_code, c.collector_number`
      )
      .all<SyncCardRow>();

    return result.results.map(mapCard);
  }

  async findBySetNameAndCollectorNumber(setName: string, collectorNumber: number): Promise<SyncCard | null> {
    const row = await this.db
      .prepare(
        `select c.id, c.name, c.set_code, s.name as set_name, c.collector_number
         from cards c
         inner join sets s on s.code = c.set_code
         where lower(s.name) = lower(?1)
           and c.collector_number = ?2`
      )
      .bind(setName, collectorNumber)
      .first<SyncCardRow>();

    return row ? mapCard(row) : null;
  }
}

function mapCard(row: SyncCardRow): SyncCard {
  return {
    id: row.id,
    name: row.name,
    setCode: row.set_code,
    setName: row.set_name,
    collectorNumber: row.collector_number
  };
}
