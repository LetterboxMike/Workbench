<script setup lang="ts">
</script>

<template>
  <div class="table-header">
    <div class="header-cell" />
    <div class="header-cell">task</div>
    <div class="header-cell">status</div>
    <div class="header-cell">priority</div>
    <div class="header-cell">assignee</div>
    <div class="header-cell">due</div>
    <div class="header-cell">source</div>
  </div>
</template>

<style scoped>
.table-header {
  display: grid;
  grid-template-columns: 24px 1fr 100px 80px 100px 80px 120px;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.header-cell {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
}
</style>
