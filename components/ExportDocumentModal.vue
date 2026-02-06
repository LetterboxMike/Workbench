<script setup lang="ts">
import type { ExportFormat, ExportOptions } from '~/types/domain';

const props = defineProps<{
  open: boolean;
  documentId: string;
  documentTitle: string;
}>();

const emit = defineEmits<{
  close: [];
  exported: [];
}>();

const api = useWorkbenchApi();
const format = ref<ExportFormat>('pdf');
const includeComments = ref(true);
const includeImages = ref(true);
const paperSize = ref<'A4' | 'Letter'>('A4');
const headerFooter = ref(false);
const template = ref<'default' | 'minimal' | 'professional' | 'modern'>('default');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const reset = () => {
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

const getFileExtension = (fmt: ExportFormat): string => {
  switch (fmt) {
    case 'pdf': return 'pdf';
    case 'docx': return 'docx';
    case 'markdown': return 'md';
    default: return 'pdf';
  }
};

const exportDocument = async () => {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const options: ExportOptions = {
      includeComments: includeComments.value,
      includeImages: includeImages.value,
      template: template.value,
    };

    // Add PDF-specific options
    if (format.value === 'pdf') {
      options.paperSize = paperSize.value;
      options.headerFooter = headerFooter.value;
      options.margins = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      };
    }

    // Make API call with blob response type
    const response = await fetch(`/api/documents/${props.documentId}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format: format.value,
        options,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Export failed');
    }

    // Get the blob from response
    const blob = await response.blob();

    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${props.documentTitle.replace(/[^a-z0-9]/gi, '_')}.${getFileExtension(format.value)}`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    successMessage.value = `Document exported as ${format.value.toUpperCase()}`;
    emit('exported');

    // Close modal after 1.5 seconds
    setTimeout(() => {
      close();
    }, 1500);
  } catch (error) {
    console.error('Export error:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Export failed. Please try again.';
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
      <section class="modal-dialog" role="dialog" aria-modal="true" aria-label="Export Document">
        <header class="modal-header">
          <div>
            <h2>Export Document</h2>
            <p>Download "{{ documentTitle }}" in your preferred format.</p>
          </div>
          <button type="button" class="close-btn" @click="close">Close</button>
        </header>

        <div class="modal-body">
          <form @submit.prevent="exportDocument">
            <!-- Format Selection -->
            <div class="form-field">
              <span class="field-label">Export Format</span>
              <div class="radio-group">
                <label class="radio-option">
                  <input
                    v-model="format"
                    type="radio"
                    value="pdf"
                    name="format"
                  />
                  <span>
                    <strong>PDF</strong>
                    <small>Professional, print-ready document</small>
                  </span>
                </label>
                <label class="radio-option">
                  <input
                    v-model="format"
                    type="radio"
                    value="docx"
                    name="format"
                  />
                  <span>
                    <strong>Word (DOCX)</strong>
                    <small>Editable Microsoft Word format</small>
                  </span>
                </label>
                <label class="radio-option">
                  <input
                    v-model="format"
                    type="radio"
                    value="markdown"
                    name="format"
                  />
                  <span>
                    <strong>Markdown</strong>
                    <small>Plain text with formatting syntax</small>
                  </span>
                </label>
              </div>
            </div>

            <!-- Export Template -->
            <div v-if="format === 'pdf'" class="form-field">
              <span class="field-label">Style Template</span>
              <select v-model="template" class="field-select">
                <option value="default">Default - Clean and readable</option>
                <option value="minimal">Minimal - Serif typography</option>
                <option value="professional">Professional - Corporate style</option>
                <option value="modern">Modern - Contemporary design</option>
              </select>
            </div>

            <!-- Export Options -->
            <div class="form-field">
              <span class="field-label">Options</span>
              <div class="checkbox-group">
                <label class="checkbox-option">
                  <input
                    v-model="includeComments"
                    type="checkbox"
                  />
                  <span>Include comments</span>
                </label>
                <label class="checkbox-option">
                  <input
                    v-model="includeImages"
                    type="checkbox"
                  />
                  <span>Include images</span>
                </label>
              </div>
            </div>

            <!-- PDF-Specific Options -->
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
                  <input
                    v-model="headerFooter"
                    type="checkbox"
                  />
                  <span>Include header & footer</span>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <PrimaryButton
                :label="`Export as ${format.toUpperCase()}`"
                :loading="loading"
                @click="exportDocument"
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
  max-width: 600px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
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
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
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

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.radio-option:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.radio-option input[type="radio"] {
  margin-top: 2px;
  cursor: pointer;
}

.radio-option span {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.radio-option strong {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
}

.radio-option small {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-tertiary);
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
