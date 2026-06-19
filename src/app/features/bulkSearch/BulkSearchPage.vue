<script setup lang="ts">
import { computed, ref } from 'vue';
import StackedCardsIcon from '../../components/StackedCardsIcon.vue';
import type { BulkCardSearchListingDto, BulkCardSearchResponseDto } from '../../../shared/contracts/cards';
import { bulkSearchCards } from './useBulkCardSearch';

type SellerGroup = {
  sellerId: string;
  sellerName: string;
  listings: BulkCardSearchListingDto[];
  totalQuantity: number;
};

const maxBulkSearchNames = 150;

const rawCardNames = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const result = ref<BulkCardSearchResponseDto | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const parsedNames = computed(() => parseCardNames(rawCardNames.value));
const matchedCardIdsWithListings = computed(() => new Set(result.value?.listings.map(listing => listing.cardId) ?? []));
const matchedCardsWithoutListings = computed(() =>
  result.value?.matchedCards.filter(card => !matchedCardIdsWithListings.value.has(card.id)) ?? []
);
const sellerGroups = computed<SellerGroup[]>(() => {
  const groups = new Map<string, SellerGroup>();

  for (const listing of result.value?.listings ?? []) {
    const group = groups.get(listing.sellerId) ?? {
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      listings: [],
      totalQuantity: 0
    };

    group.listings.push(listing);
    group.totalQuantity += listing.quantity;
    groups.set(listing.sellerId, group);
  }

  return [...groups.values()].sort((a, b) => a.sellerName.localeCompare(b.sellerName));
});

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(price);

const conditionLabels: Record<string, string> = {
  'near mint': 'NM',
  'light play': 'LP',
  'moderate play': 'MP',
  'heavy play': 'HP',
  damaged: 'D'
};

function formatCondition(condition: string | null): string {
  if (!condition) return 'U';
  return conditionLabels[condition.trim().toLowerCase()] ?? condition;
}

function parseCardNames(value: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const line of value.split(/\r?\n|;/)) {
    const name = line
      .replace(/^\s*(?:[-*]|\d+[.)])\s*/, '')
      .replace(/^\s*\d+\s*x?\s+/i, '')
      .replace(/\s+x\d+\s*$/i, '')
      .trim()
      .replace(/\s+/g, ' ');
    const key = name.toLowerCase();

    if (key && !seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  }

  return names;
}

