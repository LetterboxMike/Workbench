<template>
  <div class="screenshot-kanban">
    <!-- Kanban Columns -->
    <div class="kanban-columns">
      <!-- Backlog Column -->
      <div class="kanban-column">
        <div class="column-header">
          <span class="column-title">backlog</span>
          <span class="column-count">2</span>
        </div>
        <div class="column-body">
          <div class="kanban-card">
            <div class="card-title">Conduct user testing sessions</div>
            <div class="card-meta">
              <div class="card-meta-left">
                <PriorityDot priority="medium" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" class="card-avatar" />
                <span class="card-assignee">Sarah</span>
              </div>
              <span class="card-due">Mar 25</span>
            </div>
          </div>

          <div class="kanban-card">
            <div class="card-title">Update documentation for v2 API</div>
            <div class="card-meta">
              <div class="card-meta-left">
                <PriorityDot priority="low" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael" alt="Michael" class="card-avatar" />
                <span class="card-assignee">Michael</span>
              </div>
              <span class="card-due">Mar 22</span>
            </div>
          </div>

          <button class="add-card-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            add
          </button>
        </div>
      </div>

      <!-- To Do Column -->
      <div class="kanban-column">
        <div class="column-header">
          <span class="column-title">to do</span>
          <span class="column-count">1</span>
        </div>
        <div class="column-body">
          <div class="kanban-card">
            <div class="card-title">Write content for about page</div>
            <div class="card-meta">
              <div class="card-meta-left">
                <PriorityDot priority="high" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael" alt="Michael" class="card-avatar" />
                <span class="card-assignee">Michael</span>
              </div>
              <span class="card-due">Mar 20</span>
            </div>
          </div>

          <button class="add-card-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            add
          </button>
        </div>
      </div>

      <!-- In Progress Column -->
      <div class="kanban-column">
        <div class="column-header">
          <span class="column-title">in progress</span>
          <span class="column-count">2</span>
        </div>
        <div class="column-body">
          <div class="kanban-card highlighted">
            <div class="card-title">Design hero section mockups</div>
            <div class="card-meta">
              <div class="card-meta-left">
                <PriorityDot priority="urgent" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" class="card-avatar" />
                <span class="card-assignee">Sarah</span>
              </div>
              <span class="card-due urgent">Mar 15</span>
            </div>
          </div>

          <div class="kanban-card">
            <div class="card-title">Migrate user authentication endpoints</div>
            <div class="card-meta">
              <div class="card-meta-left">
                <PriorityDot priority="high" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jake" alt="Jake" class="card-avatar" />
                <span class="card-assignee">Jake</span>
              </div>
              <span class="card-due">Mar 18</span>
            </div>
          </div>

          <button class="add-card-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            add
          </button>
        </div>
      </div>

      <!-- Done Column -->
      <div class="kanban-column">
        <div class="column-header">
          <span class="column-title">done</span>
          <span class="column-count">1</span>
        </div>
        <div class="column-body">
          <div class="kanban-card completed">
            <div class="card-title">Set up staging environment</div>
            <div class="card-meta">
              <div class="card-meta-left">
                <PriorityDot priority="medium" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jake" alt="Jake" class="card-avatar" />
                <span class="card-assignee">Jake</span>
              </div>
              <span class="card-due">Mar 12</span>
            </div>
          </div>

          <button class="add-card-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PriorityDot from '~/components/ui/PriorityDot.vue';
// Static kanban board screenshot
</script>

<style scoped>
.screenshot-kanban {
  width: 100%;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: var(--space-4);
}

.kanban-columns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  min-height: 400px;
}

/* Column */
.kanban-column {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-surface);
  border-radius: var(--radius-md);
  min-width: 200px;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.column-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: lowercase;
}

.column-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--space-2);
  background: var(--color-bg-hover);
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
}

.column-body {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1;
}

/* Kanban Card */
.kanban-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  cursor: grab;
  transition: all var(--transition-fast);
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.kanban-card.highlighted {
  border-color: var(--color-text-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.kanban-card.completed {
  opacity: 0.6;
}

.card-title {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.kanban-card.completed .card-title {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.card-meta-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.card-avatar {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.card-assignee {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.card-due {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.card-due.urgent {
  color: var(--color-text);
  font-weight: 500;
}

/* Add Card Button */
.add-card-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3);
  background: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.add-card-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  color: var(--color-text-secondary);
}

.add-card-btn svg {
  color: currentColor;
}

/* Mobile - Stack columns */
@media (max-width: 768px) {
  .kanban-columns {
    grid-template-columns: 1fr;
  }

  .kanban-column {
    min-width: unset;
  }
}
</style>
