<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
  BulkCardSearchListingDto,
  BulkCardSearchRequestCardDto,
  BulkCardSearchResponseDto
} from '../../../shared/contracts/cards';
import ActionButton from '../../components/ActionButton.vue';
import AppPage from '../../components/AppPage.vue';
import CardImageFrame from '../../components/CardImageFrame.vue';
import ConsoleHeader from '../../components/ConsoleHeader.vue';
import ConsoleLabel from '../../components/ConsoleLabel.vue';
import ConsolePanel from '../../components/ConsolePanel.vue';
import ExternalIconLink from '../../components/ExternalIconLink.vue';
import ListingRow from '../../components/ListingRow.vue';
import ListingStats from '../../components/ListingStats.vue';
import MarketplaceSellerMeta from '../../components/MarketplaceSellerMeta.vue';
import NameChip from '../../components/NameChip.vue';
import { bulkSearchCards } from './useBulkCardSearch';

type SellerGroup = {
  sellerId: string;
  sellerName: string;
  listings: BulkCardSearchListingDto[];
  totalMatchedQuantity: number;
  cartUrl: string | null;
  cartItemCount: number;
};

const maxBulkSearchNames = 150;

const rawCardNames = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const result = ref<BulkCardSearchResponseDto | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const parsedCards = computed(() => parseCardList(rawCardNames.value));
const matchedCardsWithoutListings = computed(() =>
  result.value?.matchedCards.filter(card => card.missingQuantity > 0) ?? []
);
const sellerGroups = computed<SellerGroup[]>(() => {
  const groups = new Map<string, SellerGroup>();
  const cartsBySeller = new Map((result.value?.sellerCarts ?? []).map(cart => [cart.sellerId, cart]));

  for (const listing of result.value?.listings ?? []) {
    const cart = cartsBySeller.get(listing.sellerId);
    const group = groups.get(listing.sellerId) ?? {
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      listings: [],
      totalMatchedQuantity: 0,
      cartUrl: cart?.cartUrl ?? null,
      cartItemCount: cart?.itemCount ?? 0
    };

    group.listings.push(listing);
    group.totalMatchedQuantity += listing.requestedQuantity;
    groups.set(listing.sellerId, group);
  }

  return [...groups.values()].sort((a, b) => a.sellerName.localeCompare(b.sellerName));
});

function parseCardList(value: string): BulkCardSearchRequestCardDto[] {
  const cards = new Map<string, BulkCardSearchRequestCardDto>();

  for (const line of value.split(/\r?\n|;/)) {
    const item = parseCardListLine(line);
    if (!item) continue;

    const key = item.name.toLowerCase();
    const existing = cards.get(key);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cards.set(key, item);
    }
  }

  return [...cards.values()];
}

function parseCardListLine(line: string): BulkCardSearchRequestCardDto | null {
  const cleanLine = line
      .replace(/^\s*(?:[-*]|\d+[.)])\s*/, '')
      .trim()
      .replace(/\s+/g, ' ');

  if (!cleanLine) {
    return null;
  }

  const firstSpaceIndex = cleanLine.indexOf(' ');
  if (firstSpaceIndex === -1) {
    return { name: cleanLine, quantity: 1 };
  }

  const maybeQuantity = cleanLine.slice(0, firstSpaceIndex);
  const quantity = parseQuantityToken(maybeQuantity);

  if (!quantity) {
    return { name: cleanLine, quantity: 1 };
  }

  const name = cleanLine.slice(firstSpaceIndex + 1).trim();
  return name ? { name, quantity } : null;
}

function parseQuantityToken(token: string): number | null {
  const match = token.match(/^(?:x(\d+)|(\d+)x?)$/i);
  if (!match) return null;

  const quantity = Number.parseInt(match[1] ?? match[2], 10);
  return quantity > 0 ? quantity : null;
}

