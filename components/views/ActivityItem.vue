<script setup lang="ts">
defineProps<{
  actor: string;
  action: string;
  target?: string;
  timestamp: string;
}>();

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
</script>

<template>
  <div class="activity-item">
    <div class="activity-content">
      <span class="actor">{{ actor }}</span>
      <span class="action">{{ action }}</span>
      <span v-if="target" class="target">{{ target }}</span>
    </div>
    <span class="timestamp">{{ formatTime(timestamp) }}</span>
  </div>
</template>

<style scoped>
.activity-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.activity-content {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 13px;
  line-height: 1.4;
}

.actor {
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-text);
}

.action {
  font-family: var(--font-body);
  color: var(--color-text-secondary);
}

.target {
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-text);
}

.timestamp {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  margin-left: var(--space-4);
}
</style>
