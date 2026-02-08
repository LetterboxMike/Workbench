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
      <div class="day-box prev-month">
        <div class="day-card">
          <span class="day-number">28</span>
        </div>
      </div>
      <div class="day-box prev-month">
        <div class="day-card">
          <span class="day-number">29</span>
        </div>
      </div>
      <div class="day-box prev-month">
        <div class="day-card">
          <span class="day-number">30</span>
        </div>
      </div>
      <div class="day-box prev-month">
        <div class="day-card">
          <span class="day-number">31</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">1</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">2</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">3</span>
        </div>
      </div>

      <!-- Week 2 -->
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">4</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">5</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">6</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">7</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">8</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">9</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">10</span>
        </div>
      </div>

      <!-- Week 3 -->
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">11</span>
        </div>
      </div>
      <div class="day-box has-events">
        <div class="day-card">
          <span class="day-number">12</span>
        </div>
        <div class="event-card completed">
          <PriorityDot priority="medium" />
          <span class="event-title">Set up staging</span>
        </div>
      </div>
      <div class="day-box is-today">
        <div class="day-card today">
          <span class="day-number-today">13</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">14</span>
        </div>
      </div>
      <div class="day-box has-events">
        <div class="day-card">
          <span class="day-number">15</span>
        </div>
        <div class="event-card urgent">
          <PriorityDot priority="urgent" />
          <span class="event-title">Hero mockups</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">16</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">17</span>
        </div>
      </div>

      <!-- Week 4 -->
      <div class="day-box has-events">
        <div class="day-card">
          <span class="day-number">18</span>
        </div>
        <div class="event-card">
          <PriorityDot priority="high" />
          <span class="event-title">Auth endpoints</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">19</span>
        </div>
      </div>
      <div class="day-box has-events">
        <div class="day-card">
          <span class="day-number">20</span>
        </div>
        <div class="event-card">
          <PriorityDot priority="high" />
          <span class="event-title">About content</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">21</span>
        </div>
      </div>
      <div class="day-box has-events">
        <div class="day-card">
          <span class="day-number">22</span>
        </div>
        <div class="event-card">
          <PriorityDot priority="low" />
          <span class="event-title">Update docs</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">23</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">24</span>
        </div>
      </div>

      <!-- Week 5 -->
      <div class="day-box has-events">
        <div class="day-card">
          <span class="day-number">25</span>
        </div>
        <div class="event-card">
          <PriorityDot priority="medium" />
          <span class="event-title">User testing</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">26</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">27</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">28</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">29</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">30</span>
        </div>
      </div>
      <div class="day-box">
        <div class="day-card">
          <span class="day-number">31</span>
        </div>
      </div>
    </div>

    <!-- Unscheduled Tasks -->
    <div class="unscheduled-section">
      <div class="unscheduled-header">unscheduled</div>
      <div class="unscheduled-tasks">
        <div class="unscheduled-card">
          <PriorityDot priority="medium" />
          <span class="unscheduled-title">Conduct user testing</span>
        </div>
        <div class="unscheduled-card">
          <PriorityDot priority="low" />
          <span class="unscheduled-title">Update API docs</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PriorityDot from '~/components/ui/PriorityDot.vue';
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
  gap: var(--space-2);
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

/* Calendar Grid - Consistent sizing with square cells */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-bg);
}

/* Day Box - Container for day card and events */
.day-box {
  position: relative;
  aspect-ratio: 1; /* Force square shape */
  cursor: pointer;
}

.day-box.prev-month {
  opacity: 0.3;
}

/* Day Card - Full square layered component */
.day-card {
  position: absolute;
  inset: 0; /* Fill entire day box */
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: var(--space-2);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.day-box:hover .day-card {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.day-card.today {
  background: var(--color-text);
  border-color: var(--color-text);
}

/* Today indicator as badge */
.day-card.today .day-number-today {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-bg);
  color: var(--color-text);
}

.day-number {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.day-number-today {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-bg);
}

/* Event Card - Layered on top of day card */
.event-card {
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-2);
  right: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  z-index: 10; /* Above day card */
}

.event-card:hover {
  background: var(--color-bg-active);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.event-card.urgent {
  border-color: var(--color-text-secondary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.event-card.completed {
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

.event-card.completed .event-title {
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

/* Unscheduled Card - Layered component */
.unscheduled-card {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: grab;
  transition: all var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.unscheduled-card:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
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
    gap: var(--space-1);
    padding: var(--space-2);
  }

  .day-card {
    padding: var(--space-1);
  }

  .day-number,
  .day-number-today {
    font-size: 11px;
  }

  .event-card {
    padding: var(--space-1) var(--space-2);
    font-size: 9px;
  }

  .event-title {
    font-size: 9px;
  }
}
</style>
