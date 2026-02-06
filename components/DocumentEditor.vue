<script setup lang="ts">
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { SlashCommands, getSuggestionOptions } from '~/utils/slashCommands';
import { CommentMark } from '~/utils/commentMark';
import CommentSidebar from './CommentSidebar.vue';

const props = defineProps<{
  documentId: string;
  projectId: string;
  initialContent: Record<string, unknown>;
}>();

const emit = defineEmits<{
  saved: [timestamp: string];
  error: [message: string];
}>();

const api = useWorkbenchApi();
const saving = ref(false);
const lastSavedAt = ref('');
let saveTimer: ReturnType<typeof setTimeout> | null = null;

// Link modal state
const showLinkModal = ref(false);
const linkUrl = ref('');
const linkText = ref('');

// Image modal state
const showImageModal = ref(false);
const imageUrl = ref('');
const imageFile = ref<File | null>(null);
const uploadingImage = ref(false);

// File upload state
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadingFile = ref(false);

// Table modal state
const showTableModal = ref(false);
const tableRows = ref(3);
const tableColumns = ref(3);

// Comment state
const showCommentSidebar = ref(true);
const pendingCommentAnchor = ref<any>(null);
const commentSidebarRef = ref<InstanceType<typeof CommentSidebar> | null>(null);

const editor = useEditor({
  extensions: [
    StarterKit,
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link'
      }
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'editor-image'
      }
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'editor-table'
      }
    }),
    TableRow,
    TableHeader,
    TableCell,
    CommentMark,
    SlashCommands.configure({
      suggestion: getSuggestionOptions(
        () => openImageModal(),
        () => openLinkModal(),
        () => triggerFileUpload(),
        () => openTableModal()
      )
    }),
    Placeholder.configure({
      placeholder: 'Write clearly. Use / for commands. Changes save automatically.'
    })
  ],
  content: props.initialContent,
  autofocus: 'end',
  onUpdate: () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    const targetDocumentId = props.documentId;
    const snapshot = editor.value?.getJSON();

    saveTimer = setTimeout(async () => {
      if (!snapshot) {
        return;
      }

      saving.value = true;

      try {
        await api.put(`/api/documents/${targetDocumentId}/content`, {
          last_snapshot: snapshot
        });

        lastSavedAt.value = new Date().toLocaleTimeString();

        if (targetDocumentId === props.documentId) {
          emit('saved', lastSavedAt.value);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Autosave failed.';

        if (targetDocumentId === props.documentId) {
          emit('error', message);
        }
      } finally {
        saving.value = false;
      }
    }, 360);
  }
});

watch(
  () => props.initialContent,
  (value) => {
    if (!editor.value) {
      return;
    }

    const current = JSON.stringify(editor.value.getJSON());
    const incoming = JSON.stringify(value);

    if (current !== incoming) {
      editor.value.commands.setContent(value, false);
    }
  }
);

watch(
  () => props.documentId,
  () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  }
);

onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
});

const setHeading = (level: 1 | 2 | 3) => editor.value?.chain().focus().toggleHeading({ level }).run();

const isHeadingActive = (level: 1 | 2 | 3) => editor.value?.isActive('heading', { level }) ?? false;

const isFormatActive = (format: string) => editor.value?.isActive(format) ?? false;

// Link functions
const openLinkModal = () => {
  const previousUrl = editor.value?.getAttributes('link').href || '';
  const { from, to } = editor.value?.state.selection || { from: 0, to: 0 };
  const selectedText = editor.value?.state.doc.textBetween(from, to, '') || '';

  linkUrl.value = previousUrl;
  linkText.value = selectedText;
  showLinkModal.value = true;
};

const insertLink = () => {
  if (!linkUrl.value) {
    showLinkModal.value = false;
    return;
  }

  const url = linkUrl.value.startsWith('http') ? linkUrl.value : `https://${linkUrl.value}`;

  if (linkText.value) {
    editor.value?.chain().focus().insertContent({
      type: 'text',
      text: linkText.value,
      marks: [{ type: 'link', attrs: { href: url } }]
    }).run();
  } else {
    editor.value?.chain().focus().setLink({ href: url }).run();
  }

  showLinkModal.value = false;
  linkUrl.value = '';
  linkText.value = '';
};

