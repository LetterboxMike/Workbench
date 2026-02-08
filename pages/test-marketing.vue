<template>
  <div class="test-page">
    <h1>Marketing Components Test</h1>

    <section class="test-section">
      <h2>MarketingNav</h2>
      <MarketingNav />
    </section>

    <section class="test-section">
      <h2>Screenshot: Document Editor</h2>
      <ScreenshotDocumentEditor />
    </section>

    <section class="test-section">
      <h2>Screenshot: Task List</h2>
      <ScreenshotTaskList />
    </section>

    <section class="test-section">
      <h2>Screenshot: Kanban</h2>
      <ScreenshotKanbanBoard />
    </section>

    <section class="test-section">
      <h2>Screenshot: Calendar</h2>
      <ScreenshotCalendar />
    </section>

    <section class="test-section">
      <h2>Screenshot: AI Panel</h2>
      <ScreenshotAIPanel />
    </section>

    <section class="test-section">
      <h2>Testimonials</h2>
      <MarketingTestimonials />
    </section>

    <section class="test-section">
      <h2>Footer</h2>
      <MarketingFooter />
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
});

useHead({
  title: 'Marketing Components Test'
});

onMounted(() => {
  console.log('Test page mounted successfully');
});
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--space-8);
  padding-top: calc(var(--topbar-height) + var(--space-8));
}

h1 {
  font-family: var(--font-body);
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-8);
}

.test-section {
  margin-bottom: var(--space-12);
  padding: var(--space-6);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.test-section h2 {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
  text-transform: lowercase;
}
</style>
