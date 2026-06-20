<template>
  <span class="console-label"><slot /></span>
</template>

<style scoped>
.console-label {
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.console-label::before {
  content: '//// ';
  color: #38bdf8;
}

.console-label.decorated::after {
  content: '';
  border-top: 1px solid rgba(251, 191, 36, 0.34);
  display: inline-block;
  margin-left: 12px;
  transform: translateY(-0.25em);
  width: min(18vw, 160px);
}
</style>
