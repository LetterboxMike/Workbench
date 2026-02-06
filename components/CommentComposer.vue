<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { MentionSuggestion, getMentionSuggestionOptions } from '~/utils/mentionSuggestion';
import type { CommentMetadata } from '~/types/domain';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

const props = defineProps<{
  targetType: 'document' | 'task' | 'block';
  targetId: string;
  projectId: string;
  parentCommentId?: string;
  anchor?: CommentMetadata['anchor'];
  placeholder?: string;
}>();

const emit = defineEmits<{
  submitted: [comment: any];
  cancelled: [];
}>();

const api = useWorkbenchApi();
const isSubmitting = ref(false);
const projectMembers = ref<User[]>([]);

// Fetch project members for @mention autocomplete
onMounted(async () => {
  try {
    const response = await api.get(`/api/projects/${props.projectId}/members`);
    projectMembers.value = response.data.map((member: any) => member.user);
  } catch (error) {
    console.error('Failed to fetch project members:', error);
  }
});

// Initialize Tiptap editor for comment input
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      bulletList: false,
      orderedList: false,
      listItem: false
    }),
    Placeholder.configure({
      placeholder: props.placeholder || 'Write a comment... Use @ to mention someone'
    }),
    MentionSuggestion.configure({
      suggestion: getMentionSuggestionOptions(projectMembers)
    })
  ],
  editorProps: {
    attributes: {
      class: 'comment-editor-content'
    }
  },
  content: ''
});

const isEmpty = computed(() => {
  if (!editor.value) return true;
  return editor.value.isEmpty;
});

const handleSubmit = async () => {
  if (!editor.value || isEmpty.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const body = editor.value.getText();

    // Prepare request payload
    const payload: any = {
      target_type: props.targetType,
      target_id: props.targetId,
      body: body.trim(),
      parent_comment_id: props.parentCommentId || null
    };

    // Add anchor metadata if provided
    if (props.anchor) {
      payload.metadata = {
        anchor: props.anchor
      };
    }

    const response = await api.post('/api/comments', payload);

    emit('submitted', response.data);

    // Clear editor
    editor.value.commands.clearContent();
  } catch (error) {
    console.error('Failed to create comment:', error);
    alert('Failed to create comment. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  if (editor.value) {
    editor.value.commands.clearContent();
  }
  emit('cancelled');
};

const focusEditor = () => {
  editor.value?.commands.focus();
};

defineExpose({
  focusEditor
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="comment-composer">
    <EditorContent :editor="editor" class="comment-editor" />

    <div class="comment-composer-actions">
      <button
        type="button"
        class="btn btn-primary"
        :disabled="isEmpty || isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? 'Submitting...' : parentCommentId ? 'Reply' : 'Comment' }}
      </button>

      <button
        v-if="parentCommentId"
        type="button"
        class="btn btn-secondary"
        :disabled="isSubmitting"
        @click="handleCancel"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<style scoped>
.comment-composer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.comment-editor {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  min-height: 80px;
  max-height: 300px;
  overflow-y: auto;
  transition: border-color var(--transition-fast);
}

.comment-editor:focus-within {
  border-color: var(--color-primary);
  outline: 1px solid var(--color-primary);
}

.comment-editor :deep(.comment-editor-content) {
  padding: var(--space-3);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text);
  outline: none;
}

.comment-editor :deep(.comment-editor-content p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--color-text-tertiary);
  pointer-events: none;
  height: 0;
  float: left;
}

.comment-composer-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
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
