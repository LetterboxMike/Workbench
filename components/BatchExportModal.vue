<script setup lang="ts">
import type { ExportFormat, ExportOptions } from '~/types/domain';

interface Document {
  id: string;
  title: string;
}

const props = defineProps<{
  open: boolean;
  projectId: string;
  documents: Document[];
}>();

const emit = defineEmits<{
  close: [];
  exported: [];
}>();

const selectedIds = ref<Set<string>>(new Set());
const format = ref<ExportFormat>('pdf');
const includeComments = ref(true);
const includeImages = ref(true);
const paperSize = ref<'A4' | 'Letter'>('A4');
const headerFooter = ref(false);
const template = ref<'default' | 'minimal' | 'professional' | 'modern'>('default');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const toggleDocument = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
  // Force reactivity
  selectedIds.value = new Set(selectedIds.value);
};

const selectAll = () => {
  selectedIds.value = new Set(props.documents.map(d => d.id));
};

const deselectAll = () => {
  selectedIds.value = new Set();
};

const reset = () => {
  selectedIds.value = new Set();
  format.value = 'pdf';
  includeComments.value = true;
  includeImages.value = true;
  paperSize.value = 'A4';
  headerFooter.value = false;
  template.value = 'default';
  errorMessage.value = '';
  successMessage.value = '';
};

const close = () => {
  emit('close');
  reset();
};

const exportDocuments = async () => {
  if (selectedIds.value.size === 0) {
    errorMessage.value = 'Please select at least one document to export.';
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const options: ExportOptions = {
      includeComments: includeComments.value,
      includeImages: includeImages.value,
      template: template.value,
    };

    if (format.value === 'pdf') {
      options.paperSize = paperSize.value;
      options.headerFooter = headerFooter.value;
      options.margins = { top: 20, right: 20, bottom: 20, left: 20 };
    }

    const response = await fetch(`/api/projects/${props.projectId}/documents/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentIds: Array.from(selectedIds.value),
        format: format.value,
        options,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Batch export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `documents-${timestamp}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    successMessage.value = `${selectedIds.value.size} documents exported successfully`;
    emit('exported');

    setTimeout(() => {
      close();
    }, 1500);
  } catch (error) {
    console.error('Batch export error:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Batch export failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close();
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      window.addEventListener('keydown', onEscape);
    } else {
      window.removeEventListener('keydown', onEscape);
      reset();
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEscape);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <section class="modal-dialog" role="dialog" aria-modal="true" aria-label="Batch Export Documents">
        <header class="modal-header">
          <div>
            <h2>Batch Export Documents</h2>
            <p>Select multiple documents to export as a ZIP archive.</p>
          </div>
          <button type="button" class="close-btn" @click="close">Close</button>
        </header>

        <div class="modal-body">
          <form @submit.prevent="exportDocuments">
            <!-- Document Selection -->
            <div class="form-field">
              <div class="selection-header">
                <span class="field-label">
                  Select Documents ({{ selectedIds.size }} of {{ documents.length }})
                </span>
                <div class="selection-actions">
                  <button type="button" @click="selectAll" class="action-link">Select all</button>
                  <button type="button" @click="deselectAll" class="action-link">Clear</button>
                </div>
              </div>

              <div class="document-list">
                <label
                  v-for="doc in documents"
                  :key="doc.id"
                  class="document-item"
                >
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(doc.id)"
                    @change="toggleDocument(doc.id)"
                  />
                  <span>{{ doc.title }}</span>
                </label>
              </div>
            </div>

            <!-- Format Selection -->
            <div class="form-field">
              <span class="field-label">Export Format</span>
              <div class="radio-group-compact">
                <label class="radio-compact">
                  <input v-model="format" type="radio" value="pdf" name="format" />
                  <span>PDF</span>
                </label>
                <label class="radio-compact">
                  <input v-model="format" type="radio" value="docx" name="format" />
                  <span>Word</span>
                </label>
                <label class="radio-compact">
                  <input v-model="format" type="radio" value="markdown" name="format" />
                  <span>Markdown</span>
                </label>
              </div>
            </div>

            <!-- Template Selection (PDF only) -->
            <div v-if="format === 'pdf'" class="form-field">
              <span class="field-label">Style Template</span>
              <select v-model="template" class="field-select">
                <option value="default">Default</option>
                <option value="minimal">Minimal</option>
                <option value="professional">Professional</option>
                <option value="modern">Modern</option>
              </select>
            </div>

            <!-- Options -->
            <div class="form-field">
              <span class="field-label">Options</span>
              <div class="checkbox-group">
                <label class="checkbox-option">
                  <input v-model="includeComments" type="checkbox" />
                  <span>Include comments</span>
                </label>
                <label class="checkbox-option">
                  <input v-model="includeImages" type="checkbox" />
                  <span>Include images</span>
                </label>
              </div>
            </div>

            <!-- PDF Options -->
            <div v-if="format === 'pdf'" class="form-field">
              <span class="field-label">PDF Options</span>
              <div class="pdf-options">
                <label class="form-field-inline">
                  <span class="field-label-inline">Paper Size</span>
                  <select v-model="paperSize" class="field-select">
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                  </select>
                </label>
                <label class="checkbox-option">
                  <input v-model="headerFooter" type="checkbox" />
                  <span>Include header & footer</span>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <PrimaryButton
                :label="`Export ${selectedIds.size} document${selectedIds.size !== 1 ? 's' : ''}`"
                :loading="loading"
                :disabled="selectedIds.size === 0"
                @click="exportDocuments"
              />
              <button type="button" class="cancel-btn" @click="close">
                Cancel
              </button>
            </div>
          </form>

          <p v-if="successMessage" class="message success">{{ successMessage }}</p>
          <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-6);
}

.modal-dialog {
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

.modal-header p {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.close-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: transparent;
  border: none;
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.close-btn:hover {
  color: var(--color-text);
}

.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-field-inline {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.field-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-label-inline {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  min-width: 80px;
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.selection-actions {
  display: flex;
  gap: var(--space-3);
}

.action-link {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  transition: color var(--transition-fast);
}

.action-link:hover {
  color: var(--color-text);
}

.document-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  background: var(--color-bg-surface);
}

.document-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.document-item:hover {
  background: var(--color-bg-hover);
}

.document-item input[type="checkbox"] {
  cursor: pointer;
}

.document-item span {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
}

.radio-group-compact {
  display: flex;
  gap: var(--space-3);
}

.radio-compact {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.radio-compact:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.radio-compact input[type="radio"] {
  cursor: pointer;
}

.radio-compact span {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  cursor: pointer;
}

.checkbox-option input[type="checkbox"] {
  cursor: pointer;
}

.checkbox-option span {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
}

.pdf-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.field-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
}

.field-select:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.cancel-btn {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.cancel-btn:hover {
  background: var(--color-bg-hover);
}

.message {
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
}

.message.success {
  background: rgba(34, 197, 94, 0.1);
  color: rgb(34, 197, 94);
}

.message.error {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}
</style>