async function runLookup() {
  if (parsedNames.value.length === 0) {
    errorMessage.value = 'Paste or upload at least one card name.';
    return;
  }

  if (parsedNames.value.length > maxBulkSearchNames) {
    errorMessage.value = `Bulk lookup supports up to ${maxBulkSearchNames} unique card names.`;
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    result.value = await bulkSearchCards(parsedNames.value);
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
  <section class="bulk-page">
    <section class="bulk-panel" aria-label="Bulk card lookup controls">
      <div class="panel-label">Bulk market scanner</div>
      <div class="bulk-grid">
        <label class="bulk-field">
          <textarea
            v-model="rawCardNames"
            placeholder="Paste one card name per line..."
            rows="10"
          ></textarea>
        </label>

        <aside class="upload-console">
          <span class="console-kicker">Input stream</span>
          <p>Paste a deck list or upload a plain text list. Quantities and bullet prefixes are ignored.</p>
          <input ref="fileInput" type="file" accept=".txt,.csv,text/plain,text/csv" @change="handleFileUpload" />
          <div class="lookup-stats">
            <strong>{{ parsedNames.length.toString().padStart(2, '0') }}</strong>
            <span>unique names ready</span>
          </div>
        </aside>
      </div>

      <div class="bulk-actions">
        <button type="button" class="primary-action" :disabled="isLoading" @click="runLookup">
          {{ isLoading ? 'Scanning...' : 'Find listings' }}
        </button>
        <button type="button" class="secondary-action" @click="clearInput">Clear</button>
      </div>

      <p v-if="errorMessage" class="error screen-message">{{ errorMessage }}</p>
    </section>

    <section v-if="result" class="results-panel" aria-live="polite">
      <div class="screen-header">
        <span>Seller groups</span>
        <span>{{ result.listings.length.toString().padStart(2, '0') }} listings</span>
      </div>

      <p v-if="sellerGroups.length === 0" class="muted screen-message">
        No active listings were found for the matched cards.
      </p>

      <div v-else class="seller-list">
        <article v-for="seller in sellerGroups" :key="seller.sellerId" class="seller-group">
          <header class="seller-header">
            <strong>{{ seller.sellerName }}</strong>
            <span>{{ seller.listings.length }} listings / {{ seller.totalQuantity }} cards</span>
          </header>

          <div class="listing-list">
            <article v-for="listing in seller.listings" :key="listing.id" class="listing-card">
              <RouterLink class="card-link" :to="`/cards/${listing.cardId}`">
                <span class="mini-image">
                  <img v-if="listing.cardImageUrl" :src="listing.cardImageUrl" :alt="listing.cardName" loading="lazy" />
                  <span v-else>No image</span>
                </span>
                <strong>{{ listing.cardName }}</strong>
              </RouterLink>

              <div class="listing-stats">
                <span class="stat-cell condition-code">{{ formatCondition(listing.condition) }}</span>
                <span class="stat-cell quantity-cell"><StackedCardsIcon />{{ listing.quantity }}</span>
                <strong class="stat-cell price-cell">{{ formatPrice(listing.priceNzd) }}</strong>
              </div>

              <a class="seller-link" :href="listing.productUrl" target="_blank" rel="noreferrer" :aria-label="`View ${listing.cardName} at ${listing.sellerName}`">
                <span aria-hidden="true">↗</span>
              </a>
            </article>
          </div>
        </article>
      </div>

      <section v-if="matchedCardsWithoutListings.length" class="unmatched-panel">
        <div class="subsection-heading">Matched, no current stock</div>
        <div class="name-chip-list">
          <RouterLink v-for="card in matchedCardsWithoutListings" :key="card.id" class="name-chip" :to="`/cards/${card.id}`">
            {{ card.name }}
          </RouterLink>
        </div>
      </section>

      <section class="unmatched-panel">
        <div class="subsection-heading">Unmatched input</div>
        <p v-if="result.unmatchedNames.length === 0" class="muted screen-message">Every submitted card name matched the databank.</p>
        <div v-else class="name-chip-list">
          <span v-for="name in result.unmatchedNames" :key="name" class="name-chip unmatched-chip">{{ name }}</span>
        </div>
      </section>
    </section>
  </section>
</template>

<style scoped>
.bulk-page {
  display: grid;
  gap: 12px;
  margin: 0 auto;
  max-width: 1120px;
}

.bulk-panel,
.results-panel {
  position: relative;
  border: 1px solid rgba(125, 211, 252, 0.28);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.86) inset,
    0 18px 80px rgba(0, 0, 0, 0.26),
    0 0 42px rgba(14, 165, 233, 0.08);
  clip-path: polygon(0 16px, 16px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
}

.bulk-panel::before,
.results-panel::before,
.bulk-panel::after,
.results-panel::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.bulk-panel::before,
.results-panel::before {
  inset: 0;
  background:
    linear-gradient(rgba(125, 211, 252, 0.04) 50%, transparent 50%) 0 0 / 100% 6px,
    linear-gradient(90deg, rgba(125, 211, 252, 0.08), transparent 18%, transparent 82%, rgba(251, 191, 36, 0.08));
  mix-blend-mode: screen;
  opacity: 0.42;
}

.bulk-panel::after,
.results-panel::after {
  border-bottom: 2px solid rgba(251, 191, 36, 0.74);
  border-left: 2px solid rgba(251, 191, 36, 0.74);
  bottom: 10px;
  height: 18px;
  left: 10px;
  width: 18px;
}

.bulk-panel {
  background:
    radial-gradient(circle at 8% 0, rgba(14, 165, 233, 0.2), transparent 34%),
    linear-gradient(135deg, rgba(8, 13, 26, 0.96), rgba(15, 23, 42, 0.82));
  display: grid;
  gap: 8px;
  padding: 18px clamp(16px, 3vw, 26px) 20px;
}

.results-panel {
  background:
    radial-gradient(circle at 50% -10%, rgba(59, 130, 246, 0.16), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.78));
  display: grid;
  gap: 12px;
  padding: clamp(16px, 2.6vw, 28px);
}

.panel-label,
.screen-header,
.subsection-heading,
.console-kicker {
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.panel-label::before,
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
.name-chip,
.listing-card,
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

.bulk-actions button {
  border-radius: 0;
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  padding: 10px 14px;
  text-transform: uppercase;
}

.primary-action {
  background: rgba(251, 191, 36, 0.16);
  border: 1px solid rgba(251, 191, 36, 0.48);
  color: #fde68a;
}

.primary-action:disabled {
  cursor: wait;
  opacity: 0.64;
}

.secondary-action {
  background: rgba(14, 165, 233, 0.1);
  border: 1px solid rgba(125, 211, 252, 0.3);
  color: #bae6fd;
}

.screen-header {
  align-items: center;
  border-bottom: 1px solid rgba(125, 211, 252, 0.2);
  display: flex;
  justify-content: space-between;
  padding-bottom: 12px;
}

.screen-header span:last-child {
  color: #7dd3fc;
}

.seller-list,
.listing-list,
.unmatched-panel,
.name-chip-list {
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
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
}

.seller-header strong {
  color: #f8fafc;
  font-size: 1rem;
}

.seller-header span {
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.listing-card {
  align-items: center;
  clip-path: polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(220px, 1fr) auto auto;
  padding: 6px;
}

.card-link {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: auto 1fr;
  text-decoration: none;
}

.card-link strong {
  color: #f8fafc;
}

.mini-image {
  align-items: center;
  background: rgba(2, 6, 23, 0.72);
  border: 1px solid rgba(125, 211, 252, 0.16);
  display: flex;
  height: 48px;
  justify-content: center;
  overflow: hidden;
  width: 36px;
}

.mini-image img {
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.mini-image span {
  color: #64748b;
  font-size: 0.52rem;
  font-weight: 900;
  text-align: center;
  text-transform: uppercase;
}

.listing-stats {
  display: grid;
  gap: 8px;
  grid-template-columns: 48px 76px 112px;
}

.stat-cell {
  background: rgba(2, 6, 23, 0.5);
  border: 1px solid rgba(125, 211, 252, 0.16);
  color: #cbd5e1;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 7px 8px;
  text-align: center;
  text-transform: uppercase;
}

.condition-code {
  color: #7dd3fc;
}

.quantity-cell {
  align-items: center;
  display: inline-flex;
  gap: 7px;
  justify-content: center;
}

.price-cell {
  color: #fbbf24;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
}

.seller-link {
  align-items: center;
  background:
    linear-gradient(135deg, rgba(125, 211, 252, 0.18), rgba(251, 191, 36, 0.1)),
    rgba(2, 6, 23, 0.72);
  border: 1px solid rgba(125, 211, 252, 0.36);
  box-shadow: 0 0 18px rgba(14, 165, 233, 0.12) inset;
  clip-path: polygon(0 6px, 6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%);
  color: #7dd3fc;
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 900;
  height: 32px;
  justify-content: center;
  text-decoration: none;
  width: 32px;
}

.seller-link:hover {
  border-color: rgba(251, 191, 36, 0.62);
  color: #fbbf24;
}

.unmatched-panel {
  border-top: 1px solid rgba(125, 211, 252, 0.2);
  padding-top: 16px;
}

.name-chip-list {
  display: flex;
  flex-wrap: wrap;
}

.name-chip {
  color: #bae6fd;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 7px 9px;
  text-decoration: none;
}

.unmatched-chip {
  border-color: rgba(251, 191, 36, 0.26);
  color: #fde68a;
}

@media (max-width: 860px) {
  .bulk-grid,
  .listing-card {
    grid-template-columns: 1fr;
  }

  .listing-stats {
    justify-content: start;
  }

  .seller-link {
    justify-self: start;
  }
}

@media (max-width: 520px) {
  .screen-header,
  .seller-header {
    align-items: start;
    display: grid;
  }
}
</style>