async function runLookup() {
  if (parsedCards.value.length === 0) {
    errorMessage.value = 'Paste or upload at least one card name.';
    return;
  }

  if (parsedCards.value.length > maxBulkSearchNames) {
    errorMessage.value = `Bulk lookup supports up to ${maxBulkSearchNames} unique card names.`;
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    result.value = await bulkSearchCards(parsedCards.value);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to run bulk lookup';
  } finally {
    isLoading.value = false;
  }
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  rawCardNames.value = await file.text();
  result.value = null;
  errorMessage.value = null;
}

function clearInput() {
  rawCardNames.value = '';
  result.value = null;
  errorMessage.value = null;

  if (fileInput.value) {
    fileInput.value.value = '';
  }
}
</script>

<template>
  <AppPage>
    <ConsolePanel variant="control" aria-label="Bulk card lookup controls">
      <ConsoleLabel>Bulk market scanner</ConsoleLabel>
      <div class="bulk-grid">
        <label class="bulk-field">
          <span>Card names</span>
          <textarea
            v-model="rawCardNames"
            placeholder="Paste one card name per line..."
            rows="10"
          ></textarea>
        </label>

        <aside class="upload-console">
          <span class="console-kicker">Input stream</span>
          <p>Paste a deck list or upload a plain text list. Use quantities like 2 Waylay, 2x Waylay, or x2 Waylay.</p>
          <input ref="fileInput" type="file" accept=".txt,.csv,text/plain,text/csv" @change="handleFileUpload" />
          <div class="lookup-stats">
            <strong>{{ parsedCards.length.toString().padStart(2, '0') }}</strong>
            <span>unique names ready</span>
          </div>
        </aside>
      </div>

      <div class="bulk-actions">
        <ActionButton :disabled="isLoading" @click="runLookup">
          {{ isLoading ? 'Scanning...' : 'Find listings' }}
        </ActionButton>
        <ActionButton variant="secondary" @click="clearInput">Clear</ActionButton>
      </div>

      <p v-if="errorMessage" class="error screen-message">{{ errorMessage }}</p>
    </ConsolePanel>

    <ConsolePanel v-if="result" aria-live="polite">
      <ConsoleHeader label="Seller groups" :meta="`${result.listings.length.toString().padStart(2, '0')} listings`" />

      <p v-if="sellerGroups.length === 0" class="muted screen-message">
        No active listings were found for the matched cards.
      </p>

      <div v-else class="seller-list">
        <article v-for="seller in sellerGroups" :key="seller.sellerId" class="seller-group">
          <header class="seller-header">
            <div class="seller-title">
              <strong>{{ seller.sellerName }}</strong>
              <span>{{ seller.listings.length }} listings / {{ seller.totalMatchedQuantity }} matched</span>
            </div>
            <ActionButton v-if="seller.cartUrl" :href="seller.cartUrl">Add {{ seller.cartItemCount }} to cart</ActionButton>
            <ActionButton v-else disabled>Cart unavailable</ActionButton>
          </header>

          <div class="listing-list">
            <ListingRow v-for="listing in seller.listings" :key="listing.id" variant="bulk">
              <RouterLink class="card-link" :to="`/cards/${listing.cardId}`">
                <CardImageFrame :image-url="listing.cardImageUrl" :alt="listing.cardName" variant="mini" />
                <div class="card-copy">
                  <strong>{{ listing.cardName }}</strong>
                  <MarketplaceSellerMeta
                    :source-name="listing.sellerName"
                    :seller-name="listing.marketplaceSellerName"
                    :seller-location="listing.marketplaceSellerLocation"
                    :seller-rating="listing.marketplaceSellerRating"
                    :is-store="listing.marketplaceIsStore"
                    :allow-pickups="listing.marketplaceAllowPickups"
                  />
                </div>
              </RouterLink>

              <ListingStats
                :condition="listing.condition"
                :quantity="listing.quantity"
                :price-nzd="listing.priceNzd"
                :requested-quantity="listing.requestedQuantity"
              />

              <ExternalIconLink size="md" :href="listing.productUrl" :label="`View ${listing.cardName} at ${listing.sellerName}`" />
            </ListingRow>
          </div>
        </article>
      </div>

      <section v-if="matchedCardsWithoutListings.length" class="unmatched-panel">
        <div class="subsection-heading">Matched, no current stock</div>
        <div class="name-chip-list">
          <NameChip v-for="card in matchedCardsWithoutListings" :key="card.id" :to="`/cards/${card.id}`">
            {{ card.missingQuantity }}x {{ card.name }}
          </NameChip>
        </div>
      </section>

      <section class="unmatched-panel">
        <div class="subsection-heading">Unmatched input</div>
        <p v-if="result.unmatchedNames.length === 0" class="muted screen-message">Every submitted card name matched the databank.</p>
        <div v-else class="name-chip-list">
          <NameChip v-for="name in result.unmatchedNames" :key="name" variant="warning">{{ name }}</NameChip>
        </div>
      </section>
    </ConsolePanel>
  </AppPage>
