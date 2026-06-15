export type SyncRunStatus = 'running' | 'succeeded' | 'failed';

export type SyncRunUpdate = {
  status: SyncRunStatus;
  finishedAt?: string;
  cardsChecked?: number;
  listingsFound?: number;
  listingsUpdated?: number;
  listingsMarkedStale?: number;
  errorMessage?: string;
};

export interface SyncRunRepository {
  create(input: { id: string; sellerId: string; startedAt: string }): Promise<void>;
  update(id: string, update: SyncRunUpdate): Promise<void>;
}
