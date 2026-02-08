<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  projectId: string;
  documentId: string;
  linkedTasks: Array<{ id: string; title: string; status: string; priority: string }>;
}>();

const emit = defineEmits<{
  close: [];
  'task-created': [];
}>();

const api = useWorkbenchApi();
const taskDraft = ref('');
const creating = ref(false);

const createTask = async () => {
  const title = taskDraft.value.trim();

  if (!title || creating.value) {
    return;
  }

  creating.value = true;

  try {
    await api.post(`/api/projects/${props.projectId}/tasks`, {
      title,
      source_document_id: props.documentId
    });

    taskDraft.value = '';
    emit('task-created');
  } finally {
    creating.value = false;
  }
};

const close = () => {
  emit('close');
};

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close();
};

const onBackdropClick = (event: MouseEvent) => {
  if ((event.target as HTMLElement).classList.contains('panel-backdrop')) {
    close();
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
</script>

<template>
  <Teleport to="body">
    <Transition name="panel">
      <div v-if="open" class="panel-backdrop" @click="onBackdropClick">
        <aside class="panel" role="dialog" aria-modal="true" aria-label="Linked Tasks">
          <header class="panel-header">
            <div>
              <h3>Linked tasks</h3>
              <p>Tasks created here appear in every task view for this project.</p>
            </div>
            <button type="button" class="close-btn" @click="close" aria-label="Close panel">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </header>

          <div class="panel-body">
            <form @submit.prevent="createTask" class="create-form">
              <input 
                v-model="taskDraft" 
                placeholder="Create linked task..." 
                :disabled="creating"
              />
              <button type="submit" :disabled="!taskDraft.trim() || creating">
                {{ creating ? '...' : 'Add' }}
              </button>
            </form>

            <div v-if="linkedTasks.length" class="task-list">
              <article v-for="task in linkedTasks" :key="task.id" class="task-item">
                <strong>{{ task.title }}</strong>
                <div class="task-pills">
                  <TaskPill kind="status" :value="task.status" />
                  <TaskPill kind="priority" :value="task.priority" />
                </div>
              </article>
            </div>

            <div v-else class="empty-state">
              <span class="empty-icon">📋</span>
              <p>No linked tasks yet.</p>
              <span class="empty-hint">Create tasks from this document to track work items.</span>
            </div>
          </div>

          <footer class="panel-footer">
            <NuxtLink :to="`/projects/${projectId}/tasks/list`" class="view-all-link">
              Open full task list →
            </NuxtLink>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Panel Backdrop */
.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  backdrop-filter: blur(2px);
}

/* Panel Slide-over */
.panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: calc(100vw - 48px);
  background: var(--color-bg-elevated);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.2);
}

/* Panel Header */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.panel-header h3 {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

.panel-header p {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-tertiary);
  line-height: 1.4;
}

.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.close-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

/* Panel Body */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

/* Create Task Form */
.create-form {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.create-form input {
  flex: 1;
  min-height: 40px;
  box-sizing: border-box;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  outline: none;
  transition: border-color var(--transition-fast);
}

.create-form input:focus {
  border-color: var(--color-border-strong);
}

.create-form input::placeholder {
  color: var(--color-text-tertiary);
}

.create-form input:disabled {
  opacity: 0.6;
}

.create-form button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  min-width: 56px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-bg);
  background: var(--color-text);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.create-form button:hover:not(:disabled) {
  opacity: 0.9;
}

.create-form button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Task List */
.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-item {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.task-item:hover {
  border-color: var(--color-border-strong);
}

.task-item strong {
  display: block;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-2);
  line-height: 1.4;
}

.task-pills {
  display: flex;
  gap: var(--space-2);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-8) var(--space-4);
}

.empty-icon {
  font-size: 32px;
  margin-bottom: var(--space-3);
  opacity: 0.6;
}

.empty-state p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.empty-hint {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
}

/* Panel Footer */
.panel-footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.view-all-link:hover {
  color: var(--color-text);
}

/* Slide Animation */
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease;
}

.panel-enter-active .panel,
.panel-leave-active .panel {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}

.panel-enter-from .panel,
.panel-leave-to .panel {
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 480px) {
  .panel {
    width: 100%;
    max-width: 100%;
    border-left: none;
  }
}
</style>
