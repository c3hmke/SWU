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
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>
