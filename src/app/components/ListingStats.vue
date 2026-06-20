<script setup lang="ts">
import StackedCardsIcon from './StackedCardsIcon.vue';
import { formatCondition, formatPrice } from '../shared/formatters';

const props = defineProps<{
  condition: string | null;
  quantity: number;
  priceNzd: number;
  requestedQuantity?: number;
}>();
</script>

<template>
  <div class="listing-stats">
    <span class="stat-cell condition-code">{{ formatCondition(condition) }}</span>
    <span class="stat-cell quantity-cell"><StackedCardsIcon />{{ props.requestedQuantity ? `${props.requestedQuantity}/${quantity}` : quantity }}</span>
    <strong class="stat-cell price-cell">{{ formatPrice(priceNzd) }}</strong>
  </div>
</template>

<style scoped>
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
</style>
