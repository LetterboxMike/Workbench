<template>
  <div ref="slideshowRef" class="screenshot-slideshow">
    <div
      v-for="(screenshot, index) in screenshots"
      :key="index"
      class="slide"
      :class="{ active: index === currentIndex, animating: index === currentIndex }"
      :data-slide-index="index"
    >
      <component :is="screenshot" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import ScreenshotDocumentEditor from '~/components/marketing/screenshots/ScreenshotDocumentEditor.vue';
import ScreenshotTaskList from '~/components/marketing/screenshots/ScreenshotTaskList.vue';
import ScreenshotKanbanBoard from '~/components/marketing/screenshots/ScreenshotKanbanBoard.vue';
import ScreenshotCalendar from '~/components/marketing/screenshots/ScreenshotCalendar.vue';
import ScreenshotAIPanel from '~/components/marketing/screenshots/ScreenshotAIPanel.vue';

const screenshots = [
  ScreenshotDocumentEditor,
  ScreenshotTaskList,
  ScreenshotKanbanBoard,
  ScreenshotCalendar,
  ScreenshotAIPanel,
  ScreenshotDocumentEditor, // Repeat some to show variety
  ScreenshotTaskList
];

const currentIndex = ref(0);
const slideshowRef = ref<HTMLElement | null>(null);
let intervalId: NodeJS.Timeout | null = null;

// Animate component assembly when slide becomes active
const animateSlideAssembly = (slideIndex: number) => {
  if (!slideshowRef.value) return;

  const slide = slideshowRef.value.querySelector(`[data-slide-index="${slideIndex}"]`) as HTMLElement;
  if (!slide) return;

  // Find all child elements to animate
  const container = slide.querySelector('.screenshot-editor, .screenshot-task-list, .screenshot-kanban, .screenshot-calendar, .screenshot-ai-panel');
  if (!container) return;

  // Get different types of elements to animate
  const background = container as HTMLElement; // The container itself is the background
  const toolbar = container.querySelector('.editor-toolbar, .task-list-header, .kanban-columns, .calendar-header, .day-headers, .ai-header');
  const cards = container.querySelectorAll('.task-pill, .kanban-card, .task-row, .message-bubble, .day-card, .event-card, .unscheduled-card');
  const buttons = container.querySelectorAll('button, .quick-action-chip');
  const mainContent = container.querySelector('.editor-content-area, .kanban-column, .messages-container, .calendar-grid, .unscheduled-section'); // Removed .task-list-body so rows can animate individually

  // Reset background - slide in from right
  background.style.opacity = '0';
  background.style.transform = 'translateX(100%)';

  // Reset all other elements - start from off-screen positions
  if (toolbar) {
    (toolbar as HTMLElement).style.opacity = '0';
    (toolbar as HTMLElement).style.transform = 'translateY(-150%) scale(0.8)';
  }

  if (mainContent) {
    (mainContent as HTMLElement).style.opacity = '0';
    (mainContent as HTMLElement).style.transform = 'translateX(-120%) scale(0.7)';
  }

  cards.forEach((card) => {
    (card as HTMLElement).style.opacity = '0';
    (card as HTMLElement).style.transform = 'translateY(-200%) rotate(-15deg) scale(0.6)';
  });

  buttons.forEach((button) => {
    (button as HTMLElement).style.opacity = '0';
    (button as HTMLElement).style.transform = 'translateX(150%) rotate(10deg) scale(0.5)';
  });

  // Animate background first (slide from right)
  setTimeout(() => {
    background.style.transition = 'all 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)';
    background.style.opacity = '1';
    background.style.transform = 'translateX(0)';
  }, 100);

  // Animate toolbar (drop from top)
  if (toolbar) {
    setTimeout(() => {
      (toolbar as HTMLElement).style.transition = 'all 0.7s cubic-bezier(0.34, 1.4, 0.64, 1)';
      (toolbar as HTMLElement).style.opacity = '1';
      (toolbar as HTMLElement).style.transform = 'translateY(0) scale(1)';
    }, 300);
  }

  // Animate main content (slide from left)
  if (mainContent) {
    setTimeout(() => {
      (mainContent as HTMLElement).style.transition = 'all 0.8s cubic-bezier(0.34, 1.3, 0.64, 1)';
      (mainContent as HTMLElement).style.opacity = '1';
      (mainContent as HTMLElement).style.transform = 'translateX(0) scale(1)';
    }, 500);
  }

  // Animate cards with staggered timing (fall/drop from top)
  cards.forEach((card, i) => {
    const staggerDelay = 400 + (i * 60); // Visible cascade - 60ms between each card
    const randomRotate = (Math.random() - 0.5) * 20; // More dramatic rotation variation

    setTimeout(() => {
      (card as HTMLElement).style.transition = 'all 0.5s cubic-bezier(0.34, 1.5, 0.64, 1)'; // Bouncy animation
      (card as HTMLElement).style.opacity = '1';
      (card as HTMLElement).style.transform = 'translateY(0) rotate(0) scale(1)';
    }, staggerDelay);
  });

  // Animate buttons (slap in from right)
  buttons.forEach((button, i) => {
    setTimeout(() => {
      (button as HTMLElement).style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      (button as HTMLElement).style.opacity = '1';
      (button as HTMLElement).style.transform = 'translateX(0) rotate(0) scale(1)';
    }, 900 + (i * 100));
  });
};

