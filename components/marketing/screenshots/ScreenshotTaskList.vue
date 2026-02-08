<template>
  <div class="screenshot-task-list">
    <!-- Simplified Header -->
    <div class="task-list-header">
      <div class="header-cell col-task">task</div>
      <div class="header-cell col-status">status</div>
      <div class="header-cell col-assignee">assignee</div>
      <div class="header-cell col-due">due date</div>
    </div>

    <!-- Task Rows - Simplified and Larger -->
    <div class="task-list-body">
      <!-- Task 1 - High Priority -->
      <div class="task-row priority-high">
        <div class="cell col-task">
          <div class="task-title-row">
            <div class="priority-indicator urgent"></div>
            <span class="task-title">Design hero section mockups</span>
          </div>
        </div>
        <div class="cell col-status">
          <StatusLabel status="in_progress" />
        </div>
        <div class="cell col-assignee">
          <div class="assignee">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" class="avatar" />
            <span class="assignee-name">Sarah</span>
          </div>
        </div>
        <div class="cell col-due">
          <span class="due-date urgent">Mar 15</span>
        </div>
      </div>

      <!-- Task 2 - Completed -->
      <div class="task-row completed">
        <div class="cell col-task">
          <div class="task-title-row">
            <div class="priority-indicator medium"></div>
            <span class="task-title">Set up staging environment</span>
          </div>
        </div>
        <div class="cell col-status">
          <StatusLabel status="done" />
        </div>
        <div class="cell col-assignee">
          <div class="assignee">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jake" alt="Jake" class="avatar" />
            <span class="assignee-name">Jake</span>
          </div>
        </div>
        <div class="cell col-due">
          <span class="due-date done">Mar 12</span>
        </div>
      </div>

      <!-- Task 3 -->
      <div class="task-row">
        <div class="cell col-task">
          <div class="task-title-row">
            <div class="priority-indicator high"></div>
            <span class="task-title">Write content for about page</span>
          </div>
        </div>
        <div class="cell col-status">
          <StatusLabel status="todo" />
        </div>
        <div class="cell col-assignee">
          <div class="assignee">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael" alt="Michael" class="avatar" />
            <span class="assignee-name">Michael</span>
          </div>
        </div>
        <div class="cell col-due">
          <span class="due-date">Mar 20</span>
        </div>
      </div>

      <!-- Task 4 -->
      <div class="task-row">
        <div class="cell col-task">
          <div class="task-title-row">
            <div class="priority-indicator high"></div>
            <span class="task-title">Migrate user authentication endpoints</span>
          </div>
        </div>
        <div class="cell col-status">
          <StatusLabel status="in_review" />
        </div>
        <div class="cell col-assignee">
          <div class="assignee">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jake" alt="Jake" class="avatar" />
            <span class="assignee-name">Jake</span>
          </div>
        </div>
        <div class="cell col-due">
          <span class="due-date">Mar 18</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusLabel from '~/components/ui/StatusLabel.vue';
// Static task list screenshot - simplified for hero section
</script>

<style scoped>
.screenshot-task-list {
  width: 100%;
  max-width: 900px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* Header - Simplified and Larger */
.task-list-header {
  display: grid;
  grid-template-columns: 3fr 1.2fr 1.3fr 0.9fr;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-6);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  align-items: center;
}

.header-cell {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  padding: 0;
}

/* Body - More Spacious */
.task-list-body {
  display: flex;
  flex-direction: column;
}

.task-row {
  display: grid;
  grid-template-columns: 3fr 1.2fr 1.3fr 0.9fr;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
  align-items: center;
  min-height: 68px;
}

.task-row:hover {
  background: var(--color-bg-hover);
}

.task-row:last-child {
  border-bottom: none;
}

/* Completed task styling */
.task-row.completed {
  opacity: 0.6;
}

.task-row.completed .task-title {
  text-decoration: line-through;
  color: var(--color-text-secondary);
}

.cell {
  display: flex;
  align-items: center;
  padding: 0;
  height: 100%;
}

/* Task Title - Larger and More Prominent */
.col-task {
  justify-content: flex-start;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.priority-indicator {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.priority-indicator.urgent {
  background: var(--color-priority-urgent);
}

.priority-indicator.high {
  background: var(--color-priority-high);
}

.priority-indicator.medium {
  background: var(--color-priority-medium);
}

.task-title {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.5;
}

/* Status */
.col-status {
  justify-content: flex-start;
}

/* Assignee - Larger Avatar and Text */
.col-assignee {
  justify-content: flex-start;
}

.assignee {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
  overflow: hidden;
}

.assignee-name {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* Due Date - More Prominent */
.col-due {
  justify-content: flex-start;
}

.due-date {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-surface);
}

.due-date.urgent {
  color: var(--color-priority-urgent);
  background: var(--color-bg-surface);
}

.due-date.done {
  text-decoration: line-through;
  opacity: 0.5;
}

/* Mobile - Simplified View */
@media (max-width: 768px) {
  .screenshot-task-list {
    max-width: 100%;
  }

  .task-list-header,
  .task-row {
    grid-template-columns: 2fr 1fr;
    gap: var(--space-3);
    padding: var(--space-4);
  }

  /* Hide assignee and due date on mobile */
  .col-assignee,
  .col-due {
    display: none;
  }

  .task-title {
    font-size: 14px;
  }

  .task-row {
    min-height: 56px;
  }
}

/* Tablet */
@media (max-width: 1024px) and (min-width: 769px) {
  .task-list-header,
  .task-row {
    grid-template-columns: 2.5fr 1.2fr 1.3fr;
    gap: var(--space-4);
  }

  /* Hide due date on tablet */
  .col-due {
    display: none;
  }
}
</style>
