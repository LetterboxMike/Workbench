<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  subtitleMono?: boolean;
}>();
</script>

<template>
  <header class="page-header">
    <div class="header-content">
      <h1 class="title">{{ title }}</h1>
      <p v-if="subtitle" class="subtitle" :class="{ mono: subtitleMono }">
        {{ subtitle }}
      </p>
    </div>
    <div class="header-right">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-8);
}

.header-content {
  flex: 1;
}

.title {
  font-family: var(--font-body);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--color-text);
  margin: 0;
}

.subtitle {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: var(--space-1) 0 0;
}

.subtitle.mono {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: var(--space-4);
}

.header-right:empty {
  display: none;
}
</style>
