<script setup lang="ts">
import type { ProjectFile, FileAttachmentType } from '~/types/domain';

interface EnrichedFile extends ProjectFile {
  uploader?: { id: string; name: string; avatar_url?: string | null } | null;
}

const props = defineProps<{
  projectId: string;
  attachmentType?: FileAttachmentType;
  attachmentId?: string;
  compact?: boolean;
}>();

const emit = defineEmits<{
  fileClick: [file: EnrichedFile];
}>();

const api = useWorkbenchApi();

const loading = ref(true);
const files = ref<EnrichedFile[]>([]);
const showUploadModal = ref(false);
const showDeleteConfirm = ref(false);
const fileToDelete = ref<EnrichedFile | null>(null);
const searchQuery = ref('');
const viewMode = ref<'list' | 'grid'>('list');
const sortBy = ref<'date' | 'name' | 'size'>('date');
const filterType = ref<'all' | 'images' | 'documents' | 'media' | 'other'>('all');

// Computed filtered and sorted files
const filteredFiles = computed(() => {
  let result = [...files.value];
  
  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(f => 
      f.original_filename.toLowerCase().includes(query) ||
      f.description?.toLowerCase().includes(query)
    );
  }
  
  // Type filter
  if (filterType.value !== 'all') {
    result = result.filter(f => {
      const mime = f.mime_type;
      switch (filterType.value) {
        case 'images':
          return mime.startsWith('image/');
        case 'documents':
          return mime.includes('pdf') || mime.includes('document') || mime.includes('text') || mime.includes('spreadsheet');
        case 'media':
          return mime.startsWith('video/') || mime.startsWith('audio/');
        case 'other':
          return !mime.startsWith('image/') && !mime.startsWith('video/') && !mime.startsWith('audio/') && 
                 !mime.includes('pdf') && !mime.includes('document');
        default:
          return true;
      }
    });
  }
  
  // Sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.original_filename.localeCompare(b.original_filename);
      case 'size':
        return b.size_bytes - a.size_bytes;
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
  
  return result;
});

