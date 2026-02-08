<script setup lang="ts">
import type { ProjectFile } from '~/types/domain';

interface EnrichedFile extends ProjectFile {
  uploader?: { id: string; name: string; avatar_url?: string | null } | null;
}

const route = useRoute();
const projectId = computed(() => route.params.id as string);

const selectedFile = ref<EnrichedFile | null>(null);
const showPreview = ref(false);

const handleFileClick = (file: EnrichedFile) => {
  // Open preview for images, or download for other files
  if (file.mime_type.startsWith('image/') || file.mime_type === 'application/pdf') {
    selectedFile.value = file;
    showPreview.value = true;
  } else {
    // Trigger download
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.original_filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const closePreview = () => {
  showPreview.value = false;
  selectedFile.value = null;
};
</script>

<template>
  <section class="files-page">
    <FileManager
      :project-id="projectId"
      @file-click="handleFileClick"
    />
    
    <!-- File Preview Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPreview && selectedFile" class="preview-backdrop" @click.self="closePreview">
          <div class="preview-container">
            <header class="preview-header">
              <div class="preview-title">
                <h3>{{ selectedFile.original_filename }}</h3>
                <span class="preview-size">{{ (selectedFile.size_bytes / 1024).toFixed(1) }} KB</span>
              </div>
              <div class="preview-actions">
                <a
                  :href="selectedFile.url"
                  :download="selectedFile.original_filename"
                  class="download-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1V10M7 10L4 7M7 10L10 7" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M1 11V12C1 12.55 1.45 13 2 13H12C12.55 13 13 12.55 13 12V11" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Download
                </a>
                <button class="close-btn" @click="closePreview">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </header>
            
            <div class="preview-content">
              <img
                v-if="selectedFile.mime_type.startsWith('image/')"
                :src="selectedFile.url"
                :alt="selectedFile.original_filename"
                class="preview-image"
              />
              <iframe
                v-else-if="selectedFile.mime_type === 'application/pdf'"
                :src="selectedFile.url"
                class="preview-pdf"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.files-page {
  max-width: var(--content-max-width);
  padding: var(--space-8);
}

/* Preview Modal */
.preview-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-6);
}

.preview-container {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.preview-title {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.preview-title h3 {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.preview-size {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.download-btn:hover {
  background: var(--color-bg-hover);
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

.close-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  overflow: auto;
  background: var(--color-bg-surface);
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius-sm);
}

.preview-pdf {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: none;
  border-radius: var(--radius-sm);
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

.modal-enter-active .preview-container,
.modal-leave-active .preview-container {
  transition: transform 0.2s ease;
}

.modal-enter-from .preview-container,
.modal-leave-to .preview-container {
  transform: scale(0.95);
}
</style>
