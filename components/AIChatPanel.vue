<script setup lang="ts">
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: Array<{ endpoint: string; method: string }>;
}

const props = defineProps<{
  open: boolean;
  projectId?: string | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const api = useWorkbenchApi();
const draft = ref('');
const sending = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const messages = useState<ChatMessage[]>('ai-chat-messages', () => [
  {
    id: 'seed',
    role: 'assistant',
    text: 'Ask for summaries, overdue tasks, or create task: <title>. I will run available actions and report them.'
  }
]);

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      window.addEventListener('keydown', onEscape);
    } else {
      window.removeEventListener('keydown', onEscape);
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEscape);
});

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const submit = async () => {
  const text = draft.value.trim();

  if (!text || sending.value) {
    return;
  }

  const userMessage: ChatMessage = {
    id: `${Date.now()}-u`,
    role: 'user',
    text
  };

  messages.value.push(userMessage);
  draft.value = '';
  sending.value = true;
  scrollToBottom();

  try {
    const response = await api.post<{ response: string; actions_taken: Array<{ endpoint: string; method: string }> }>('/api/ai/chat', {
      message: text,
      scope: props.projectId ? 'project' : 'system',
      project_id: props.projectId
    });

    messages.value.push({
      id: `${Date.now()}-a`,
      role: 'assistant',
      text: response.response,
      actions: response.actions_taken
    });
    scrollToBottom();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed.';
    messages.value.push({
      id: `${Date.now()}-e`,
      role: 'assistant',
      text: message
    });
    scrollToBottom();
  } finally {
    sending.value = false;
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    submit();
  }
};

const suggestedPrompts = [
  'summarize activity',
  'list overdue tasks',
  'what needs attention?'
];

const useSuggestion = (prompt: string) => {
  draft.value = prompt;
};
</script>

<template>
  <aside class="ai-panel" role="dialog" aria-modal="true" aria-label="AI assistant">
    <!-- Header -->
    <header class="panel-header">
      <div class="header-left">
        <svg class="sparkle-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
          <path opacity="0.15" d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
          <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="none" />
        </svg>
        <span class="header-title">ai assistant</span>
      </div>
      <button type="button" class="close-button" aria-label="Close panel" @click="emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </header>

    <!-- Messages -->
    <div ref="chatContainer" class="messages-container">
      <article
        v-for="message in messages"
        :key="message.id"
        class="message"
        :class="message.role"
      >
        <div class="message-role">{{ message.role === 'assistant' ? 'assistant' : 'you' }}</div>
        <p class="message-text">{{ message.text }}</p>
        <div v-if="message.actions?.length" class="message-actions">
          <span
            v-for="action in message.actions"
            :key="`${action.method}-${action.endpoint}`"
            class="action-badge"
          >
            {{ action.method }} {{ action.endpoint }}
          </span>
        </div>
      </article>

      <!-- Typing indicator -->
      <div v-if="sending" class="typing-indicator">
        <span /><span /><span />
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <div class="input-wrapper">
        <textarea
          v-model="draft"
          rows="2"
          placeholder="Ask AI to summarize, analyze, or create..."
          class="chat-input"
          @keydown="onKeydown"
        />
        <button
          type="button"
          class="send-button"
          :disabled="sending || !draft.trim()"
          @click="submit"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22,2 15,22 11,13 2,9 22,2" />
          </svg>
        </button>
      </div>

      <!-- Suggested Prompts -->
      <div class="prompt-chips">
        <button
          v-for="prompt in suggestedPrompts"
          :key="prompt"
          type="button"
          class="prompt-chip"
          @click="useSuggestion(prompt)"
        >
          {{ prompt }}
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.ai-panel {
  width: var(--ai-panel-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-sidebar);
  border-left: 1px solid var(--color-border);
  height: 100%;
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sparkle-icon {
  width: 16px;
  height: 16px;
}

.header-title {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.close-button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.close-button svg {
  width: 14px;
  height: 14px;
}

/* Messages */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.message {
  max-width: 85%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
}

.message.user {
  align-self: flex-end;
  background: var(--color-bg-active);
}

.message.assistant {
  align-self: flex-start;
}

.message-role {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  margin-bottom: 6px;
  text-transform: lowercase;
}

.message-text {
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.action-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-surface);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  align-self: flex-start;
  max-width: 60px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: var(--color-text-tertiary);
  border-radius: var(--radius-full);
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Input Area */
.input-area {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: var(--space-2);
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 10px var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
  resize: none;
  min-height: 44px;
  max-height: 120px;
}

.chat-input::placeholder {
  color: var(--color-text-tertiary);
}

.chat-input:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: var(--color-text);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--color-bg);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.send-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-button:not(:disabled):hover {
  opacity: 0.9;
}

.send-button svg {
  width: 14px;
  height: 14px;
}

/* Prompt Chips */
.prompt-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.prompt-chip {
  padding: var(--space-1) 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.prompt-chip:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}
</style>
