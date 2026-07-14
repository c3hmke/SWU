import type { SellerAdapter } from '../model';
import { badgersSettNzAdapter } from './badgersSettNz';
import { beaDndGamesAdapter } from './beaDndGames';
import { calicoKeepAdapter } from './calicoKeep';
import { fetchMarketplaceAdapter } from './fetchMarketplace';
import { goblinGamesAdapter } from './goblinGames';
import { ironKnightGamingAdapter } from './ironKnightGaming';
import { RogueOpsAdapter } from './rogueOps';
import { spellboundGamesAdapter } from './spellboundGames';
import { tcgCollectorNzAdapter } from './tcgCollectorNz';

export function createAdapterRegistry(): Map<string, SellerAdapter> {
  const rogueOpsAdapter = new RogueOpsAdapter();
  const adapters = [
    calicoKeepAdapter,
    rogueOpsAdapter,
    spellboundGamesAdapter,
    tcgCollectorNzAdapter,
    badgersSettNzAdapter,
    beaDndGamesAdapter,
    goblinGamesAdapter,
    ironKnightGamingAdapter,
    fetchMarketplaceAdapter
  ];

  return new Map<string, SellerAdapter>(adapters.map(adapter => [adapter.key, adapter]));
}
