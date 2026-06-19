<script setup lang="ts">
import type { CardListingDto } from '../../../shared/contracts/cards';

defineProps<{
  listings: CardListingDto[];
}>();

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(price);

const formatSeenAt = (seenAt: string) =>
  new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(seenAt));

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
</script>

<template>
  <section class="listings-panel">
    <div class="section-heading">
      <div class="listings-console-header">
        <span class="panel-label">Seller telemetry</span><h2>Available listings</h2>
      </div>
    </div>

    <p v-if="listings.length === 0" class="muted">No sellers currently have this card in stock.</p>

    <div v-else class="listing-list">
      <article v-for="listing in listings" :key="listing.id" class="listing-card">
        <div class="seller-cell">
          <a class="seller-link" :href="listing.productUrl" target="_blank" rel="noreferrer" :aria-label="`View ${listing.sellerName} listing`">
            <span aria-hidden="true">↗</span>
          </a>
          <strong>{{ listing.sellerName }}</strong>
        </div>

        <div class="listing-stats">
          <span class="stat-cell condition-code">{{ formatCondition(listing.condition) }}</span>
          <span class="stat-cell">QTY {{ listing.quantity }}</span>
          <strong class="stat-cell price-cell">{{ formatPrice(listing.priceNzd) }}</strong>
        </div>

        <div class="listing-actions">
          <span class="muted">Seen {{ formatSeenAt(listing.lastSeenAt) }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.listings-panel {
  position: relative;
  background:
    radial-gradient(circle at 50% -20%, rgba(59, 130, 246, 0.16), transparent 36%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.78));
  border: 1px solid rgba(125, 211, 252, 0.24);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.86) inset,
    0 18px 80px rgba(0, 0, 0, 0.26),
    0 0 42px rgba(14, 165, 233, 0.08);
  clip-path: polygon(0 16px, 16px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
  overflow: hidden;
  padding: clamp(18px, 3vw, 28px);
}

.listings-panel::before,
.listings-panel::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.listings-panel::before {
  inset: 0;
  background:
    linear-gradient(rgba(125, 211, 252, 0.04) 50%, transparent 50%) 0 0 / 100% 6px,
    linear-gradient(90deg, rgba(125, 211, 252, 0.08), transparent 18%, transparent 82%, rgba(251, 191, 36, 0.08));
  mix-blend-mode: screen;
  opacity: 0.38;
}

.listings-panel::after {
  border-bottom: 2px solid rgba(251, 191, 36, 0.74);
  border-left: 2px solid rgba(251, 191, 36, 0.74);
  bottom: 10px;
  height: 18px;
  left: 10px;
  width: 18px;
}

.section-heading {
  border-bottom: 1px solid rgba(125, 211, 252, 0.2);
  margin-bottom: 18px;
  padding-bottom: 14px;
}

.listings-console-header {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 6px;
}

.panel-label {
  color: #fbbf24;
  flex: 1 1 auto;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  min-width: 0;
  text-transform: uppercase;
}

.panel-label::before {
  content: '//// ';
  color: #38bdf8;
}

.panel-label::after {
  content: '';
  border-top: 1px solid rgba(251, 191, 36, 0.34);
  display: inline-block;
  margin-left: 12px;
  transform: translateY(-0.25em);
  width: min(18vw, 160px);
}

h2,
p {
  margin: 0;
}

h2 {
  color: #7dd3fc;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-align: right;
  text-shadow: 0 0 18px rgba(14, 165, 233, 0.34);
  text-transform: uppercase;
  white-space: nowrap;
}

.listing-list {
  display: grid;
  gap: 12px;
}

.listing-card {
  align-items: center;
  background:
    linear-gradient(90deg, rgba(8, 47, 73, 0.32), rgba(2, 6, 23, 0.56)),
    rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(125, 211, 252, 0.18);
  clip-path: polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(180px, 1fr) auto auto;
  padding: 6px;
}

.seller-cell {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: auto 1fr;
}

.seller-link {
  align-items: center;
  align-self: center;
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
  height: 28px;
  justify-content: center;
  text-decoration: none;
  width: 28px;
}

.seller-link:hover {
  border-color: rgba(251, 191, 36, 0.62);
  color: #fbbf24;
}

.seller-cell strong {
  color: #f8fafc;
}

.listing-stats,
.listing-actions {
  align-items: center;
  display: flex;
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

.price-cell {
  color: #fbbf24;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
}

.listing-actions {
  justify-items: end;
}

@media (max-width: 720px) {
  .listings-console-header {
    align-items: start;
    display: grid;
  }

  h2 {
    text-align: left;
  }

  .listing-card {
    grid-template-columns: 1fr;
  }

  .listing-stats {
    grid-template-columns: 48px 76px 112px;
    justify-content: start;
  }

  .listing-actions {
    justify-items: start;
  }
}
</style>
