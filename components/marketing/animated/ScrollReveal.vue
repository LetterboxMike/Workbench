<template>
  <div ref="target" :class="['scroll-reveal', { 'is-visible': isVisible }]">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
    delay?: number;
  }>(),
  {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
    triggerOnce: true,
    delay: 0
  }
);

const target = ref<HTMLElement | null>(null);
const isVisible = ref(false);

onMounted(() => {
  if (!target.value) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            isVisible.value = true;
          }, props.delay);

          if (props.triggerOnce) {
            observer.disconnect();
          }
        } else if (!props.triggerOnce) {
          isVisible.value = false;
        }
      });
    },
    {
      threshold: props.threshold,
      rootMargin: props.rootMargin
    }
  );

  observer.observe(target.value);

  onUnmounted(() => {
    observer.disconnect();
  });
});
</script>

<style scoped>
.scroll-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
