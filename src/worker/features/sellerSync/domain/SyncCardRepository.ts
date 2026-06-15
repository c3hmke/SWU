import type { SyncCard } from './SyncCard';

export interface SyncCardRepository {
  listAll(): Promise<SyncCard[]>;
  findBySetNameAndCollectorNumber(setName: string, collectorNumber: number): Promise<SyncCard | null>;
}
