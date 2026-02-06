<template>
  <footer class="marketing-footer">
    <div class="footer-container">
      <div class="footer-content">
        <!-- Left: Wordmark -->
        <div class="footer-brand">
          <span class="wordmark">workbench</span>
          <span class="tagline">Operational clarity for project teams</span>
        </div>

        <!-- Right: Links -->
        <div class="footer-links">
          <div class="link-group">
            <span class="group-label">product</span>
            <NuxtLink to="/login" class="footer-link">sign up</NuxtLink>
            <NuxtLink to="/login" class="footer-link">sign in</NuxtLink>
            <a href="https://github.com" class="footer-link" target="_blank" rel="noopener noreferrer">github</a>
          </div>

          <div class="link-group">
            <span class="group-label">resources</span>
            <NuxtLink to="/" class="footer-link">design system</NuxtLink>
            <NuxtLink to="/" class="footer-link">documentation</NuxtLink>
            <NuxtLink to="/" class="footer-link">api reference</NuxtLink>
          </div>

          <div class="link-group">
            <span class="group-label">company</span>
            <NuxtLink to="/" class="footer-link">about</NuxtLink>
            <NuxtLink to="/" class="footer-link">privacy</NuxtLink>
            <NuxtLink to="/" class="footer-link">terms</NuxtLink>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="footer-bottom">
        <span class="copyright">© {{ currentYear }} BetterSignShop. Built for focused teams.</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>

<style scoped>
.marketing-footer {
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border);
  padding: var(--space-12) 0 var(--space-6);
  margin-top: var(--space-12);
}

.footer-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  gap: var(--space-12);
  margin-bottom: var(--space-8);
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.wordmark {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  letter-spacing: 0.02em;
}

.tagline {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  opacity: 0.6;
}

.footer-links {
  display: flex;
  gap: var(--space-12);
}

.link-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.group-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 300;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
  letter-spacing: 0.14em;
  opacity: 0.4;
  margin-bottom: var(--space-1);
}

.footer-link {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary);
  text-decoration: none;
  text-transform: lowercase;
  transition: color var(--transition-fast);
}

.footer-link:hover {
  color: var(--color-text);
}

.footer-bottom {
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}

.copyright {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

/* Mobile */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: var(--space-8);
  }

  .footer-links {
    flex-direction: column;
    gap: var(--space-6);
  }

  .footer-container {
    padding: 0 var(--space-4);
  }
}
</style>