const removeLink = () => {
  editor.value?.chain().focus().unsetLink().run();
  showLinkModal.value = false;
};

// Image functions
const openImageModal = () => {
  imageUrl.value = '';
  imageFile.value = null;
  showImageModal.value = true;
};

const handleImageFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    imageFile.value = target.files[0];
    imageUrl.value = '';
  }
};

const insertImage = async () => {
  let finalUrl = imageUrl.value;

  if (imageFile.value) {
    uploadingImage.value = true;
    try {
      const formData = new FormData();
      formData.append('file', imageFile.value);

      const response = await api.post('/api/uploads', formData);
      finalUrl = response.data.url;
    } catch (error) {
      emit('error', 'Failed to upload image');
      uploadingImage.value = false;
      return;
    } finally {
      uploadingImage.value = false;
    }
  }

  if (finalUrl) {
    const url = finalUrl.startsWith('http') || finalUrl.startsWith('/') ? finalUrl : `https://${finalUrl}`;
    editor.value?.chain().focus().setImage({ src: url }).run();
  }

  showImageModal.value = false;
  imageUrl.value = '';
  imageFile.value = null;
};

// File attachment functions
const triggerFileUpload = () => {
  fileInputRef.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || !target.files[0]) {
    return;
  }

  const file = target.files[0];
  uploadingFile.value = true;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/uploads', formData);
    const fileUrl = response.data.url;
    const fileName = response.data.filename;

    // Insert as a link
    editor.value?.chain().focus().insertContent({
      type: 'text',
      text: `📎 ${fileName}`,
      marks: [{ type: 'link', attrs: { href: fileUrl } }]
    }).run();
  } catch (error) {
    emit('error', 'Failed to upload file');
  } finally {
    uploadingFile.value = false;
    if (target) {
      target.value = '';
    }
  }
};

// Table functions
const openTableModal = () => {
  tableRows.value = 3;
  tableColumns.value = 3;
  showTableModal.value = true;
};

const insertTable = () => {
  if (tableRows.value > 0 && tableColumns.value > 0) {
    editor.value?.chain().focus().insertTable({
      rows: tableRows.value,
      cols: tableColumns.value,
      withHeaderRow: true
    }).run();
  }
  showTableModal.value = false;
};

const addColumnBefore = () => editor.value?.chain().focus().addColumnBefore().run();
const addColumnAfter = () => editor.value?.chain().focus().addColumnAfter().run();
const deleteColumn = () => editor.value?.chain().focus().deleteColumn().run();
const addRowBefore = () => editor.value?.chain().focus().addRowBefore().run();
const addRowAfter = () => editor.value?.chain().focus().addRowAfter().run();
const deleteRow = () => editor.value?.chain().focus().deleteRow().run();
const deleteTable = () => editor.value?.chain().focus().deleteTable().run();
const mergeCells = () => editor.value?.chain().focus().mergeCells().run();
const splitCell = () => editor.value?.chain().focus().splitCell().run();
const toggleHeaderRow = () => editor.value?.chain().focus().toggleHeaderRow().run();

const isInTable = () => editor.value?.isActive('table') ?? false;

// Comment functions
const hasSelection = () => {
  if (!editor.value) return false;
  const { from, to } = editor.value.state.selection;
  return to > from;
};

const createCommentFromSelection = () => {
  if (!editor.value) return;

  const { from, to } = editor.value.state.selection;

  if (from === to) {
    // No selection, just open sidebar for document-level comment
    showCommentSidebar.value = true;
    pendingCommentAnchor.value = null;
    return;
  }

  const text = editor.value.state.doc.textBetween(from, to, ' ');

  pendingCommentAnchor.value = {
    from,
    to,
    text: text.substring(0, 200)
  };

  showCommentSidebar.value = true;
};

const handleCommentCreated = (comment: any) => {
  if (comment && comment.metadata?.anchor) {
    // Apply comment mark to editor at anchor position
    const { from, to } = comment.metadata.anchor;
    editor.value?.chain()
      .setTextSelection({ from, to })
      .setCommentMark(comment.id)
      .run();
  }

  pendingCommentAnchor.value = null;

  // Refresh comments in sidebar
  commentSidebarRef.value?.refresh();
};
</script>

