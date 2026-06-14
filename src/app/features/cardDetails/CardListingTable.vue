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
      <h2>Available Listings</h2>
      <p class="muted">Sorted by lowest price first.</p>
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
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 24px;
}

.section-heading {
  margin-bottom: 18px;
}

h2,
p {
  margin: 0;
}

.listing-list {
  display: grid;
  gap: 12px;
}

.listing-card {
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr auto auto;
  padding: 16px;
}

.listing-meta,
.listing-actions {
  display: grid;
  gap: 4px;
}

.listing-actions {
  justify-items: end;
}

.listing-actions a {
  color: #93c5fd;
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 720px) {
  .listing-card {
    grid-template-columns: 1fr;
  }

  .listing-actions {
    justify-items: start;
  }
}
</style>
