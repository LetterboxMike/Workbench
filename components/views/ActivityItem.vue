<script setup lang="ts">
defineProps<{
  actor: string;
  actorAvatar?: string | null;
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

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
</script>

<template>
  <div class="activity-item">
    <div class="avatar">
      <img v-if="actorAvatar" :src="actorAvatar" :alt="actor" class="avatar-img" />
      <span v-else class="avatar-initials">{{ getInitials(actor) }}</span>
    </div>
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
  align-items: center;
  gap: 12px;
  padding: 0;
  margin-bottom: 12px;
}

.activity-item:last-child {
  margin-bottom: 0;
}

.avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-bg-active);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-family: var(--font-mono);
  font-size: 8px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.activity-content {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 13px;
  line-height: 1.4;
  min-width: 0;
}

.actor {
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.action {
  font-family: var(--font-body);
  color: var(--color-text-secondary);
}

.target {
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.timestamp {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}
</style>
