<script setup lang="ts">
defineProps<{
  label: string;
  linkText?: string;
}>();

const emit = defineEmits<{
  linkClick: [];
}>();
</script>

<template>
  <div class="section-header">
    <span class="label">{{ label }}</span>
    <button
      v-if="linkText"
      type="button"
      class="link"
      @click="emit('linkClick')"
    >
      {{ linkText }} →
    </button>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 300;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
}

.link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  opacity: 0.5;
  background: transparent;
  border: none;
  padding: 0 var(--space-2);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.link:hover {
  opacity: 0.8;
}
</style>
