<script setup lang="ts">
import type { CardListingDto } from '../../../shared/contracts/cards';
import ConsoleLabel from '../../components/ConsoleLabel.vue';
import ConsolePanel from '../../components/ConsolePanel.vue';
import ExternalIconLink from '../../components/ExternalIconLink.vue';
import ListingRow from '../../components/ListingRow.vue';
import ListingStats from '../../components/ListingStats.vue';
import MarketplaceSellerMeta from '../../components/MarketplaceSellerMeta.vue';
import { formatSeenAt } from '../../shared/formatters';

defineProps<{
  listings: CardListingDto[];
}>();
</script>

<template>
  <ConsolePanel>
    <div class="section-heading">
      <div class="listings-console-header">
        <ConsoleLabel class="decorated">Seller telemetry</ConsoleLabel><h2>Available listings</h2>
      </div>
    </div>

    <p v-if="listings.length === 0" class="muted">no listings found</p>

    <div v-else class="listing-list">
      <ListingRow v-for="listing in listings" :key="listing.id">
        <div class="seller-cell">
          <ExternalIconLink :href="listing.productUrl" :label="`View ${listing.sellerName} listing`" />
          <div class="seller-copy">
            <strong>{{ listing.sellerName }}</strong>
            <MarketplaceSellerMeta
              :source-name="listing.sellerName"
              :seller-name="listing.marketplaceSellerName"
              :seller-location="listing.marketplaceSellerLocation"
              :seller-rating="listing.marketplaceSellerRating"
              :is-store="listing.marketplaceIsStore"
              :allow-pickups="listing.marketplaceAllowPickups"
            />
          </div>
        </div>

        <ListingStats :condition="listing.condition" :quantity="listing.quantity" :price-nzd="listing.priceNzd" />

        <div class="listing-actions">
          <span class="seen-cell"><span aria-hidden="true">⌖</span>{{ formatSeenAt(listing.lastSeenAt) }}</span>
        </div>
      </ListingRow>
    </div>
  </ConsolePanel>
</template>

<style scoped>
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

.seller-cell {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: auto 1fr;
}

.seller-copy {
  display: grid;
  gap: 4px;
}

.seller-copy strong {
  color: #f8fafc;
}

.listing-actions {
  align-items: center;
  display: flex;
  justify-content: end;
}

.seen-cell {
  align-items: center;
  background: rgba(2, 6, 23, 0.5);
  border: 1px solid rgba(251, 191, 36, 0.18);
  color: #cbd5e1;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 900;
  gap: 6px;
  letter-spacing: 0.08em;
  padding: 7px 8px;
  white-space: nowrap;
}

.seen-cell span {
  color: #fbbf24;
  font-size: 0.82rem;
  line-height: 1;
}

@media (max-width: 720px) {
  .listings-console-header {
    align-items: start;
    display: grid;
  }

  h2 {
    text-align: left;
  }

  .listing-actions {
    justify-content: start;
  }
}
</style>