<template>
  <div :class="['editor-container', { 'with-sidebar': showCommentSidebar }]">
    <div class="editor-main">
      <div class="toolbar">
      <div class="toolbar-group">
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: isFormatActive('bold') }"
          @click="editor?.chain().focus().toggleBold().run()"
          title="Bold (Ctrl+B)"
        >
          Bold
        </button>
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: isFormatActive('italic') }"
          @click="editor?.chain().focus().toggleItalic().run()"
          title="Italic (Ctrl+I)"
        >
          Italic
        </button>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: isHeadingActive(1) }"
          @click="setHeading(1)"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: isHeadingActive(2) }"
          @click="setHeading(2)"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: isHeadingActive(3) }"
          @click="setHeading(3)"
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: isFormatActive('bulletList') }"
          @click="editor?.chain().focus().toggleBulletList().run()"
          title="Bullet List"
        >
          List
        </button>
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: isFormatActive('taskList') }"
          @click="editor?.chain().focus().toggleTaskList().run()"
          title="Task List"
        >
          Task
        </button>
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: isFormatActive('codeBlock') }"
          @click="editor?.chain().focus().toggleCodeBlock().run()"
          title="Code Block"
        >
          Code
        </button>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: isFormatActive('link') }"
          @click="openLinkModal"
          title="Insert Link (Ctrl+K)"
        >
          🔗 Link
        </button>
        <button
          type="button"
          :disabled="!editor"
          @click="openImageModal"
          title="Insert Image"
        >
          🖼️ Image
        </button>
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: isInTable() }"
          @click="openTableModal"
          title="Insert Table"
        >
          📊 Table
        </button>
        <button
          type="button"
          :disabled="!editor || uploadingFile"
          @click="triggerFileUpload"
          title="Attach File"
        >
          {{ uploadingFile ? '⏳' : '📎' }} File
        </button>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          :disabled="!editor"
          @click="createCommentFromSelection"
          title="Add Comment (Ctrl+Shift+M)"
        >
          💬 Comment
        </button>
        <button
          type="button"
          :disabled="!editor"
          :class="{ active: showCommentSidebar }"
          @click="showCommentSidebar = !showCommentSidebar"
          title="Toggle Comment Sidebar"
        >
          {{ showCommentSidebar ? '⬅️' : '➡️' }} Comments
        </button>
      </div>

      <span class="save-status">{{ saving ? 'Saving...' : lastSavedAt ? `Saved ${lastSavedAt}` : 'Autosave on' }}</span>
    </div>

    <!-- Table controls - shown when cursor is inside a table -->
    <div v-if="isInTable()" class="table-controls">
      <span class="controls-label">Table:</span>
      <div class="toolbar-group">
        <button type="button" @click="addColumnBefore" title="Add Column Before">+ Col ←</button>
        <button type="button" @click="addColumnAfter" title="Add Column After">+ Col →</button>
        <button type="button" @click="deleteColumn" title="Delete Column">− Col</button>
      </div>
      <div class="toolbar-group">
        <button type="button" @click="addRowBefore" title="Add Row Above">+ Row ↑</button>
        <button type="button" @click="addRowAfter" title="Add Row Below">+ Row ↓</button>
        <button type="button" @click="deleteRow" title="Delete Row">− Row</button>
      </div>
      <div class="toolbar-group">
        <button type="button" @click="mergeCells" title="Merge Cells">Merge</button>
        <button type="button" @click="splitCell" title="Split Cell">Split</button>
        <button type="button" @click="toggleHeaderRow" title="Toggle Header Row">Header</button>
      </div>
      <div class="toolbar-group">
        <button type="button" class="danger-btn" @click="deleteTable" title="Delete Table">Delete Table</button>
      </div>
    </div>

    <EditorContent :editor="editor" />

    <!-- Hidden file input for attachments -->
    <input
      ref="fileInputRef"
      type="file"
      style="display: none"
      @change="handleFileUpload"
    />

    <!-- Link Modal -->
    <div v-if="showLinkModal" class="modal-overlay" @click="showLinkModal = false">
      <div class="modal" @click.stop>
        <h3>Insert Link</h3>
        <div class="modal-field">
          <label>URL</label>
          <input
            v-model="linkUrl"
            type="url"
            placeholder="https://example.com"
            @keyup.enter="insertLink"
          />
        </div>
        <div class="modal-field">
          <label>Link Text (optional)</label>
          <input
            v-model="linkText"
            type="text"
            placeholder="Example Website"
            @keyup.enter="insertLink"
          />
        </div>
        <div class="modal-actions">
          <button type="button" @click="showLinkModal = false">Cancel</button>
          <button v-if="isFormatActive('link')" type="button" class="danger" @click="removeLink">Remove Link</button>
          <button type="button" class="primary" @click="insertLink">Insert</button>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="modal-overlay" @click="showImageModal = false">
      <div class="modal" @click.stop>
        <h3>Insert Image</h3>
        <div class="modal-field">
          <label>Image URL</label>
          <input
            v-model="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
            :disabled="!!imageFile"
            @keyup.enter="insertImage"
          />
        </div>
        <div class="modal-divider">OR</div>
        <div class="modal-field">
          <label>Upload Image</label>
          <input
            type="file"
            accept="image/*"
            :disabled="!!imageUrl"
            @change="handleImageFileSelect"
          />
        </div>
        <div class="modal-actions">
          <button type="button" @click="showImageModal = false">Cancel</button>
          <button
            type="button"
            class="primary"
            :disabled="!imageUrl && !imageFile || uploadingImage"
            @click="insertImage"
          >
            {{ uploadingImage ? 'Uploading...' : 'Insert' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Table Modal -->
    <div v-if="showTableModal" class="modal-overlay" @click="showTableModal = false">
      <div class="modal" @click.stop>
        <h3>Insert Table</h3>
        <div class="modal-field">
          <label>Rows</label>
          <input
            v-model.number="tableRows"
            type="number"
            min="1"
            max="20"
            @keyup.enter="insertTable"
          />
        </div>
        <div class="modal-field">
          <label>Columns</label>
          <input
            v-model.number="tableColumns"
            type="number"
            min="1"
            max="10"
            @keyup.enter="insertTable"
          />
        </div>
        <div class="modal-info">
          Tables will include a header row by default
        </div>
        <div class="modal-actions">
          <button type="button" @click="showTableModal = false">Cancel</button>
          <button
            type="button"
            class="primary"
            :disabled="tableRows < 1 || tableColumns < 1"
            @click="insertTable"
          >
            Insert Table
          </button>
        </div>
      </div>
    </div>
    </div>

    <!-- Comment Sidebar -->
    <CommentSidebar
      v-if="showCommentSidebar"
      ref="commentSidebarRef"
      :document-id="documentId"
      :project-id="projectId"
      :pending-anchor="pendingCommentAnchor"
      @comment-created="handleCommentCreated"
    />
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-container.with-sidebar {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 0;
}

.editor-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: var(--space-1);
}

.toolbar button {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  white-space: nowrap;
}

.toolbar button:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
  border-color: var(--color-border-strong);
}

