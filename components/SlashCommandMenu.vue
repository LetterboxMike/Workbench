<script setup lang="ts">
interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: () => void;
}

const props = defineProps<{
  items: CommandItem[];
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
      const items = menuRef.value.querySelectorAll('.command-item');
      const selectedItem = items[props.selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }
);
</script>

<template>
  <div ref="menuRef" class="slash-menu">
    <div
      v-for="(item, index) in items"
      :key="index"
      :class="['command-item', { selected: index === selectedIndex }]"
      @click="emit('select', index)"
    >
      <span class="command-icon">{{ item.icon }}</span>
      <div class="command-content">
        <div class="command-title">{{ item.title }}</div>
        <div class="command-description">{{ item.description }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slash-menu {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: var(--space-2);
  max-height: 300px;
  overflow-y: auto;
  min-width: 280px;
}

.command-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.command-item:hover,
.command-item.selected {
  background: var(--color-bg-hover);
}

.command-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.command-content {
  flex: 1;
  min-width: 0;
}

.command-title {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.command-description {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}
</style>
