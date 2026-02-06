<template>
  <div class="screenshot-calendar">
    <!-- Calendar Header -->
    <div class="calendar-header">
      <div class="month-nav">
        <button class="nav-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span class="month-label">March 2026</span>
        <button class="nav-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <button class="today-btn">today</button>
    </div>

    <!-- Day Headers -->
    <div class="day-headers">
      <div class="day-header">sun</div>
      <div class="day-header">mon</div>
      <div class="day-header">tue</div>
      <div class="day-header">wed</div>
      <div class="day-header">thu</div>
      <div class="day-header">fri</div>
      <div class="day-header">sat</div>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid">
      <!-- Week 1 -->
      <div class="calendar-cell prev-month">
        <span class="date-number">28</span>
      </div>
      <div class="calendar-cell prev-month">
        <span class="date-number">29</span>
      </div>
      <div class="calendar-cell prev-month">
        <span class="date-number">30</span>
      </div>
      <div class="calendar-cell prev-month">
        <span class="date-number">31</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">1</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">2</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">3</span>
      </div>

      <!-- Week 2 -->
      <div class="calendar-cell">
        <span class="date-number">4</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">5</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">6</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">7</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">8</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">9</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">10</span>
      </div>

      <!-- Week 3 -->
      <div class="calendar-cell">
        <span class="date-number">11</span>
      </div>
      <div class="calendar-cell has-event">
        <span class="date-number">12</span>
        <div class="event-chip completed">
          <PriorityDot priority="medium" />
          <span class="event-title">Set up staging</span>
        </div>
      </div>
      <div class="calendar-cell today">
        <span class="date-number-today">13</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">14</span>
      </div>
      <div class="calendar-cell has-event">
        <span class="date-number">15</span>
        <div class="event-chip urgent">
          <PriorityDot priority="urgent" />
          <span class="event-title">Hero mockups</span>
        </div>
      </div>
      <div class="calendar-cell">
        <span class="date-number">16</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">17</span>
      </div>

      <!-- Week 4 -->
      <div class="calendar-cell has-event">
        <span class="date-number">18</span>
        <div class="event-chip">
          <PriorityDot priority="high" />
          <span class="event-title">Auth endpoints</span>
        </div>
      </div>
      <div class="calendar-cell">
        <span class="date-number">19</span>
      </div>
      <div class="calendar-cell has-event">
        <span class="date-number">20</span>
        <div class="event-chip">
          <PriorityDot priority="high" />
          <span class="event-title">About content</span>
        </div>
      </div>
      <div class="calendar-cell">
        <span class="date-number">21</span>
      </div>
      <div class="calendar-cell has-event">
        <span class="date-number">22</span>
        <div class="event-chip">
          <PriorityDot priority="low" />
          <span class="event-title">Update docs</span>
        </div>
      </div>
      <div class="calendar-cell">
        <span class="date-number">23</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">24</span>
      </div>

      <!-- Week 5 -->
      <div class="calendar-cell has-event">
        <span class="date-number">25</span>
        <div class="event-chip">
          <PriorityDot priority="medium" />
          <span class="event-title">User testing</span>
        </div>
      </div>
      <div class="calendar-cell">
        <span class="date-number">26</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">27</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">28</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">29</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">30</span>
      </div>
      <div class="calendar-cell">
        <span class="date-number">31</span>
      </div>
    </div>

    <!-- Unscheduled Tasks -->
    <div class="unscheduled-section">
      <div class="unscheduled-header">unscheduled</div>
      <div class="unscheduled-tasks">
        <div class="unscheduled-chip">
          <PriorityDot priority="medium" />
          <span class="unscheduled-title">Conduct user testing</span>
        </div>
        <div class="unscheduled-chip">
          <PriorityDot priority="low" />
          <span class="unscheduled-title">Update API docs</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Static calendar screenshot
</script>

<style scoped>
.screenshot-calendar {
  width: 100%;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

/* Calendar Header */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
}

.month-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.month-label {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  min-width: 120px;
  text-align: center;
}

.today-btn {
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-transform: lowercase;
}

.today-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

/* Day Headers */
.day-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
}

.day-header {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 300;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
  letter-spacing: 0.08em;
  text-align: center;
}

/* Calendar Grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--color-border);
  padding: 1px;
}

.calendar-cell {
  position: relative;
  min-height: 80px;
  padding: var(--space-2);
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.calendar-cell:hover {
  background: var(--color-bg-hover);
}

.calendar-cell.prev-month {
  opacity: 0.3;
}

.calendar-cell.today {
  background: var(--color-bg-surface);
}

.date-number {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.date-number-today {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-text);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-bg);
}

.calendar-cell.has-event {
  background: var(--color-bg-surface);
}

/* Event Chip */
.event-chip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px var(--space-2);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.event-chip:hover {
  background: var(--color-bg-active);
  transform: scale(1.02);
}

.event-chip.urgent {
  border: 1px solid var(--color-priority-urgent);
}

.event-chip.completed {
  opacity: 0.6;
}

.event-title {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-chip.completed .event-title {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}

/* Unscheduled Section */
.unscheduled-section {
  padding: var(--space-4);
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border);
}

.unscheduled-header {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 300;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-3);
}

.unscheduled-tasks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.unscheduled-chip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: grab;
  transition: all var(--transition-fast);
}

.unscheduled-chip:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
}

.unscheduled-title {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
}

/* Mobile */
@media (max-width: 768px) {
  .calendar-grid {
    grid-template-columns: repeat(7, 1fr);
  }

  .calendar-cell {
    min-height: 60px;
    padding: var(--space-1);
  }

  .date-number {
    font-size: 10px;
  }

  .event-chip {
    padding: 2px var(--space-1);
  }

  .event-title {
    font-size: 9px;
  }

  .date-number-today {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
}
</style>
