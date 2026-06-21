import type { SellerAdapter } from '../model';
import { badgersSettNzAdapter } from './badgersSettNz';
import { CalicoKeepStorepassAdapter } from './calicoKeep';
import { RogueOpsAdapter } from './rogueOps';
import { spellboundGamesAdapter } from './spellboundGames';
import { tcgCollectorNzAdapter } from './tcgCollectorNz';

export function createAdapterRegistry(): Map<string, SellerAdapter> {
  const calicoKeepAdapter = new CalicoKeepStorepassAdapter();
  const rogueOpsAdapter = new RogueOpsAdapter();
  const adapters = [
    calicoKeepAdapter,
    rogueOpsAdapter,
    spellboundGamesAdapter,
    tcgCollectorNzAdapter,
    badgersSettNzAdapter
  ];

  return new Map<string, SellerAdapter>(adapters.map(adapter => [adapter.key, adapter]));
}
