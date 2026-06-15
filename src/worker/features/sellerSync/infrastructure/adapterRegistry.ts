import type { SellerAdapter } from '../domain/SellerAdapter';
import { CalicoKeepStorepassAdapter } from './adapters/calicoKeep/CalicoKeepStorepassAdapter';
import { CalicoKeepStorepassClient } from './adapters/calicoKeep/CalicoKeepStorepassClient';

export function createAdapterRegistry(): Map<string, SellerAdapter> {
  const calicoKeepAdapter = new CalicoKeepStorepassAdapter(new CalicoKeepStorepassClient());

  return new Map([[calicoKeepAdapter.key, calicoKeepAdapter]]);
}
