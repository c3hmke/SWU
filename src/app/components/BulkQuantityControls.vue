<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId } from 'vue';

defineProps<{
  name: string;
  quantity: number;
}>();

defineEmits<{
  increment: [];
  decrement: [];
}>();

const controls = ref<HTMLElement | null>(null);
const tooltip = ref<HTMLElement | null>(null);
const tooltipId = useId();
const isTooltipVisible = ref(false);
const tooltipPosition = ref({ left: '0px', top: '0px' });

async function showTooltip() {
  isTooltipVisible.value = true;
  await nextTick();

  if (!isTooltipVisible.value) return;

  positionTooltip();
  window.addEventListener('resize', positionTooltip);
  window.addEventListener('scroll', positionTooltip, true);
}

function hideTooltip() {
  isTooltipVisible.value = false;
  window.removeEventListener('resize', positionTooltip);
  window.removeEventListener('scroll', positionTooltip, true);
}

function handleFocusOut(event: FocusEvent) {
  if (!controls.value?.contains(event.relatedTarget as Node | null)) {
    hideTooltip();
  }
}

function positionTooltip() {
  if (!controls.value || !tooltip.value) return;

  const controlBounds = controls.value.getBoundingClientRect();
  const tooltipBounds = tooltip.value.getBoundingClientRect();
  const edgeGap = 8;
  const left = Math.min(
    window.innerWidth - tooltipBounds.width - edgeGap,
    Math.max(edgeGap, controlBounds.right - tooltipBounds.width)
  );
  const fitsAbove = controlBounds.top >= tooltipBounds.height + edgeGap * 2;
  const top = fitsAbove
    ? controlBounds.top - tooltipBounds.height - edgeGap
    : Math.min(
        window.innerHeight - tooltipBounds.height - edgeGap,
        controlBounds.bottom + edgeGap
      );

  tooltipPosition.value = {
    left: `${left}px`,
    top: `${Math.max(edgeGap, top)}px`
  };
}

onBeforeUnmount(hideTooltip);
</script>

<template>
  <div
    ref="controls"
    class="bulk-quantity-controls"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focusin="showTooltip"
    @focusout="handleFocusOut"
  >
    <template v-if="quantity">
      <button
        type="button"
        :aria-describedby="tooltipId"
        :aria-label="`Remove one ${name} from bulk search`"
        @click="$emit('decrement')"
      >−</button>
      <span :aria-label="`${quantity} in bulk search`">{{ quantity }}</span>
    </template>
    <button
      type="button"
      :aria-describedby="tooltipId"
      :aria-label="`Add one ${name} to bulk search`"
      @click="$emit('increment')"
    >+</button>
    <Teleport to="body">
      <span
        v-if="isTooltipVisible"
        :id="tooltipId"
        ref="tooltip"
        class="bulk-search-tooltip"
        :style="tooltipPosition"
        role="tooltip"
      >Adjust bulk search</span>
    </Teleport>
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

.bulk-search-tooltip {
  background: rgba(2, 6, 23, 0.98);
  border: 1px solid rgba(125, 211, 252, 0.42);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.54);
  color: #e2e8f0;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  min-width: 0;
  padding: 6px 8px;
  pointer-events: none;
  position: fixed;
  white-space: nowrap;
  z-index: 10000;
}
</style>
