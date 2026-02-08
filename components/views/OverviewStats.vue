<script setup lang="ts">
interface Stat {
  value: number | string;
  label: string;
}

defineProps<{
  stats: Stat[];
  layout?: 'row' | 'grid';
}>();
</script>

<template>
  <div class="stats-container" :class="{ 'stats-grid': layout === 'grid' }">
    <div v-for="stat in stats" :key="stat.label" class="stat-item">
      <span class="stat-value">{{ stat.value }}</span>
      <span class="stat-label">{{ stat.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-container {
  display: flex;
  gap: 48px;
  margin-bottom: 48px;
}

.stats-container.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px 48px;
  margin-bottom: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: 300;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--color-text);
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--color-text-tertiary);
  margin-top: 8px;
}
</style>
