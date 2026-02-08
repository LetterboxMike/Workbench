<template>
  <div class="screenshot-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <button class="toolbar-btn" title="Bold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>
        <button class="toolbar-btn" title="Italic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </button>
        <button class="toolbar-btn" title="Link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
      </div>
      <div class="toolbar-divider"></div>
      <div class="toolbar-group">
        <button class="toolbar-btn" title="Heading 1">H1</button>
        <button class="toolbar-btn" title="Heading 2">H2</button>
        <button class="toolbar-btn" title="Bullet list">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="3" cy="6" r="1" fill="currentColor" />
            <circle cx="3" cy="12" r="1" fill="currentColor" />
            <circle cx="3" cy="18" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div class="autosave-status">
        <span class="save-dot"></span>
        saved 2s ago
      </div>
    </div>

    <!-- Editor Content -->
    <div class="editor-content-area">
      <div class="editor-inner">
        <!-- Document Title -->
        <h1 class="doc-title">Website Redesign</h1>

        <!-- Paragraph -->
        <p class="editor-p">
          The current website needs a complete overhaul to match our new brand identity. Primary goals are improved conversion rates and mobile experience.
        </p>

        <!-- Heading -->
        <h2 class="editor-h2">Sprint 1 Objectives</h2>

        <!-- Bullet list -->
        <ul class="editor-list">
          <li>Wireframe homepage and product pages</li>
          <li>Design mobile-first responsive layouts</li>
          <li>Conduct user testing with 5 participants</li>
        </ul>

        <!-- Task pills (inline tasks) -->
        <div class="task-section">
          <div class="task-pill">
            <input type="checkbox" class="task-checkbox" />
            <span class="task-text">Design hero section mockups</span>
            <span class="task-meta">
              <PriorityDot priority="high" />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" class="task-avatar" />
              <span class="task-assignee">Sarah</span>
              <span class="task-due">Due Mar 15</span>
            </span>
          </div>

          <div class="task-pill">
            <input type="checkbox" class="task-checkbox" checked />
            <span class="task-text completed">Set up staging environment</span>
            <span class="task-meta">
              <PriorityDot priority="medium" />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jake" alt="Jake" class="task-avatar" />
              <span class="task-assignee">Jake</span>
            </span>
          </div>

          <div class="task-pill">
            <input type="checkbox" class="task-checkbox" />
            <span class="task-text">Write content for about page</span>
            <span class="task-meta">
              <PriorityDot priority="low" />
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael" alt="Michael" class="task-avatar" />
              <span class="task-assignee">Michael</span>
              <span class="task-due">Due Mar 20</span>
            </span>
          </div>
        </div>

        <!-- Slash command menu (animated appearance) -->
        <div v-if="showSlashMenu" class="slash-command-menu">
          <div class="slash-search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search commands..." class="slash-input" />
          </div>
          <div class="slash-commands">
            <div class="slash-item active">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6H9z" />
              </svg>
              <div class="slash-item-content">
                <div class="slash-item-title">task</div>
                <div class="slash-item-desc">Create an inline task</div>
              </div>
            </div>
            <div class="slash-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16v16H4z" />
              </svg>
              <div class="slash-item-content">
                <div class="slash-item-title">table</div>
                <div class="slash-item-desc">Insert a table</div>
              </div>
            </div>
            <div class="slash-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <div class="slash-item-content">
                <div class="slash-item-title">image</div>
                <div class="slash-item-desc">Upload an image</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Placeholder cursor (for typing animation) -->
        <span v-if="showCursor" class="typing-cursor">|</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const showSlashMenu = ref(false);
const showCursor = ref(false);

// Static screenshot - no animations
</script>

<style scoped>
.screenshot-editor {
  width: 100%;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

/* Toolbar */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.toolbar-btn {
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
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toolbar-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
}

.autosave-status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

.save-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-text-tertiary);
}

/* Editor Content */
.editor-content-area {
  padding: var(--space-8) var(--space-6);
  min-height: 400px;
  max-height: 500px;
  overflow-y: auto;
}

.editor-inner {
  max-width: 720px;
  margin: 0 auto;
}

.doc-title {
  font-family: var(--font-body);
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-text);
  margin: 0 0 var(--space-6);
}

.editor-h2 {
  font-family: var(--font-body);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-text);
  margin: var(--space-6) 0 var(--space-4);
}

.editor-p {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-4);
}

.editor-list {
  list-style: disc;
  padding-left: var(--space-6);
  margin: var(--space-4) 0;
}

.editor-list li {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

/* Task Pills */
.task-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: var(--space-6) 0;
}

.task-pill {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.task-pill:hover {
  background: var(--color-bg-hover);
}

.task-checkbox {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-xs);
  border: 1.5px solid var(--color-text-secondary);
  flex-shrink: 0;
  cursor: pointer;
}

.task-checkbox:checked {
  background: var(--color-text-tertiary);
  border-color: var(--color-text-tertiary);
}

.task-text {
  flex: 1;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.task-text.completed {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}

.task-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.task-avatar {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.task-assignee {
  color: var(--color-text-secondary);
}

.task-due {
  color: var(--color-text-tertiary);
}

/* Slash Command Menu */
.slash-command-menu {
  position: relative;
  width: 320px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: var(--space-2);
  animation: slideIn 0.15s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slash-search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.slash-search svg {
  color: var(--color-text-tertiary);
}

.slash-input {
  flex: 1;
  background: transparent;
  border: none;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text);
  outline: none;
}

.slash-input::placeholder {
  color: var(--color-text-tertiary);
}

.slash-commands {
  padding: var(--space-2);
}

.slash-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.slash-item:hover,
.slash-item.active {
  background: var(--color-bg-hover);
}

.slash-item svg {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.slash-item-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slash-item-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
}

.slash-item-desc {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
  opacity: 0.6;
}

/* Typing Cursor */
.typing-cursor {
  display: inline-block;
  color: var(--color-text);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

/* Mobile */
@media (max-width: 768px) {
  .editor-content-area {
    padding: var(--space-6) var(--space-4);
  }

  .doc-title {
    font-size: 24px;
  }

  .editor-h2 {
    font-size: 18px;
  }
}
</style>
