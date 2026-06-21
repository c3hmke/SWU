import type { SellerAdapter } from '../model';
import { badgersSettNzAdapter } from './badgersSettNz';
import { beaDndGamesAdapter } from './beaDndGames';
import { CalicoKeepStorepassAdapter } from './calicoKeep';
import { goblinGamesAdapter } from './goblinGames';
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
    badgersSettNzAdapter,
    beaDndGamesAdapter,
    goblinGamesAdapter
  ];

  return new Map<string, SellerAdapter>(adapters.map(adapter => [adapter.key, adapter]));
}
