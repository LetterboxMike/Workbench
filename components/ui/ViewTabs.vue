<script setup lang="ts">
interface Tab {
  key: string;
  label: string;
}

defineProps<{
  tabs: Tab[];
  active: string;
}>();

const emit = defineEmits<{
  change: [key: string];
}>();
</script>

<template>
  <div class="view-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="tab"
      :class="{ active: active === tab.key }"
      @click="emit('change', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.view-tabs {
  display: flex;
  gap: var(--space-1);
}

.tab {
  padding: 5px var(--space-3);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-normal), color var(--transition-normal);
}

.tab:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.tab.active {
  background: var(--color-bg-active);
  color: var(--color-text);
  font-weight: 500;
}
</style>
