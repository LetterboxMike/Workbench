<script setup lang="ts">
import type { Comment, User } from '~/types/domain';
import CommentThread from './CommentThread.vue';
import CommentComposer from './CommentComposer.vue';

interface EnrichedComment extends Comment {
  author?: User | null;
  replies?: EnrichedComment[];
  mentioned_users?: User[];
  converted_to_task?: { id: string; title: string } | null;
}

const props = defineProps<{
  documentId: string;
  projectId: string;
  pendingAnchor?: any;
}>();

const emit = defineEmits<{
  commentCreated: [comment: any];
  commentSelected: [commentId: string];
}>();

const api = useWorkbenchApi();
const comments = ref<EnrichedComment[]>([]);
const isLoading = ref(false);
const filter = ref<'all' | 'unresolved' | 'resolved'>('unresolved');
const showNewCommentComposer = ref(false);
const currentUserId = ref<string>('');
const selectedCommentToConvert = ref<EnrichedComment | null>(null);

// Fetch current user
onMounted(async () => {
  try {
    const userResponse = await api.get('/api/auth/me');
    currentUserId.value = userResponse.data.id;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
  }

  await fetchComments();
});

// Fetch comments
const fetchComments = async () => {
  isLoading.value = true;

  try {
    const response = await api.get('/api/comments', {
      params: {
        target_type: 'document',
        target_id: props.documentId
      }
    });

    comments.value = response.data;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
  } finally {
    isLoading.value = false;
  }
};

// Filter comments
const filteredComments = computed(() => {
  if (filter.value === 'all') {
    return comments.value;
  } else if (filter.value === 'unresolved') {
    return comments.value.filter((c) => !c.resolved_at);
  } else {
    return comments.value.filter((c) => c.resolved_at);
  }
});

const handleNewCommentSubmitted = (comment: any) => {
  showNewCommentComposer.value = false;
  emit('commentCreated', comment);
  fetchComments();
};

const handleCommentAction = () => {
  fetchComments();
  emit('commentCreated', null);
};

const handleConvertToTask = (comment: EnrichedComment) => {
  selectedCommentToConvert.value = comment;
};

const handleTaskConversionComplete = () => {
  selectedCommentToConvert.value = null;
  fetchComments();
};

// Expose methods
defineExpose({
  refresh: fetchComments
});

// Watch for pending anchor from parent
watch(
  () => props.pendingAnchor,
  (anchor) => {
    if (anchor) {
      showNewCommentComposer.value = true;
    }
  }
);
</script>

<template>
  <div class="comment-sidebar">
    <div class="comment-sidebar-header">
      <h3 class="comment-sidebar-title">Comments</h3>

      <!-- Filter tabs -->
      <div class="comment-filter-tabs">
        <button
          type="button"
          :class="['filter-tab', { active: filter === 'unresolved' }]"
          @click="filter = 'unresolved'"
        >
          Open
        </button>
        <button
          type="button"
          :class="['filter-tab', { active: filter === 'resolved' }]"
          @click="filter = 'resolved'"
        >
          Resolved
        </button>
        <button
          type="button"
          :class="['filter-tab', { active: filter === 'all' }]"
          @click="filter = 'all'"
        >
          All
        </button>
      </div>
    </div>

    <div class="comment-sidebar-body">
      <!-- New comment button -->
      <div v-if="!showNewCommentComposer" class="new-comment-section">
        <button type="button" class="btn-new-comment" @click="showNewCommentComposer = true">
          + New Comment
        </button>
      </div>

      <!-- New comment composer -->
      <div v-if="showNewCommentComposer" class="new-comment-composer">
        <CommentComposer
          target-type="document"
          :target-id="documentId"
          :project-id="projectId"
          :anchor="pendingAnchor"
          @submitted="handleNewCommentSubmitted"
          @cancelled="showNewCommentComposer = false"
        />
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="comment-loading">
        <div class="loading-spinner"></div>
        <span>Loading comments...</span>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredComments.length === 0" class="comment-empty">
        <span class="empty-icon">💬</span>
        <p class="empty-text">
          {{ filter === 'unresolved' ? 'No open comments' : filter === 'resolved' ? 'No resolved comments' : 'No comments yet' }}
        </p>
        <p v-if="filter === 'unresolved'" class="empty-subtext">
          Select text and click Comment to start a discussion
        </p>
      </div>

      <!-- Comments list -->
      <div v-else class="comment-list">
        <CommentThread
          v-for="comment in filteredComments"
          :key="comment.id"
          :comment="comment"
          :project-id="projectId"
          :current-user-id="currentUserId"
          :depth="0"
          @replied="handleCommentAction"
          @resolved="handleCommentAction"
          @convert-to-task="handleConvertToTask"
        />
      </div>
    </div>

    <!-- Convert to Task Modal -->
    <ConvertToTaskModal
      v-if="selectedCommentToConvert"
      :comment="selectedCommentToConvert"
      :project-id="projectId"
      @close="selectedCommentToConvert = null"
      @converted="handleTaskConversionComplete"
    />
  </div>
</template>

<style scoped>
.comment-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg);
  border-left: 1px solid var(--color-border);
}

.comment-sidebar-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.comment-sidebar-title {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.comment-filter-tabs {
  display: flex;
  gap: var(--space-1);
}

.filter-tab {
  flex: 1;
  padding: var(--space-2);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-tab:hover {
  background: var(--color-bg-hover);
}

.filter-tab.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.comment-sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.new-comment-section {
  display: flex;
  justify-content: center;
}

.btn-new-comment {
  width: 100%;
  padding: var(--space-3);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-bg, rgba(59, 130, 246, 0.1));
  border: 1px dashed var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-new-comment:hover {
  background: var(--color-primary-bg-hover, rgba(59, 130, 246, 0.15));
}

.new-comment-composer {
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.comment-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  font-size: 13px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.comment-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
  margin-bottom: var(--space-3);
}

.empty-text {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2) 0;
}

.empty-subtext {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin: 0;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
</style>
