<script setup lang="ts">
withDefaults(defineProps<{
  href: string;
  label: string;
  size?: 'sm' | 'md';
}>(), {
  size: 'sm'
});
</script>

<template>
  <a class="external-icon-link" :class="`size-${size}`" :href="href" target="_blank" rel="noreferrer" :aria-label="label">
    <span aria-hidden="true">↗</span>
  </a>
</template>

<style scoped>
.external-icon-link {
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
  justify-content: center;
  text-decoration: none;
}

.size-sm {
  height: 28px;
  width: 28px;
}

.size-md {
  height: 32px;
  width: 32px;
}

.external-icon-link:hover {
  border-color: rgba(251, 191, 36, 0.62);
  color: #fbbf24;
}
</style>
