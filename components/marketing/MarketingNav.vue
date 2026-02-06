<template>
  <nav class="marketing-nav">
    <div class="nav-container">
      <!-- Logo/Wordmark -->
      <NuxtLink to="/" class="logo">
        workbench
      </NuxtLink>

      <!-- Right side: Theme toggle + CTA -->
      <div class="nav-right">
        <button
          type="button"
          class="theme-toggle"
          @click="toggleTheme"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <svg v-if="isDark" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>

        <NuxtLink to="/login?source=marketing" class="cta-button">
          start working
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { isDark, toggle } = useTheme();

const toggleTheme = () => {
  toggle();
};
</script>

<style scoped>
.marketing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  height: var(--topbar-height);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.logo {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  letter-spacing: 0.02em;
  transition: opacity var(--transition-fast);
}

.logo:hover {
  opacity: 0.7;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.theme-toggle .icon {
  width: 16px;
  height: 16px;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-bg);
  background: var(--color-text);
  border-radius: var(--radius-md);
  text-decoration: none;
  text-transform: lowercase;
  transition: opacity var(--transition-fast);
}

.cta-button:hover {
  opacity: 0.9;
}

/* Mobile */
@media (max-width: 480px) {
  .nav-container {
    padding: 0 var(--space-4);
  }

  .cta-button {
    padding: var(--space-2) var(--space-3);
    font-size: 12px;
  }
}
</style>
