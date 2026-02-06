<script setup lang="ts">
defineProps<{
  label: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button type="button" class="ghost-button" @click="emit('click')">
    {{ label }} →
  </button>
</template>

<style scoped>
.ghost-button {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  opacity: 0.5;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.ghost-button:hover {
  opacity: 0.8;
}
</style>