.toolbar button.active {
  background: var(--color-bg-hover);
  color: var(--color-text);
  border-color: var(--color-border-strong);
  font-weight: 600;
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-status {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* Editor content area */
:deep(.tiptap) {
  flex: 1;
  outline: none;
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text);
}

:deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-text-tertiary);
  pointer-events: none;
  height: 0;
}

:deep(.tiptap h1) {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  margin: var(--space-6) 0 var(--space-4);
}

:deep(.tiptap h2) {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 600;
  margin: var(--space-5) 0 var(--space-3);
}

:deep(.tiptap h3) {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  margin: var(--space-4) 0 var(--space-2);
}

:deep(.tiptap p) {
  margin: var(--space-3) 0;
}

:deep(.tiptap ul),
:deep(.tiptap ol) {
  padding-left: var(--space-6);
  margin: var(--space-3) 0;
}

:deep(.tiptap li) {
  margin: var(--space-1) 0;
}

:deep(.tiptap ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
}

:deep(.tiptap ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

:deep(.tiptap ul[data-type="taskList"] li > label) {
  flex-shrink: 0;
  margin-top: 4px;
}

:deep(.tiptap ul[data-type="taskList"] li > div) {
  flex: 1;
}

:deep(.tiptap code) {
  font-family: var(--font-mono);
  font-size: 13px;
  background: var(--color-bg-hover);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-xs);
}

