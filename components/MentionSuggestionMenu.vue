<script setup lang="ts">
interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

interface MentionItem {
  user: User;
  command: () => void;
}

const props = defineProps<{
  items: MentionItem[];
  selectedIndex: number;
}>();

const emit = defineEmits<{
  select: [index: number];
}>();

const menuRef = ref<HTMLDivElement | null>(null);

watch(
  () => props.selectedIndex,
  () => {
    // Scroll selected item into view
    if (menuRef.value) {
      const items = menuRef.value.querySelectorAll('.mention-item');
      const selectedItem = items[props.selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }
);

// Get initials for avatar fallback
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};
</script>

<template>
  <div ref="menuRef" class="mention-menu">
    <div
      v-for="(item, index) in items"
      :key="item.user.id"
      :class="['mention-item', { selected: index === selectedIndex }]"
      @click="emit('select', index)"
    >
      <div class="mention-avatar">
        <img v-if="item.user.avatar_url" :src="item.user.avatar_url" :alt="item.user.name" />
        <span v-else class="mention-avatar-fallback">{{ getInitials(item.user.name) }}</span>
      </div>
      <div class="mention-content">
        <div class="mention-name">{{ item.user.name }}</div>
        <div class="mention-email">{{ item.user.email }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mention-menu {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  max-height: 240px;
  overflow-y: auto;
  min-width: 260px;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.mention-item:hover,
.mention-item.selected {
  background: var(--color-bg-hover);
}

.mention-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mention-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mention-avatar-fallback {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.mention-content {
  flex: 1;
  min-width: 0;
}

.mention-name {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.mention-email {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
