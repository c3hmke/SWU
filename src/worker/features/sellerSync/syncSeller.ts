import { NotFoundError } from '../../shared/errors/NotFoundError';
import { createUlid } from '../../shared/kernel/createUlid';
import type { ExternalListing, MatchedListing, SellerAdapter, SyncSellerResult } from './model';
import { parseListingIdentity } from './model';
import {
  createSyncRun,
  findSyncCardBySetNameAndCollectorNumber,
  getSellerBySlug,
  listSyncCards,
  markMissingListingsUnavailable,
  updateSyncRun,
  upsertMatchedListings,
  upsertUnmatchedListings
} from './queries';

export async function syncSeller(
  db: D1Database,
  adapters: Map<string, SellerAdapter>,
  sellerSlug: string
): Promise<SyncSellerResult> {
  const seller = await getSellerBySlug(db, sellerSlug);

  if (!seller || !seller.enabled) {
    throw new NotFoundError('Seller not found');
  }

  const adapter = adapters.get(seller.adapterKey);
  if (!adapter) {
    throw new Error(`No seller adapter registered for ${seller.adapterKey}`);
  }

  const startedAt = new Date().toISOString();
  const syncRunId = createUlid(new Date(startedAt));
  await createSyncRun(db, { id: syncRunId, sellerId: seller.id, startedAt });

  try {
    const cards = await listSyncCards(db);
    const externalListings = await adapter.fetchListings(seller, cards);
    const matched: MatchedListing[] = [];
    const unmatched: ExternalListing[] = [];

    for (const listing of externalListings) {
      const identity = parseListingIdentity(listing.productName);
      const card = identity
        ? await findSyncCardBySetNameAndCollectorNumber(db, identity.setName, identity.collectorNumber)
        : null;

      if (card) {
        matched.push({ ...listing, cardId: card.id });
      } else {
        unmatched.push(listing);
      }
    }

    const seenAt = new Date().toISOString();
    const listingsUpdated = await upsertMatchedListings(db, seller.id, matched, seenAt);
    const unmatchedUpdated = await upsertUnmatchedListings(db, seller.id, unmatched, seenAt);
    const listingsMarkedUnavailable = await markMissingListingsUnavailable(db, seller.id, seenAt);

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

    await updateSyncRun(db, syncRunId, {
      status: 'succeeded',
      finishedAt: new Date().toISOString(),
      cardsChecked: result.cardsChecked,
      listingsFound: result.listingsFound,
      listingsUpdated: result.listingsUpdated,
      listingsMarkedStale: result.listingsMarkedUnavailable
    });

    return result;
  } catch (error) {
    await updateSyncRun(db, syncRunId, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : 'Unknown sync error'
    });

    throw error;
  }
}
