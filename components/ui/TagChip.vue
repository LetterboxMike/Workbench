<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <span class="tag-chip">{{ label }}</span>
</template>

<style scoped>
.tag-chip {
  display: inline-block;
  padding: 2px var(--space-2);
  background: var(--color-bg-surface);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}
</style>
