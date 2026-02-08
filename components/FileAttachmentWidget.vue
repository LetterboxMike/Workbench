<script setup lang="ts">
import type { ProjectFile, FileAttachmentType } from '~/types/domain';

interface EnrichedFile extends ProjectFile {
  uploader?: { id: string; name: string; avatar_url?: string | null } | null;
}

const props = defineProps<{
  projectId: string;
  attachmentType: 'document' | 'task';
  attachmentId: string;
}>();

const api = useWorkbenchApi();

const loading = ref(true);
const files = ref<EnrichedFile[]>([]);
const showUploadModal = ref(false);
const expanded = ref(true);

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
  return '📁';
};

const loadFiles = async () => {
  loading.value = true;
  
  try {
    const url = `/api/projects/${props.projectId}/files?attachment_type=${props.attachmentType}&attachment_id=${props.attachmentId}`;
    const response = await api.get<{ data: EnrichedFile[] }>(url);
    files.value = response.data;
  } catch (err) {
    console.error('Failed to load attachments:', err);
    files.value = [];
  } finally {
    loading.value = false;
  }
};

const handleFileUploaded = (file: ProjectFile) => {
  loadFiles();
};

const deleteFile = async (file: EnrichedFile) => {
  if (!confirm(`Delete "${file.original_filename}"?`)) return;
  
  try {
    await api.delete(`/api/projects/${props.projectId}/files/${file.id}`);
    files.value = files.value.filter(f => f.id !== file.id);
  } catch (err) {
    console.error('Failed to delete file:', err);
  }
};

watch(() => [props.projectId, props.attachmentType, props.attachmentId], loadFiles, { immediate: true });
</script>

<template>
  <div class="attachment-widget">
    <button class="widget-header" @click="expanded = !expanded">
      <svg
        class="chevron"
        :class="{ expanded }"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="widget-title">Attachments</span>
      <span v-if="files.length > 0" class="file-count">{{ files.length }}</span>
      <button 
        class="add-btn" 
        @click.stop="showUploadModal = true"
        title="Attach file"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1V11M1 6H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </button>
    
    <Transition name="expand">
      <div v-if="expanded" class="widget-content">
        <div v-if="loading" class="loading">Loading...</div>
        
        <div v-else-if="files.length === 0" class="empty-state">
          <p>No files attached</p>
          <button class="attach-btn" @click="showUploadModal = true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1V11M1 6H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Attach file
          </button>
        </div>
        
        <div v-else class="file-list">
          <div v-for="file in files" :key="file.id" class="file-item">
            <a :href="file.url" :download="file.original_filename" class="file-link">
              <span class="file-icon">{{ getFileIcon(file.mime_type) }}</span>
              <div class="file-info">
                <span class="file-name">{{ file.original_filename }}</span>
                <span class="file-size">{{ formatFileSize(file.size_bytes) }}</span>
              </div>
            </a>
            <button class="delete-btn" @click="deleteFile(file)" title="Delete">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2L10 10M2 10L10 2" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
    
    <FileUploadModal
      :open="showUploadModal"
      :project-id="projectId"
      :attachment-type="attachmentType"
      :attachment-id="attachmentId"
      @close="showUploadModal = false"
      @uploaded="handleFileUploaded"
    />
  </div>
</template>

<style scoped>
.attachment-widget {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.widget-header:hover {
  background: var(--color-bg-hover);
}

.chevron {
  color: var(--color-text-tertiary);
  transition: transform var(--transition-fast);
}

.chevron.expanded {
  transform: rotate(90deg);
}

.widget-title {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.file-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--space-1);
  background: var(--color-bg);
  border-radius: 9px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.add-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.add-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.widget-content {
  border-top: 1px solid var(--color-border);
  padding: var(--space-3);
}

.loading {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: center;
  padding: var(--space-3);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
}

.empty-state p {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.attach-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.attach-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  border-color: var(--color-border-strong);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.file-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.file-item:hover {
  background: var(--color-bg-hover);
}

.file-link {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
  min-width: 0;
}

.file-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.file-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.file-name {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  opacity: 0;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.file-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--color-bg);
  color: var(--color-priority-urgent);
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
