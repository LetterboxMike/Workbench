<script setup lang="ts">
defineProps<{
  title: string;
  updatedAt: string;
  owner?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};
</script>

<template>
  <div class="doc-item" @click="emit('click')">
    <svg class="doc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
    <span class="doc-title">{{ title }}</span>
    <span v-if="owner" class="doc-owner">{{ owner }}</span>
    <span class="doc-time">{{ formatDate(updatedAt) }}</span>
  </div>
</template>

<style scoped>
.doc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.doc-item:hover {
  background: var(--color-bg-hover);
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
}

.doc-icon {
  width: 15px;
  height: 15px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.doc-title {
  flex: 1;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-owner {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.doc-time {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}
</style>
