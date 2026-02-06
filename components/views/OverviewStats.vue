<script setup lang="ts">
interface Stat {
  value: number | string;
  label: string;
}

defineProps<{
  stats: Stat[];
}>();
</script>

<template>
  <div class="stats-row">
    <div v-for="stat in stats" :key="stat.label" class="stat-item">
      <span class="stat-value">{{ stat.value }}</span>
      <span class="stat-label">{{ stat.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-row {
  display: flex;
  gap: var(--space-12);
  margin-bottom: var(--space-12);
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
  margin-top: var(--space-2);
}
</style>
