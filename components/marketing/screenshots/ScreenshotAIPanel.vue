<template>
  <div class="screenshot-ai-panel">
    <!-- AI Panel Header -->
    <div class="ai-panel-header">
      <div class="header-left">
        <svg class="sparkle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
          <circle cx="18" cy="6" r="2" opacity="0.3" />
        </svg>
        <span class="header-title">ai assistant</span>
      </div>
      <button class="close-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Messages -->
    <div class="messages-container">
      <div class="messages-scroll">
        <!-- Message 1: User -->
        <div class="message user-message">
          <div class="message-role">you</div>
          <div class="message-bubble user-bubble">
            create task: API v2 migration planning
          </div>
        </div>

        <!-- Message 2: Assistant (with typing indicator shown) -->
        <div class="message assistant-message">
          <div class="message-role">assistant</div>
          <div v-if="showTyping1" class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
          <div v-else class="message-bubble assistant-bubble">
            Task created with ID <span class="code-inline">tsk_b7x8</span>. Added to backlog with high priority. Assigned to you.
          </div>
        </div>

        <!-- Message 3: User -->
        <div v-if="showMessage3" class="message user-message">
          <div class="message-role">you</div>
          <div class="message-bubble user-bubble">
            summarize activity for this project today
          </div>
        </div>

        <!-- Message 4: Assistant -->
        <div v-if="showMessage3" class="message assistant-message">
          <div class="message-role">assistant</div>
          <div v-if="showTyping2" class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
          <div v-else-if="showMessage4" class="message-bubble assistant-bubble">
            <p class="message-text">Today's activity:</p>
            <ul class="activity-list">
              <li>3 tasks updated</li>
              <li>2 documents edited (Website Redesign, API v2)</li>
              <li>1 task completed by Jake</li>
              <li>4 new comments added</li>
            </ul>
            <p class="message-text">Most active: Sarah (5 actions)</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <div class="quick-actions">
        <button class="quick-action-chip">summarize activity</button>
        <button class="quick-action-chip">create task</button>
        <button class="quick-action-chip">list overdue</button>
      </div>
      <div class="input-row">
        <input
          type="text"
          class="ai-input"
          placeholder="Ask AI anything..."
          value=""
        />
        <button class="send-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const showTyping1 = ref(true);
const showTyping2 = ref(false);
const showMessage3 = ref(false);
const showMessage4 = ref(false);

// Static conversation sequence
onMounted(() => {
  // Show all messages without animation
  showTyping1.value = false;
  showMessage3.value = true;
  showTyping2.value = false;
  showMessage4.value = true;
});
</script>

<style scoped>
.screenshot-ai-panel {
  width: 100%;
  max-width: 360px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  height: 580px;
}

/* Header */
.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sparkle-icon {
  color: var(--color-text-secondary);
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.header-title {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  text-transform: lowercase;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* Messages Container */
.messages-container {
  flex: 1;
  overflow-y: auto;
  background: var(--color-bg);
}

.messages-scroll {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* Message */
.message {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  animation: messageIn 0.3s ease-out;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-role {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
  letter-spacing: 0.06em;
  padding-left: var(--space-2);
}

.message-bubble {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-xl);
  max-width: 85%;
  word-wrap: break-word;
}

.user-message {
  align-items: flex-end;
}

.user-bubble {
  background: var(--color-text);
  color: var(--color-bg);
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.6;
}

.assistant-message {
  align-items: flex-start;
}

.assistant-bubble {
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.6;
}

.message-text {
  margin: 0 0 var(--space-2) 0;
}

.message-text:last-child {
  margin-bottom: 0;
}

.activity-list {
  list-style: disc;
  padding-left: var(--space-5);
  margin: var(--space-2) 0;
}

.activity-list li {
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
}

.code-inline {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px var(--space-2);
  background: var(--color-bg-hover);
  border-radius: var(--radius-xs);
  color: var(--color-text);
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-radius: var(--radius-xl);
  max-width: 85%;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-text-tertiary);
  animation: typingBounce 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* Input Area */
.input-area {
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.quick-action-chip {
  padding: 4px var(--space-3);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-action-chip:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  color: var(--color-text-secondary);
}

.input-row {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.ai-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
  outline: none;
  transition: border-color var(--transition-fast);
}

.ai-input:focus {
  border-color: var(--color-border-strong);
}

.ai-input::placeholder {
  color: var(--color-text-tertiary);
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--color-text);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--color-bg);
  cursor: pointer;
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
}

.send-btn:hover {
  opacity: 0.9;
}

/* Mobile */
@media (max-width: 768px) {
  .screenshot-ai-panel {
    max-width: 100%;
    height: 500px;
  }

  .messages-scroll {
    padding: var(--space-4);
  }
}
</style>
