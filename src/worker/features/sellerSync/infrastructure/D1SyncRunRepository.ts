import type { SyncRunRepository, SyncRunUpdate } from '../domain/SyncRunRepository';

export class D1SyncRunRepository implements SyncRunRepository {
  constructor(private readonly db: D1Database) {}

  async create(input: { id: string; sellerId: string; startedAt: string }): Promise<void> {
    await this.db
      .prepare('insert into sync_runs (id, seller_id, status, started_at) values (?1, ?2, ?3, ?4)')
      .bind(input.id, input.sellerId, 'running', input.startedAt)
      .run();
  }

  async update(id: string, update: SyncRunUpdate): Promise<void> {
    await this.db
      .prepare(
        `update sync_runs set
           status = ?2,
           finished_at = coalesce(?3, finished_at),
           cards_checked = coalesce(?4, cards_checked),
           listings_found = coalesce(?5, listings_found),
           listings_updated = coalesce(?6, listings_updated),
           listings_marked_stale = coalesce(?7, listings_marked_stale),
           error_message = ?8
         where id = ?1`
      )
      .bind(
        id,
        update.status,
        update.finishedAt ?? null,
        update.cardsChecked ?? null,
        update.listingsFound ?? null,
        update.listingsUpdated ?? null,
        update.listingsMarkedStale ?? null,
        update.errorMessage ?? null
      )
      .run();
  }
}
