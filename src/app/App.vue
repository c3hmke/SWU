<template>
  <div class="app-shell" spellcheck="false">
    <header class="site-header">
      <RouterLink to="/cards" class="brand" aria-label="Star Wars: Unlimited Singles NZ">
        <span class="brand-primary">Star Wars: Unlimited</span>
        <span class="brand-secondary">Singles NZ</span>
      </RouterLink>
      <nav class="site-nav" aria-label="Primary navigation">
        <RouterLink to="/cards">Cards</RouterLink>
        <RouterLink to="/bulk-search">Bulk lookup</RouterLink>
        <RouterLink to="/contact">Contact</RouterLink>
      </nav>
    </header>

    <aside class="sponsor-rail" aria-label="Sponsor message">
      <RouterLink class="sponsor-card" to="/contact">
        <span class="sponsor-controls" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span class="sponsor-screen">
          <span class="sponsor-eyebrow">Sponsor</span>
          <span class="sponsor-title">Support SWU Singles NZ</span>
          <span class="sponsor-copy">This quiet spot helps cover hosting and data costs.</span>
          <span class="sponsor-action">Interested?</span>
        </span>
      </RouterLink>
    </aside>

    <main>
      <RouterView />
    </main>
  </div>
</template>
