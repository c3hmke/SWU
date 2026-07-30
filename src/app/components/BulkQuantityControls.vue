<script setup lang="ts">
defineProps<{
  name: string;
  quantity: number;
}>();

defineEmits<{
  increment: [];
  decrement: [];
}>();
</script>

<template>
  <div class="bulk-quantity-controls">
    <template v-if="quantity">
      <button
        type="button"
        :aria-label="`Remove one ${name} from bulk search`"
        @click="$emit('decrement')"
      >−</button>
      <span :aria-label="`${quantity} in bulk search`">{{ quantity }}</span>
    </template>
    <button
      type="button"
      :aria-label="`Add one ${name} to bulk search`"
      @click="$emit('increment')"
    >+</button>
  </div>
</template>

<style scoped>
.bulk-quantity-controls {
  align-items: center;
  background: rgba(2, 6, 23, 0.92);
  border: 1px solid rgba(125, 211, 252, 0.48);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.46);
  color: #f8fafc;
  display: flex;
  font-size: 0.82rem;
  font-weight: 900;
}

button {
  align-items: center;
  background: transparent;
  border: 0;
  color: #fbbf24;
  cursor: pointer;
  display: flex;
  font: inherit;
  height: 30px;
  justify-content: center;
  padding: 0;
  width: 30px;
}

button:hover,
button:focus-visible {
  background: rgba(14, 165, 233, 0.2);
  outline: none;
}

span {
  min-width: 22px;
  text-align: center;
}
</style>