:deep(.tiptap pre) {
  font-family: var(--font-mono);
  font-size: 13px;
  background: var(--color-bg);
  padding: var(--space-4);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: var(--space-4) 0;
}

:deep(.tiptap pre code) {
  background: transparent;
  padding: 0;
}

:deep(.tiptap blockquote) {
  border-left: 3px solid var(--color-border-strong);
  padding-left: var(--space-4);
  margin: var(--space-4) 0;
  color: var(--color-text-secondary);
}

:deep(.tiptap strong) {
  font-weight: 600;
}

:deep(.tiptap em) {
  font-style: italic;
}

:deep(.tiptap .editor-link) {
  color: var(--color-primary, #0066cc);
  text-decoration: underline;
  cursor: pointer;
}

:deep(.tiptap .editor-link:hover) {
  color: var(--color-primary-dark, #0052a3);
}

:deep(.tiptap .editor-image) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  margin: var(--space-4) 0;
}

/* Table styles */
:deep(.tiptap .editor-table) {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: var(--space-4) 0;
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
}

:deep(.tiptap .editor-table td),
:deep(.tiptap .editor-table th) {
  min-width: 1em;
  border: 1px solid var(--color-border);
  padding: var(--space-3);
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
  background: var(--color-bg);
}

:deep(.tiptap .editor-table th) {
  font-weight: 600;
  text-align: left;
  background: var(--color-bg-hover);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
}

:deep(.tiptap .editor-table td) {
  font-size: 14px;
}

:deep(.tiptap .editor-table .selectedCell) {
  background: rgba(200, 200, 255, 0.2);
}

:deep(.tiptap .editor-table .column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: var(--color-primary, #0066cc);
  pointer-events: none;
}

:deep(.tiptap .editor-table p) {
  margin: 0;
}

/* Table controls */
.table-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-hover);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.controls-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-controls .toolbar-group {
  gap: var(--space-1);
}

.table-controls button {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  white-space: nowrap;
}

.table-controls button:hover {
  background: var(--color-bg);
  color: var(--color-text);
  border-color: var(--color-border-strong);
}

.table-controls button.danger-btn {
  color: #dc3545;
  border-color: #dc3545;
}

.table-controls button.danger-btn:hover {
  background: #dc3545;
  color: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 var(--space-4);
  color: var(--color-text);
}

.modal-field {
  margin-bottom: var(--space-4);
}

.modal-field label {
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.modal-field input {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 14px;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.modal-field input:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

.modal-field input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-divider {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin: var(--space-4) 0;
  position: relative;
}

.modal-divider::before,
.modal-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: var(--color-border);
}

.modal-divider::before {
  left: 0;
}

.modal-divider::after {
  right: 0;
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-5);
}

.modal-actions button {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.modal-actions button {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.modal-actions button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
  border-color: var(--color-border-strong);
}

.modal-actions button.primary {
  background: var(--color-primary, #0066cc);
  border: 1px solid var(--color-primary, #0066cc);
  color: white;
}

.modal-actions button.primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #0052a3);
  border-color: var(--color-primary-dark, #0052a3);
}

.modal-actions button.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-actions button.danger {
  background: transparent;
  border: 1px solid #dc3545;
  color: #dc3545;
}

.modal-actions button.danger:hover {
  background: #dc3545;
  color: white;
}

.modal-info {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding: var(--space-3);
  background: var(--color-bg-hover);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-4);
}

/* Comment marks */
:deep(.tiptap .comment-mark) {
  background-color: rgba(255, 220, 100, 0.2);
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

:deep(.tiptap .comment-mark:hover) {
  background-color: rgba(255, 220, 100, 0.4);
}

:deep(.tiptap .comment-icon) {
  font-size: 0.75em;
  opacity: 0.6;
  margin-left: 2px;
  user-select: none;
  pointer-events: none;
}
</style>
