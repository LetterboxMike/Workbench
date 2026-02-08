<script setup lang="ts">
import type { FileAttachmentType, ProjectFile } from '~/types/domain';

const props = defineProps<{
  open: boolean;
  projectId: string;
  attachmentType?: FileAttachmentType;
  attachmentId?: string;
}>();

const emit = defineEmits<{
  close: [];
  uploaded: [file: ProjectFile];
}>();

const api = useWorkbenchApi();

const dragOver = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const error = ref('');
const selectedFile = ref<File | null>(null);
const description = ref('');

const fileInputRef = ref<HTMLInputElement | null>(null);

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  return '📁';
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  dragOver.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  dragOver.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  dragOver.value = false;
  
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    selectFile(files[0]);
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectFile(target.files[0]);
  }
};

const selectFile = (file: File) => {
  error.value = '';
  
  // Validate file size (25MB max)
  if (file.size > 25 * 1024 * 1024) {
    error.value = 'File size exceeds 25MB limit.';
    return;
  }
  
  selectedFile.value = file;
};

const clearSelection = () => {
  selectedFile.value = null;
  description.value = '';
  error.value = '';
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const uploadFile = async () => {
  if (!selectedFile.value) return;
  
  uploading.value = true;
  uploadProgress.value = 0;
  error.value = '';
  
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('attachment_type', props.attachmentType || 'project');
    if (props.attachmentId) {
      formData.append('attachment_id', props.attachmentId);
    }
    if (description.value.trim()) {
      formData.append('description', description.value.trim());
    }
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 100);
    
    const response = await $fetch<{ data: ProjectFile }>(`/api/projects/${props.projectId}/files`, {
      method: 'POST',
      body: formData
    });
    
    clearInterval(progressInterval);
    uploadProgress.value = 100;
    
    setTimeout(() => {
      emit('uploaded', response.data);
      handleClose();
    }, 300);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload failed. Please try again.';
    uploadProgress.value = 0;
  } finally {
    uploading.value = false;
  }
};

const handleClose = () => {
  if (!uploading.value) {
    clearSelection();
    emit('close');
  }
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click.self="handleClose">
        <div class="modal-container">
          <header class="modal-header">
            <h2>Upload File</h2>
            <button class="close-btn" @click="handleClose" :disabled="uploading">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </header>
          
          <div class="modal-body">
            <!-- Drop Zone -->
            <div
              v-if="!selectedFile"
              class="drop-zone"
              :class="{ 'drag-over': dragOver }"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @drop="handleDrop"
              @click="triggerFileInput"
            >
              <div class="drop-zone-content">
                <div class="upload-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4V22M16 4L10 10M16 4L22 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M4 22V26C4 27.1 4.9 28 6 28H26C27.1 28 28 27.1 28 26V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <p class="drop-text">Drop file here or <span>browse</span></p>
                <p class="drop-hint">Maximum file size: 25MB</p>
              </div>
              
              <input
                ref="fileInputRef"
                type="file"
                class="file-input"
                @change="handleFileSelect"
              />
            </div>
            
            <!-- Selected File Preview -->
            <div v-else class="selected-file">
              <div class="file-preview">
                <span class="file-icon">{{ getFileIcon(selectedFile.type) }}</span>
                <div class="file-info">
                  <p class="file-name">{{ selectedFile.name }}</p>
                  <p class="file-meta">{{ formatFileSize(selectedFile.size) }} • {{ selectedFile.type || 'Unknown type' }}</p>
                </div>
                <button class="remove-btn" @click="clearSelection" :disabled="uploading">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
              
              <!-- Description Input -->
              <div class="description-field">
                <label for="file-description">Description (optional)</label>
                <input
                  id="file-description"
                  v-model="description"
                  type="text"
                  placeholder="Add a description for this file..."
                  :disabled="uploading"
                />
              </div>
              
              <!-- Upload Progress -->
              <div v-if="uploading" class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${uploadProgress}%` }" />
                </div>
                <span class="progress-text">{{ uploadProgress }}%</span>
              </div>
            </div>
            
            <!-- Error Message -->
            <p v-if="error" class="error-message">{{ error }}</p>
          </div>
          
          <footer class="modal-footer">
            <button class="cancel-btn" @click="handleClose" :disabled="uploading">
              Cancel
            </button>
            <button
              class="upload-btn"
              :disabled="!selectedFile || uploading"
              @click="uploadFile"
            >
              <span v-if="uploading">Uploading...</span>
              <span v-else>Upload File</span>
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.close-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.modal-body {
  padding: var(--space-6);
}

/* Drop Zone */
.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-10);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: var(--color-text-secondary);
  background: var(--color-bg-surface);
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.upload-icon {
  color: var(--color-text-tertiary);
}

.drop-text {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
}

.drop-text span {
  color: var(--color-text);
  font-weight: 500;
  text-decoration: underline;
}

.drop-hint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

/* Selected File */
.selected-file {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.file-preview {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.file-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.remove-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-priority-urgent);
}

/* Description Field */
.description-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.description-field label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.description-field input {
  width: 100%;
  padding: var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.description-field input:focus {
  outline: none;
  border-color: var(--color-text-secondary);
}

.description-field input::placeholder {
  color: var(--color-text-tertiary);
}

/* Progress */
.progress-container {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-bg-surface);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.progress-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  min-width: 36px;
  text-align: right;
}

/* Error */
.error-message {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-priority-urgent);
  padding: var(--space-3);
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-sm);
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

.cancel-btn {
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cancel-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.upload-btn {
  padding: var(--space-2) var(--space-5);
  background: var(--color-text);
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-bg);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.upload-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(-10px);
}
</style>
