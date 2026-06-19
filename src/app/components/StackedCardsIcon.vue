<template>
  <span class="stacked-cards-icon" aria-hidden="true"></span>
</template>

<style scoped>
.stacked-cards-icon {
  display: inline-block;
  height: 16px;
  position: relative;
  width: 14px;
}

.stacked-cards-icon::before,
.stacked-cards-icon::after {
  border: 1px solid currentColor;
  content: '';
  position: absolute;
}

.stacked-cards-icon::before {
  background: rgba(2, 6, 23, 0.76);
  height: 13px;
  left: 4px;
  opacity: 0.54;
  top: 2px;
  transform: rotate(-8deg);
  width: 9px;
}

.stacked-cards-icon::after {
  background:
    radial-gradient(circle, currentColor 0 2px, transparent 2.4px),
    rgba(2, 6, 23, 0.92);
  box-shadow: 0 0 10px rgba(125, 211, 252, 0.16);
  height: 13px;
  left: 0;
  top: 0;
  transform: rotate(-8deg);
  width: 9px;
}
</style>
