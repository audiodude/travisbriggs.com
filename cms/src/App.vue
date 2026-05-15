<script setup>
</script>

<template>
  <header class="app-header">
    <router-link to="/" class="logo">Garden CMS</router-link>
    <nav>
      <router-link to="/new">+ New Page</router-link>
    </nav>
  </header>
  <main>
    <router-view />
  </main>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a1a;
  background: #f5f5f5;
  line-height: 1.5;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #1a1a1a;
  color: #fff;
}

.app-header a {
  color: #fff;
  text-decoration: none;
}

.app-header .logo {
  font-weight: 600;
  font-size: 1.1rem;
}

.app-header nav a {
  padding: 0.4rem 0.8rem;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 0.85rem;
}

.app-header nav a:hover {
  background: #333;
}

main {
  max-width: 1100px;
  margin: 1.5rem auto;
  padding: 0 1.5rem;
}
</style>