// Watch for currentIndex changes to trigger assembly animation
watch(currentIndex, (newIndex) => {
  setTimeout(() => {
    animateSlideAssembly(newIndex);
  }, 100); // Small delay to let opacity transition start
});

onMounted(() => {
  // Animate initial slide
  setTimeout(() => {
    animateSlideAssembly(0);
  }, 200);

  // Change screenshot every 8 seconds
  intervalId = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % screenshots.length;
  }, 8000);

  // Add scroll-based parallax tilt
  const handleScroll = () => {
    if (!slideshowRef.value) return;

    const rect = slideshowRef.value.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate how far the element is from the center of viewport
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    const distanceFromCenter = elementCenter - viewportCenter;

    // Convert distance to rotation values (-10 to 10 degrees)
    const maxRotation = 8;
    const rotateX = Math.max(-maxRotation, Math.min(maxRotation, (distanceFromCenter / windowHeight) * maxRotation * 2));
    const rotateY = Math.max(-maxRotation, Math.min(maxRotation, (distanceFromCenter / windowHeight) * maxRotation * -1));

    slideshowRef.value.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial call

  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<style>
/* Theme inversion: Show light mode screenshots on dark site, dark screenshots on light site */
/* When page is in dark mode, show light mode screenshots */
html[data-theme="dark"] .screenshot-slideshow,
html[data-theme="dark"] .screenshot-slideshow *,
[data-theme="dark"] .screenshot-slideshow,
[data-theme="dark"] .screenshot-slideshow * {
  --color-bg: #f4f4f4 !important;
  --color-bg-elevated: #f4f4f4 !important;
  --color-bg-surface: #fafafa !important;
  --color-bg-hover: #eeeeee !important;
  --color-border: #e0e0e0 !important;
  --color-text: #1c1c1c !important;
  --color-text-secondary: #666666 !important;
  --color-text-tertiary: #999999 !important;
}

/* When page is in light mode, show dark mode screenshots */
html[data-theme="light"] .screenshot-slideshow,
html[data-theme="light"] .screenshot-slideshow *,
[data-theme="light"] .screenshot-slideshow,
[data-theme="light"] .screenshot-slideshow * {
  --color-bg: #1c1c1c !important;
  --color-bg-elevated: #242424 !important;
  --color-bg-surface: #2a2a2a !important;
  --color-bg-hover: #333333 !important;
  --color-border: #404040 !important;
  --color-text: #f4f4f4 !important;
  --color-text-secondary: #b0b0b0 !important;
  --color-text-tertiary: #808080 !important;
}
</style>

<style scoped>
.screenshot-slideshow {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  transform-style: preserve-3d;
  transition: transform 0.15s ease-out;
  will-change: transform;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
  pointer-events: none;
  transform-style: preserve-3d;
}

.slide.active {
  opacity: 1;
  pointer-events: auto;
}
</style>
