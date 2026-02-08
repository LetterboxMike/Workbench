<script setup lang="ts">
import type { ProjectFile } from '~/types/domain';

interface EnrichedFile extends ProjectFile {
  uploader?: { id: string; name: string; avatar_url?: string | null } | null;
}

const props = defineProps<{
  file: EnrichedFile;
  selectable?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{
  click: [];
  delete: [];
  download: [];
  select: [selected: boolean];
}>();

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? 'just now' : `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

const isImage = computed(() => props.file.mime_type.startsWith('image/'));
const thumbnailUrl = computed(() => isImage.value ? props.file.url : null);

const handleClick = () => {
  emit('click');
};

const handleDownload = (e: Event) => {
  e.stopPropagation();
  emit('download');
};

const handleDelete = (e: Event) => {
  e.stopPropagation();
  emit('delete');
};

const toggleSelect = (e: Event) => {
  e.stopPropagation();
  emit('select', !props.selected);
};
</script>

<template>
  <div class="file-item" :class="{ selected }" @click="handleClick">
    <!-- Selection Checkbox -->
    <div v-if="selectable" class="checkbox-container" @click="toggleSelect">
      <input type="checkbox" :checked="selected" @click.stop @change="toggleSelect" />
    </div>
    
    <!-- Thumbnail / Icon -->
    <div class="file-thumbnail">
      <img v-if="thumbnailUrl" :src="thumbnailUrl" :alt="file.original_filename" />
      <span v-else class="file-icon">{{ getFileIcon(file.mime_type) }}</span>
    </div>
    
    <!-- File Info -->
    <div class="file-info">
      <p class="file-name">{{ file.original_filename }}</p>
      <p class="file-meta">
        <span class="file-size">{{ formatFileSize(file.size_bytes) }}</span>
        <span class="separator">•</span>
        <span class="file-date">{{ formatDate(file.created_at) }}</span>
        <template v-if="file.uploader">
          <span class="separator">•</span>
          <span class="file-uploader">{{ file.uploader.name }}</span>
        </template>
      </p>
      <p v-if="file.description" class="file-description">{{ file.description }}</p>
    </div>
    
    <!-- Attachment Badge -->
    <div v-if="file.attachment_type !== 'project'" class="attachment-badge">
      <span v-if="file.attachment_type === 'document'">📝 Document</span>
      <span v-else-if="file.attachment_type === 'task'">✓ Task</span>
    </div>
    
    <!-- Actions -->
    <div class="file-actions">
      <a
        :href="file.url"
        :download="file.original_filename"
        class="action-btn download-btn"
        title="Download"
        @click.stop
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1V10M7 10L4 7M7 10L10 7" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M1 11V12C1 12.55 1.45 13 2 13H12C12.55 13 13 12.55 13 12V11" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
      <button class="action-btn delete-btn" title="Delete" @click="handleDelete">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 4H12M5 4V3C5 2.45 5.45 2 6 2H8C8.55 2 9 2.45 9 3V4M10.5 4V12C10.5 12.55 10.05 13 9.5 13H4.5C3.95 13 3.5 12.55 3.5 12V4" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.file-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.file-item:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.file-item.selected {
  border-color: var(--color-text-secondary);
  background: var(--color-bg-hover);
}

/* Checkbox */
.checkbox-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-container input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Thumbnail */
.file-thumbnail {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.file-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 24px;
}

/* File Info */
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
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.separator {
  opacity: 0.5;
}

.file-description {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Attachment Badge */
.attachment-badge {
  flex-shrink: 0;
}

.attachment-badge span {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
}

/* Actions */
.file-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.file-item:hover .file-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.delete-btn:hover {
  color: var(--color-priority-urgent);
  border-color: rgba(239, 68, 68, 0.3);
}

/* Mobile */
@media (max-width: 640px) {
  .file-actions {
    opacity: 1;
  }
  
  .file-meta {
    flex-wrap: wrap;
  }
}
</style>
