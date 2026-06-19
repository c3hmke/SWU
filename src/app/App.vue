<template>
  <div class="app-shell">
    <header class="site-header">
      <RouterLink to="/cards" class="brand">SWU Singles NZ</RouterLink>
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