</template>

<style scoped>
.subsection-heading,
.console-kicker {
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.subsection-heading::before {
  content: '//// ';
  color: #38bdf8;
}

.bulk-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr) 280px;
}

.bulk-field {
  display: grid;
  gap: 8px;
}

.bulk-field span {
  color: #bae6fd;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

textarea,
.upload-console,
.seller-group {
  background:
    linear-gradient(90deg, rgba(2, 6, 23, 0.92), rgba(8, 47, 73, 0.4)),
    rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(125, 211, 252, 0.24);
}

textarea {
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.08) inset;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
  color: #f5f7fb;
  font: inherit;
  font-weight: 700;
  min-height: 220px;
  padding: 13px 15px;
  resize: vertical;
}

textarea:focus {
  border-color: #fbbf24;
  box-shadow:
    0 0 20px rgba(251, 191, 36, 0.11),
    0 0 24px rgba(14, 165, 233, 0.14) inset;
  outline: none;
}

.upload-console {
  align-content: start;
  clip-path: polygon(0 12px, 12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%);
  display: grid;
  gap: 14px;
  padding: 14px;
}

.upload-console p,
.screen-message {
  margin: 0;
}

.upload-console p {
  color: #aab4c4;
  font-size: 0.92rem;
  line-height: 1.45;
}

.upload-console input {
  color: #cbd5e1;
  font: inherit;
  font-size: 0.82rem;
}

.lookup-stats {
  border-top: 1px solid rgba(125, 211, 252, 0.18);
  display: grid;
  gap: 2px;
  padding-top: 12px;
}

.lookup-stats strong {
  color: #7dd3fc;
  font-size: 1.8rem;
  line-height: 1;
}

.lookup-stats span {
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.bulk-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.seller-list,
.listing-list,
.unmatched-panel {
  display: grid;
  gap: 12px;
}

.seller-group {
  clip-path: polygon(0 12px, 12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%);
  padding: 12px;
}

.seller-header {
  align-items: center;
  border-bottom: 1px solid rgba(125, 211, 252, 0.18);
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
}

.seller-title {
  display: grid;
  gap: 4px;
}

.seller-title strong {
  color: #f8fafc;
  font-size: 1rem;
}

.seller-title span {
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.card-link {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: auto 1fr;
  text-decoration: none;
}

.card-copy {
  display: grid;
  gap: 4px;
}

.card-copy strong {
  color: #f8fafc;
}

.unmatched-panel {
  border-top: 1px solid rgba(125, 211, 252, 0.2);
  padding-top: 16px;
}

.name-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 860px) {
  .bulk-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .seller-header {
    align-items: start;
    display: grid;
  }

  .seller-header {
    grid-template-columns: 1fr;
  }

  :deep(.action-button) {
    justify-self: start;
  }
}
</style>
