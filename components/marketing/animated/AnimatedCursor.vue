<template>
  <div class="animated-cursor" :style="cursorStyle">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M2 2 L8 18 L11 11 L18 8 Z"
        fill="currentColor"
        stroke="white"
        stroke-width="1"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    x?: number;
    y?: number;
    visible?: boolean;
  }>(),
  {
    x: 0,
    y: 0,
    visible: true
  }
);

const cursorStyle = computed(() => ({
  transform: `translate(${props.x}px, ${props.y}px)`,
  opacity: props.visible ? 1 : 0
}));
</script>

<style scoped>
.animated-cursor {
  position: absolute;
  pointer-events: none;
  color: var(--color-text);
  transition: transform 0.3s ease-out, opacity 0.2s ease;
  z-index: 10;
}

.animated-cursor svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}
</style>
