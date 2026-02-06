<template>
  <div class="screenshot-task-list">
    <!-- Table Header -->
    <div class="task-list-header">
      <div class="header-cell col-checkbox"></div>
      <div class="header-cell col-task">task</div>
      <div class="header-cell col-status">status</div>
      <div class="header-cell col-priority">priority</div>
      <div class="header-cell col-assignee">assignee</div>
      <div class="header-cell col-due">due date</div>
      <div class="header-cell col-source">source</div>
    </div>

    <!-- Task Rows -->
    <div class="task-list-body">
      <!-- Task 1 -->
      <div class="task-row">
        <div class="cell col-checkbox">
          <input type="checkbox" class="task-checkbox" />
        </div>
        <div class="cell col-task">
          <div class="task-title-row">
            <PriorityDot priority="urgent" />
            <span class="task-title">Design hero section mockups</span>
          </div>
        </div>
        <div class="cell col-status">
          <StatusLabel status="in_progress" />
        </div>
        <div class="cell col-priority">
          <span class="priority-text">urgent</span>
        </div>
        <div class="cell col-assignee">
          <div class="assignee">
            <div class="avatar">S</div>
            <span>Sarah</span>
          </div>
        </div>
        <div class="cell col-due">
          <span class="due-date urgent">Mar 15</span>
        </div>
        <div class="cell col-source">
          <span class="source-doc">Website Redesign</span>
        </div>
      </div>

      <!-- Task 2 -->
      <div class="task-row">
        <div class="cell col-checkbox">
          <input type="checkbox" class="task-checkbox" checked />
        </div>
        <div class="cell col-task">
          <div class="task-title-row">
            <PriorityDot priority="medium" />
            <span class="task-title completed">Set up staging environment</span>
          </div>
        </div>
        <div class="cell col-status">
          <StatusLabel status="done" />
        </div>
        <div class="cell col-priority">
          <span class="priority-text">medium</span>
        </div>
        <div class="cell col-assignee">
          <div class="assignee">
            <div class="avatar">J</div>
            <span>Jake</span>
          </div>
        </div>
        <div class="cell col-due">
          <span class="due-date done">Mar 12</span>
        </div>
        <div class="cell col-source">
          <span class="source-doc">API v2 Migration</span>
        </div>
      </div>

      <!-- Task 3 -->
      <div class="task-row">
        <div class="cell col-checkbox">
          <input type="checkbox" class="task-checkbox" />
        </div>
        <div class="cell col-task">
          <div class="task-title-row">
            <PriorityDot priority="high" />
            <span class="task-title">Write content for about page</span>
          </div>
        </div>
        <div class="cell col-status">
          <StatusLabel status="todo" />
        </div>
        <div class="cell col-priority">
          <span class="priority-text">high</span>
        </div>
        <div class="cell col-assignee">
          <div class="assignee">
            <div class="avatar">M</div>
            <span>Michael</span>
          </div>
        </div>
        <div class="cell col-due">
          <span class="due-date">Mar 20</span>
        </div>
        <div class="cell col-source">
          <span class="source-doc">Website Redesign</span>
        </div>
      </div>

      <!-- Task 4 -->
      <div class="task-row">
        <div class="cell col-checkbox">
          <input type="checkbox" class="task-checkbox" />
        </div>
        <div class="cell col-task">
          <div class="task-title-row">
            <PriorityDot priority="high" />
            <span class="task-title">Migrate user authentication endpoints</span>
          </div>
        </div>
        <div class="cell col-status">
          <StatusLabel status="in_review" />
        </div>
        <div class="cell col-priority">
          <span class="priority-text">high</span>
        </div>
        <div class="cell col-assignee">
          <div class="assignee">
            <div class="avatar">J</div>
            <span>Jake</span>
          </div>
        </div>
        <div class="cell col-due">
          <span class="due-date">Mar 18</span>
        </div>
        <div class="cell col-source">
          <span class="source-doc">API v2 Migration</span>
        </div>
      </div>

      <!-- Task 5 -->
      <div class="task-row">
        <div class="cell col-checkbox">
          <input type="checkbox" class="task-checkbox" />
        </div>
        <div class="cell col-task">
          <div class="task-title-row">
            <PriorityDot priority="medium" />
            <span class="task-title">Conduct user testing sessions</span>
          </div>
        </div>
        <div class="cell col-status">
          <StatusLabel status="backlog" />
        </div>
        <div class="cell col-priority">
          <span class="priority-text">medium</span>
        </div>
        <div class="cell col-assignee">
          <div class="assignee">
            <div class="avatar">S</div>
            <span>Sarah</span>
          </div>
        </div>
        <div class="cell col-due">
          <span class="due-date">Mar 25</span>
        </div>
        <div class="cell col-source">
          <span class="source-doc">Product Brief</span>
        </div>
      </div>

      <!-- Task 6 -->
      <div class="task-row">
        <div class="cell col-checkbox">
          <input type="checkbox" class="task-checkbox" />
        </div>
        <div class="cell col-task">
          <div class="task-title-row">
            <PriorityDot priority="low" />
            <span class="task-title">Update documentation for v2 API</span>
          </div>
        </div>
        <div class="cell col-status">
          <StatusLabel status="todo" />
        </div>
        <div class="cell col-priority">
          <span class="priority-text">low</span>
        </div>
        <div class="cell col-assignee">
          <div class="assignee">
            <div class="avatar">M</div>
            <span>Michael</span>
          </div>
        </div>
        <div class="cell col-due">
          <span class="due-date">Mar 22</span>
        </div>
        <div class="cell col-source">
          <span class="source-doc">API v2 Migration</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// This is a static screenshot component showing the task list view
</script>

<style scoped>
.screenshot-task-list {
  width: 100%;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

/* Header */
.task-list-header {
  display: grid;
  grid-template-columns: 40px 2fr 120px 100px 120px 100px 140px;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-cell {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 300;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
  letter-spacing: 0.06em;
}

/* Body */
.task-list-body {
  display: flex;
  flex-direction: column;
}

.task-row {
  display: grid;
  grid-template-columns: 40px 2fr 120px 100px 120px 100px 140px;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
  align-items: center;
}

.task-row:hover {
  background: var(--color-bg-hover);
}

.task-row:last-child {
  border-bottom: none;
}

.cell {
  display: flex;
  align-items: center;
}

/* Checkbox */
.col-checkbox {
  justify-content: center;
}

.task-checkbox {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-xs);
  border: 1.5px solid var(--color-text-secondary);
  cursor: pointer;
}

.task-checkbox:checked {
  background: var(--color-text-tertiary);
  border-color: var(--color-text-tertiary);
}

/* Task Title */
.task-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.task-title {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.task-title.completed {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}

/* Priority Text */
.priority-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: lowercase;
}

/* Assignee */
.assignee {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--color-bg-active);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text);
}

/* Due Date */
.due-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.due-date.urgent {
  color: var(--color-text);
  font-weight: 500;
}

.due-date.done {
  text-decoration: line-through;
}

/* Source */
.source-doc {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* Mobile - simplified view */
@media (max-width: 768px) {
  .task-list-header,
  .task-row {
    grid-template-columns: 40px 1fr 80px;
    gap: var(--space-2);
  }

  /* Hide some columns on mobile */
  .col-priority,
  .col-assignee,
  .col-due,
  .col-source {
    display: none;
  }

  .task-title {
    font-size: 12px;
  }
}
</style>
