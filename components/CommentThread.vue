<script setup lang="ts">
import type { Comment, User } from '~/types/domain';
import CommentComposer from './CommentComposer.vue';

interface EnrichedComment extends Comment {
  author?: User | null;
  replies?: EnrichedComment[];
  mentioned_users?: User[];
  converted_to_task?: { id: string; title: string } | null;
}

const props = defineProps<{
  comment: EnrichedComment;
  projectId: string;
  currentUserId: string;
  depth?: number;
}>();

const emit = defineEmits<{
  replied: [];
  resolved: [];
  convertToTask: [comment: EnrichedComment];
}>();

const api = useWorkbenchApi();
const showReplyComposer = ref(false);
const isResolving = ref(false);

const maxDepth = 3; // Maximum nesting depth
const currentDepth = props.depth || 0;

// Format timestamp
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Render comment body with mentions as styled chips
const renderCommentBody = (body: string) => {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: Array<{ type: 'text' | 'mention'; content: string; userId?: string; name?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(body)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: body.substring(lastIndex, match.index) });
    }

    // Add mention
    parts.push({
      type: 'mention',
      content: match[0],
      name: match[1],
      userId: match[2]
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < body.length) {
    parts.push({ type: 'text', content: body.substring(lastIndex) });
  }

  return parts;
};

const bodyParts = computed(() => renderCommentBody(props.comment.body));

const canResolve = computed(() => {
  // Only comment author or project admin can resolve (for now, just author)
  return props.comment.author_id === props.currentUserId;
});

const handleReplySubmitted = () => {
  showReplyComposer.value = false;
  emit('replied');
};

const toggleResolve = async () => {
  if (isResolving.value) return;

  isResolving.value = true;

  try {
    if (props.comment.resolved_at) {
      // Unresolve
      await api.patch(`/api/comments/${props.comment.id}`, { resolved_at: null });
    } else {
      // Resolve
      await api.post(`/api/comments/${props.comment.id}/resolve`, {});
    }

    emit('resolved');
  } catch (error) {
    console.error('Failed to toggle resolve:', error);
    alert('Failed to update comment. Please try again.');
  } finally {
    isResolving.value = false;
  }
};

const handleConvertToTask = () => {
  emit('convertToTask', props.comment);
};
</script>

<template>
  <div :class="['comment-thread', { resolved: comment.resolved_at, nested: depth && depth > 0 }]">
    <div class="comment-item">
      <!-- Author avatar -->
      <div class="comment-avatar">
        <img v-if="comment.author?.avatar_url" :src="comment.author.avatar_url" :alt="comment.author?.name || 'User'" />
        <span v-else class="comment-avatar-fallback">
          {{ comment.author?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?' }}
        </span>
      </div>

      <div class="comment-content">
        <!-- Author and timestamp -->
        <div class="comment-header">
          <span class="comment-author">{{ comment.author?.name || 'Unknown User' }}</span>
          <span class="comment-timestamp">{{ formatTimestamp(comment.created_at) }}</span>
          <span v-if="comment.resolved_at" class="comment-resolved-badge">Resolved</span>
          <span v-if="comment.converted_to_task" class="comment-task-badge">
            Converted to Task #{{ comment.converted_to_task.title }}
          </span>
        </div>

        <!-- Comment body with mentions -->
        <div class="comment-body">
          <template v-for="(part, index) in bodyParts" :key="index">
            <span v-if="part.type === 'text'">{{ part.content }}</span>
            <span v-else class="mention-chip" :title="part.name">@{{ part.name }}</span>
          </template>
        </div>

        <!-- Actions -->
        <div class="comment-actions">
          <button
            v-if="!comment.resolved_at"
            type="button"
            class="comment-action-btn"
            @click="showReplyComposer = !showReplyComposer"
          >
            Reply
          </button>

          <button
            v-if="canResolve"
            type="button"
            class="comment-action-btn"
            :disabled="isResolving"
            @click="toggleResolve"
          >
            {{ comment.resolved_at ? 'Unresolve' : 'Resolve' }}
          </button>

          <button
            v-if="!comment.converted_to_task && !comment.resolved_at"
            type="button"
            class="comment-action-btn"
            @click="handleConvertToTask"
          >
            Convert to Task
          </button>
        </div>

        <!-- Reply composer -->
        <div v-if="showReplyComposer" class="comment-reply-composer">
          <CommentComposer
            :target-type="comment.target_type"
            :target-id="comment.target_id"
            :project-id="projectId"
            :parent-comment-id="comment.id"
            placeholder="Write a reply..."
            @submitted="handleReplySubmitted"
            @cancelled="showReplyComposer = false"
          />
        </div>
      </div>
    </div>

    <!-- Nested replies -->
    <div v-if="comment.replies && comment.replies.length > 0 && currentDepth < maxDepth" class="comment-replies">
      <CommentThread
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :project-id="projectId"
        :current-user-id="currentUserId"
        :depth="currentDepth + 1"
        @replied="emit('replied')"
        @resolved="emit('resolved')"
        @convert-to-task="emit('convertToTask', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-thread {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.comment-thread.resolved {
  opacity: 0.6;
}

.comment-thread.nested {
  margin-left: var(--space-6);
  padding-left: var(--space-4);
  border-left: 2px solid var(--color-border);
}

.comment-item {
  display: flex;
  gap: var(--space-3);
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-avatar-fallback {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.comment-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.comment-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.comment-author {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.comment-timestamp {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.comment-resolved-badge,
.comment-task-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.comment-resolved-badge {
  background: var(--color-success-bg, #d4edda);
  color: var(--color-success-text, #155724);
}

.comment-task-badge {
  background: var(--color-info-bg, #d1ecf1);
  color: var(--color-info-text, #0c5460);
}

.comment-body {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.mention-chip {
  display: inline-block;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-bg, rgba(59, 130, 246, 0.1));
  color: var(--color-primary);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.mention-chip:hover {
  background: var(--color-primary-bg-hover, rgba(59, 130, 246, 0.2));
}

.comment-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.comment-action-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.comment-action-btn:hover:not(:disabled) {
  color: var(--color-text);
}

.comment-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comment-reply-composer {
  margin-top: var(--space-2);
}

.comment-replies {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
