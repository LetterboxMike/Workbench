<script setup lang="ts">
defineProps<{
  placeholder?: string;
  modelValue: string;
  variant?: 'standard' | 'ai';
  type?: 'text' | 'email' | 'password';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
};
</script>

<template>
  <input
    :type="type || 'text'"
    :value="modelValue"
    :placeholder="placeholder"
    class="input-field"
    :class="variant || 'standard'"
    @input="onInput"
  />
</template>

<style scoped>
.input-field {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
}

.input-field::placeholder {
  color: var(--color-text-tertiary);
}

.input-field:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

.input-field.ai {
  border-radius: var(--radius-lg);
  padding: 10px var(--space-3);
}
</style>
