import { NotFoundError } from '../../../../shared/errors/NotFoundError';
import { createUlid } from '../../../../shared/kernel/createUlid';
import type { SellerAdapter } from '../../domain/SellerAdapter';
import type { ListingWriter, MatchedListing } from '../../domain/ListingWriter';
import type { SellerRepository } from '../../domain/SellerRepository';
import type { SyncCardRepository } from '../../domain/SyncCardRepository';
import type { SyncRunRepository } from '../../domain/SyncRunRepository';
import type { UnmatchedListingWriter } from '../../domain/UnmatchedListingWriter';
import { parseListingIdentity } from '../MatchExternalListing/parseListingIdentity';
import type { SyncSellerCommand } from './SyncSellerCommand';
import type { SyncSellerResult } from './SyncSellerResult';

export class SyncSellerHandler {
  constructor(
    private readonly sellers: SellerRepository,
    private readonly cards: SyncCardRepository,
    private readonly adapters: Map<string, SellerAdapter>,
    private readonly listings: ListingWriter,
    private readonly unmatchedListings: UnmatchedListingWriter,
    private readonly syncRuns: SyncRunRepository
  ) {}

  async execute(command: SyncSellerCommand): Promise<SyncSellerResult> {
    const seller = await this.sellers.getBySlug(command.sellerSlug);

    if (!seller || !seller.enabled) {
      throw new NotFoundError('Seller not found');
    }

    const adapter = this.adapters.get(seller.adapterKey);
    if (!adapter) {
      throw new Error(`No seller adapter registered for ${seller.adapterKey}`);
    }

    const startedAt = new Date().toISOString();
    const syncRunId = createUlid(new Date(startedAt));
    await this.syncRuns.create({ id: syncRunId, sellerId: seller.id, startedAt });

    try {
      const cards = await this.cards.listAll();
      const externalListings = await adapter.fetchListings(seller, cards);
      const matched: MatchedListing[] = [];
      const unmatched = [];

      for (const listing of externalListings) {
        const identity = parseListingIdentity(listing.productName);
        const card = identity
          ? await this.cards.findBySetNameAndCollectorNumber(identity.setName, identity.collectorNumber)
          : null;

        if (card) {
          matched.push({ ...listing, cardId: card.id });
        } else {
          unmatched.push(listing);
        }
      }

      const seenAt = new Date().toISOString();
      const listingsUpdated = await this.listings.upsertMatched(seller.id, matched, seenAt);
      const unmatchedUpdated = await this.unmatchedListings.upsertMany(seller.id, unmatched, seenAt);
      const listingsMarkedUnavailable = await this.listings.markMissingAsUnavailable(seller.id, seenAt);

      const result = {
        syncRunId,
        sellerId: seller.id,
        sellerName: seller.name,
        cardsChecked: cards.length,
        listingsFound: externalListings.length,
        listingsUpdated,
        listingsMarkedUnavailable,
        unmatchedListings: unmatchedUpdated
      };

      await this.syncRuns.update(syncRunId, {
        status: 'succeeded',
        finishedAt: new Date().toISOString(),
        cardsChecked: result.cardsChecked,
        listingsFound: result.listingsFound,
        listingsUpdated: result.listingsUpdated,
        listingsMarkedStale: result.listingsMarkedUnavailable
      });

      return result;
    } catch (error) {
      await this.syncRuns.update(syncRunId, {
        status: 'failed',
        finishedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Unknown sync error'
      });

      throw error;
    }
  }
}
