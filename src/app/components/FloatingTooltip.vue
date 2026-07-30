<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId } from 'vue';

defineProps<{
  text: string;
}>();

const trigger = ref<HTMLElement | null>(null);
const tooltip = ref<HTMLElement | null>(null);
const tooltipId = useId();
const isVisible = ref(false);
const position = ref({ left: '0px', top: '0px' });

async function show() {
  isVisible.value = true;
  await nextTick();

  if (!isVisible.value) return;

  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
}

function hide() {
  isVisible.value = false;
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
}

function handleFocusOut(event: FocusEvent) {
  if (!trigger.value?.contains(event.relatedTarget as Node | null)) {
    hide();
  }
}

function updatePosition() {
  if (!trigger.value || !tooltip.value) return;

  const triggerBounds = trigger.value.getBoundingClientRect();
  const tooltipBounds = tooltip.value.getBoundingClientRect();
  const edgeGap = 8;
  const left = Math.min(
    window.innerWidth - tooltipBounds.width - edgeGap,
    Math.max(edgeGap, triggerBounds.right - tooltipBounds.width)
  );
  const fitsAbove = triggerBounds.top >= tooltipBounds.height + edgeGap * 2;
  const top = fitsAbove
    ? triggerBounds.top - tooltipBounds.height - edgeGap
    : Math.min(
        window.innerHeight - tooltipBounds.height - edgeGap,
        triggerBounds.bottom + edgeGap
      );

  position.value = {
    left: `${left}px`,
    top: `${Math.max(edgeGap, top)}px`
  };
}

onBeforeUnmount(hide);
</script>

<template>
  <span
    ref="trigger"
    class="floating-tooltip-trigger"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="handleFocusOut"
  >
    <slot :tooltip-id="tooltipId" />
    <Teleport to="body">
      <span
        v-if="isVisible"
        :id="tooltipId"
        ref="tooltip"
        class="floating-tooltip"
        :style="position"
        role="tooltip"
      >{{ text }}</span>
    </Teleport>
  </span>
</template>

<style scoped>
.floating-tooltip-trigger {
  display: inline-flex;
}

.floating-tooltip {
  background: rgba(2, 6, 23, 0.98);
  border: 1px solid rgba(125, 211, 252, 0.42);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.54);
  color: #e2e8f0;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  padding: 6px 8px;
  pointer-events: none;
  position: fixed;
  white-space: nowrap;
  z-index: 10000;
}
</style>
