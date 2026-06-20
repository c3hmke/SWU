<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'control' | 'results' | 'hero';
  ariaLabel?: string;
}>(), {
  variant: 'results',
  ariaLabel: undefined
});
</script>

<template>
  <section class="console-panel" :class="`variant-${variant}`" :aria-label="ariaLabel">
    <slot />
  </section>
</template>

<style scoped>
.console-panel {
  border: 1px solid rgba(125, 211, 252, 0.28);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.86) inset,
    0 18px 80px rgba(0, 0, 0, 0.26),
    0 0 42px rgba(14, 165, 233, 0.08);
  clip-path: polygon(0 16px, 16px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
  display: grid;
  overflow: hidden;
  position: relative;
}

.console-panel::before,
.console-panel::after {
  content: '';
  pointer-events: none;
  position: absolute;
}

.console-panel::before {
  inset: 0;
  background:
    linear-gradient(rgba(125, 211, 252, 0.04) 50%, transparent 50%) 0 0 / 100% 6px,
    linear-gradient(90deg, rgba(125, 211, 252, 0.08), transparent 18%, transparent 82%, rgba(251, 191, 36, 0.08));
  mix-blend-mode: screen;
  opacity: 0.42;
}

.console-panel::after {
  border-bottom: 2px solid rgba(251, 191, 36, 0.74);
  border-left: 2px solid rgba(251, 191, 36, 0.74);
  bottom: 10px;
  height: 18px;
  left: 10px;
  width: 18px;
}

.console-panel > :deep(*) {
  position: relative;
  z-index: 1;
}

.variant-control {
  background:
    radial-gradient(circle at 8% 0, rgba(14, 165, 233, 0.2), transparent 34%),
    linear-gradient(135deg, rgba(8, 13, 26, 0.96), rgba(15, 23, 42, 0.82));
  gap: 12px;
  padding: 18px clamp(16px, 3vw, 26px) 20px;
}

.variant-results {
  background:
    radial-gradient(circle at 50% -10%, rgba(59, 130, 246, 0.16), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.78));
  gap: 18px;
  padding: clamp(16px, 2.6vw, 28px);
}

.variant-hero {
  align-items: start;
  background:
    radial-gradient(circle at 18% 0, rgba(14, 165, 233, 0.2), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.82));
  clip-path: polygon(0 18px, 18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
  gap: clamp(10px, 3vw, 10px);
  grid-template-columns: minmax(280px, 420px) 1fr;
  padding: clamp(10px, 1.8vw, 0px) clamp(14px, 2.5vw, 24px) clamp(14px, 2.5vw, 24px);
}

.variant-hero::before {
  opacity: 0.36;
}

@media (max-width: 800px) {
  .variant-hero {
    grid-template-columns: 1fr;
  }
}
</style>
