<script setup lang="ts">
import type { Comment, User } from '~/types/domain';

interface EnrichedComment extends Comment {
  author?: User | null;
  replies?: EnrichedComment[];
  mentioned_users?: User[];
  converted_to_task?: { id: string; title: string } | null;
}

const props = defineProps<{
  comment: EnrichedComment;
  projectId: string;
}>();

const emit = defineEmits<{
  close: [];
  converted: [task: any];
}>();

const api = useWorkbenchApi();
const isSubmitting = ref(false);
const projectMembers = ref<(any & { user: User })[]>([]);

// Form fields
const form = ref({
  title: '',
  description: '',
  assignee_id: null as string | null,
  status: 'todo',
  priority: 'none',
  due_date: null as string | null
});

const statuses = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' }
];

const priorities = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

// Fetch project members
onMounted(async () => {
  try {
    const response = await api.get(`/api/projects/${props.projectId}/members`);
    projectMembers.value = response.data;

    // Pre-fill form with comment data
    const firstLine = props.comment.body.split('\n')[0];
    form.value.title = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
    form.value.description = props.comment.body;

    // Pre-select assignee if there are mentioned users
    if (props.comment.mentioned_users && props.comment.mentioned_users.length > 0) {
      form.value.assignee_id = props.comment.mentioned_users[0].id;
    }
  } catch (error) {
    console.error('Failed to fetch project members:', error);
  }
});

const handleSubmit = async () => {
  if (!form.value.title.trim() || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const response = await api.post(`/api/comments/${props.comment.id}/convert-to-task`, {
      title: form.value.title.trim(),
      description: form.value.description.trim() || undefined,
      assignee_id: form.value.assignee_id,
      status: form.value.status,
      priority: form.value.priority,
      due_date: form.value.due_date
    });

    emit('converted', response.data);
    emit('close');
  } catch (error) {
    console.error('Failed to convert comment to task:', error);
    alert('Failed to convert comment to task. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  if (!isSubmitting.value) {
    emit('close');
  }
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    handleClose();
  }
};
</script>

<template>
  <div class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Convert Comment to Task</h2>
        <button type="button" class="modal-close" :disabled="isSubmitting" @click="handleClose">×</button>
      </div>

      <form class="modal-body" @submit.prevent="handleSubmit">
        <!-- Title -->
        <div class="form-group">
          <label for="task-title" class="form-label">Title *</label>
          <input
            id="task-title"
            v-model="form.title"
            type="text"
            class="form-input"
            placeholder="Task title"
            required
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="task-description" class="form-label">Description</label>
          <textarea
            id="task-description"
            v-model="form.description"
            class="form-textarea"
            rows="6"
            placeholder="Task description (includes backlink to comment)"
          ></textarea>
        </div>

        <!-- Assignee -->
        <div class="form-group">
          <label for="task-assignee" class="form-label">Assignee</label>
          <select id="task-assignee" v-model="form.assignee_id" class="form-select">
            <option :value="null">Unassigned</option>
            <option v-for="member in projectMembers" :key="member.user_id" :value="member.user_id">
              {{ member.user.name }}
            </option>
          </select>
        </div>

        <!-- Status and Priority -->
        <div class="form-row">
          <div class="form-group">
            <label for="task-status" class="form-label">Status</label>
            <select id="task-status" v-model="form.status" class="form-select">
              <option v-for="status in statuses" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="task-priority" class="form-label">Priority</label>
            <select id="task-priority" v-model="form.priority" class="form-select">
              <option v-for="priority in priorities" :key="priority.value" :value="priority.value">
                {{ priority.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Due Date -->
        <div class="form-group">
          <label for="task-due-date" class="form-label">Due Date</label>
          <input id="task-due-date" v-model="form.due_date" type="date" class="form-input" />
        </div>
      </form>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" :disabled="isSubmitting" @click="handleClose">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!form.title.trim() || isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? 'Creating...' : 'Create Task' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.modal-content {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-close:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.modal-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-label {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.form-input,
.form-textarea,
.form-select {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