const totalSize = computed(() => {
  const bytes = files.value.reduce((sum, f) => sum + f.size_bytes, 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
});

const loadFiles = async () => {
  loading.value = true;
  
  try {
    let url = `/api/projects/${props.projectId}/files`;
    const params = new URLSearchParams();
    
    if (props.attachmentType) {
      params.set('attachment_type', props.attachmentType);
    }
    if (props.attachmentId) {
      params.set('attachment_id', props.attachmentId);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get<{ data: EnrichedFile[] }>(url);
    files.value = response.data;
  } catch (err) {
    console.error('Failed to load files:', err);
    files.value = [];
  } finally {
    loading.value = false;
  }
};

const handleFileUploaded = (file: ProjectFile) => {
  // Reload files to get enriched data
  loadFiles();
};

const handleFileClick = (file: EnrichedFile) => {
  emit('fileClick', file);
};

const confirmDelete = (file: EnrichedFile) => {
  fileToDelete.value = file;
  showDeleteConfirm.value = true;
};

const deleteFile = async () => {
  if (!fileToDelete.value) return;
  
  try {
    await api.delete(`/api/projects/${props.projectId}/files/${fileToDelete.value.id}`);
    files.value = files.value.filter(f => f.id !== fileToDelete.value!.id);
  } catch (err) {
    console.error('Failed to delete file:', err);
  } finally {
    showDeleteConfirm.value = false;
    fileToDelete.value = null;
  }
};

watch(() => [props.projectId, props.attachmentType, props.attachmentId], loadFiles, { immediate: true });
</script>

<template>
  <div class="file-manager" :class="{ compact }">
    <!-- Header -->
    <header v-if="!compact" class="manager-header">
      <div class="header-left">
        <h2>Files</h2>
        <span class="file-count">{{ files.length }} {{ files.length === 1 ? 'file' : 'files' }} • {{ totalSize }}</span>
      </div>
      
      <div class="header-actions">
        <button class="upload-btn" @click="showUploadModal = true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1V13M1 7H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Upload
        </button>
      </div>
    </header>
    
    <!-- Toolbar -->
    <div v-if="!compact && files.length > 0" class="toolbar">
      <!-- Search -->
      <div class="search-container">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="search-icon">
          <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.25"/>
          <path d="M10 10L13 13" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search files..."
          class="search-input"
        />
      </div>
      
      <!-- Filters -->
      <div class="filters">
        <select v-model="filterType" class="filter-select">
          <option value="all">All Types</option>
          <option value="images">Images</option>
          <option value="documents">Documents</option>
          <option value="media">Media</option>
          <option value="other">Other</option>
        </select>
        
        <select v-model="sortBy" class="filter-select">
          <option value="date">Newest First</option>
          <option value="name">Name A-Z</option>
          <option value="size">Largest First</option>
        </select>
        
        <div class="view-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            title="List View"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3H12M2 7H12M2 11H12" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
            </svg>
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            title="Grid View"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.25"/>
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.25"/>
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.25"/>
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.25"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Compact Header -->
    <header v-if="compact" class="compact-header">
      <span class="section-label">Attachments</span>
      <button class="add-btn" @click="showUploadModal = true" title="Attach file">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1V11M1 6H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </header>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span>Loading files...</span>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="files.length === 0" class="empty-state">
      <div class="empty-icon">📁</div>
      <p class="empty-text">No files yet</p>
      <p class="empty-hint">Upload files to share with your team</p>
      <button class="empty-upload-btn" @click="showUploadModal = true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1V13M1 7H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Upload File
      </button>
    </div>
    
    <!-- No Results -->
    <div v-else-if="filteredFiles.length === 0" class="empty-state">
      <p class="empty-text">No matching files</p>
      <p class="empty-hint">Try adjusting your search or filters</p>
    </div>
    
    <!-- File List -->
    <div v-else class="file-list" :class="{ 'grid-view': viewMode === 'grid' }">
      <FileListItem
        v-for="file in filteredFiles"
        :key="file.id"
        :file="file"
        @click="handleFileClick(file)"
        @delete="confirmDelete(file)"
      />
    </div>
    
    <!-- Upload Modal -->
    <FileUploadModal
      :open="showUploadModal"
      :project-id="projectId"
      :attachment-type="attachmentType"
      :attachment-id="attachmentId"
      @close="showUploadModal = false"
      @uploaded="handleFileUploaded"
    />
    
    <!-- Delete Confirmation -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteConfirm" class="confirm-backdrop" @click.self="showDeleteConfirm = false">
          <div class="confirm-dialog">
            <h3>Delete File</h3>
            <p>Are you sure you want to delete <strong>{{ fileToDelete?.original_filename }}</strong>? This action cannot be undone.</p>
            <div class="confirm-actions">
              <button class="cancel-btn" @click="showDeleteConfirm = false">Cancel</button>
              <button class="delete-btn" @click="deleteFile">Delete</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.file-manager {
  display: flex;
  flex-direction: column;
}

/* Header */
.manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.manager-header h2 {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.file-count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-text);
  color: var(--color-bg);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.upload-btn:hover {
  opacity: 0.9;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.search-container {
  flex: 1;
  max-width: 280px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3) var(--space-2) 36px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-text-secondary);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.filters {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.filter-select {
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.view-toggle {
  display: flex;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-btn:hover {
  color: var(--color-text-secondary);
}

.view-btn.active {
  background: var(--color-bg);
  color: var(--color-text);
}

/* Compact Header */
.compact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.section-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-bg-surface);
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

/* Loading State */
.loading-state {
  padding: var(--space-8);
  text-align: center;
}

.loading-state span {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-10);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.empty-text {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.empty-hint {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-5);
}

.empty-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.empty-upload-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* File List */
.file-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.file-list.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
}

/* Compact Mode */
.compact .empty-state {
  padding: var(--space-6);
}

.compact .empty-icon {
  font-size: 32px;
}

/* Confirm Dialog */
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.confirm-dialog {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  max-width: 400px;
  width: 90%;
}

.confirm-dialog h3 {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.confirm-dialog p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: var(--space-5);
}

.confirm-dialog strong {
  color: var(--color-text);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
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

.cancel-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.delete-btn {
  padding: var(--space-2) var(--space-4);
  background: #ef4444;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.delete-btn:hover {
  opacity: 0.9;
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
</style>
