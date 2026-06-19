<script setup lang="ts">
import type { CardListingDto } from '../../../shared/contracts/cards';

defineProps<{
  listings: CardListingDto[];
}>();

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(price);

const formatSeenAt = (seenAt: string) =>
  new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(seenAt));
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
        <div>
          <strong>{{ listing.sellerName }}</strong>
          <p class="muted">
            {{ listing.condition || 'Unknown condition' }}
          </p>
        </div>

        <div class="listing-meta">
          <strong>{{ formatPrice(listing.priceNzd) }}</strong>
          <span class="muted">Qty {{ listing.quantity }}</span>
        </div>

        <div class="listing-actions">
          <span class="muted">Seen {{ formatSeenAt(listing.lastSeenAt) }}</span>
          <a :href="listing.productUrl" target="_blank" rel="noreferrer">View Seller</a>
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
  gap: 14px;
  grid-template-columns: 1fr auto auto;
  padding: 16px;
}

.listing-card > div:first-child strong {
  color: #f8fafc;
}

.listing-meta,
.listing-actions {
  display: grid;
  gap: 4px;
}

.listing-meta strong {
  color: #fbbf24;
  font-size: 1.05rem;
  letter-spacing: 0.03em;
}

.listing-actions {
  justify-items: end;
}

.listing-actions a {
  color: #7dd3fc;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-decoration: none;
  text-transform: uppercase;
}

.listing-actions a:hover {
  color: #fbbf24;
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

  .listing-actions {
    justify-items: start;
  }
}
</style>
