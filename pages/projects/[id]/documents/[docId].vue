<script setup lang="ts">
const route = useRoute();
const api = useWorkbenchApi();

const projectId = computed(() => route.params.id as string);
const documentId = computed(() => route.params.docId as string);
const loading = ref(true);
const saveMessage = ref('');
const errorMessage = ref('');

const documentMeta = ref<{ id: string; title: string; tags: string[] } | null>(null);
const content = ref<Record<string, unknown>>({
  type: 'doc',
  content: [{ type: 'paragraph', content: [] }]
});

const linkedTasks = ref<Array<{ id: string; title: string; status: string; priority: string }>>([]);
const showLinkedTasks = ref(false);
const showFilePanel = ref(false);
const attachedFilesCount = ref(0);

const load = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [metaResponse, contentResponse, taskResponse, filesResponse] = await Promise.all([
      api.get<{ data: { id: string; title: string; tags: string[] } }>(`/api/documents/${documentId.value}`),
      api.get<{ data: { last_snapshot: Record<string, unknown> } }>(`/api/documents/${documentId.value}/content`),
      api.get<{ data: Array<{ id: string; title: string; status: string; priority: string }> }>(
        `/api/projects/${projectId.value}/tasks?source_document_id=${documentId.value}`
      ),
      api.get<{ data: Array<{ id: string }> }>(
        `/api/projects/${projectId.value}/files?attachment_type=document&attachment_id=${documentId.value}`
      )
    ]);

    documentMeta.value = metaResponse.data;
    content.value = contentResponse.data.last_snapshot;
    linkedTasks.value = taskResponse.data;
    attachedFilesCount.value = filesResponse.data.length;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load document.';
  } finally {
    loading.value = false;
  }
};

const renameDocument = async () => {
  if (!documentMeta.value) {
    return;
  }

  await api.patch(`/api/documents/${documentId.value}`, {
    title: documentMeta.value.title
  });
};

const refreshLinkedTasks = async () => {
  const taskResponse = await api.get<{ data: Array<{ id: string; title: string; status: string; priority: string }> }>(
    `/api/projects/${projectId.value}/tasks?source_document_id=${documentId.value}`
  );
  linkedTasks.value = taskResponse.data;
};

watch([projectId, documentId], load, { immediate: true });
</script>

<template>
  <section>
    <p v-if="loading">Loading document...</p>

    <template v-else>
      <header v-if="documentMeta">
        <div>
          <NuxtLink :to="`/projects/${projectId}/documents`">Back to documents</NuxtLink>
          <input v-model="documentMeta.title" @blur="renameDocument" @keyup.enter="renameDocument" />
          <div>
            <span v-for="tag in documentMeta.tags" :key="tag">{{ tag }}</span>
            <span v-if="!documentMeta.tags.length">No tags</span>
            <span>{{ saveMessage || 'Autosave active' }}</span>
          </div>
        </div>

        <div>
          <button @click="showLinkedTasks = true" class="tasks-btn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M2 7h10M2 10.5h7" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
            </svg>
            Tasks
            <span v-if="linkedTasks.length" class="task-count">{{ linkedTasks.length }}</span>
          </button>
          <button @click="showFilePanel = true" class="tasks-btn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12.5 6.5l-5.5 5.5a3.5 3.5 0 0 1-5-5l5.5-5.5a2.5 2.5 0 0 1 3.5 3.5l-5.5 5.5a1.5 1.5 0 0 1-2-2l5-5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
            </svg>
            Files
            <span v-if="attachedFilesCount > 0" class="task-count">{{ attachedFilesCount }}</span>
          </button>
        </div>
      </header>

      <p v-if="errorMessage">{{ errorMessage }}</p>

      <article class="editor-container">
        <ClientOnly>
          <DocumentEditor
            :document-id="documentId"
            :project-id="projectId"
            :initial-content="content"
            @saved="(stamp: string) => (saveMessage = `Saved ${stamp}`)"
            @error="(message: string) => (errorMessage = message)"
          />
        </ClientOnly>
      </article>
    </template>



    <LinkedTasksPanel
      :open="showLinkedTasks"
      :project-id="projectId"
      :document-id="documentId"
      :linked-tasks="linkedTasks"
      @close="showLinkedTasks = false"
      @task-created="refreshLinkedTasks"
    />

    <!-- File Attachments Panel -->
    <Teleport to="body">
      <Transition name="slide">
        <div v-if="showFilePanel" class="file-panel-backdrop" @click.self="showFilePanel = false">
          <aside class="file-panel">
            <header class="panel-header">
              <h3>Document Files</h3>
              <button class="close-btn" @click="showFilePanel = false">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </header>
            <div class="panel-content">
              <FileManager
                :project-id="projectId"
                attachment-type="document"
                :attachment-id="documentId"
                compact
              />
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
section {
  max-width: var(--content-max-width);
}

section > p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

header > div:first-child {
  flex: 1;
}

header > div:first-child a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  min-width: 44px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  text-decoration: none;
  margin-bottom: var(--space-2);
  transition: color var(--transition-fast);
}

header > div:first-child a:hover {
  color: var(--color-text-secondary);
}

header > div:first-child input {
  display: block;
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  background: transparent;
  border: none;
  padding: 0;
  margin-bottom: var(--space-2);
  outline: none;
}

header > div:first-child input:focus {
  outline: none;
}

header > div:first-child > div {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

header > div:first-child > div > span {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-surface);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-xs);
}

header > div:last-child {
  display: flex;
  gap: var(--space-2);
}

/* Tasks button with counter */
.tasks-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tasks-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.tasks-btn svg {
  flex-shrink: 0;
}

.task-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-bg);
  background: var(--color-text-secondary);
  border-radius: 9px;
  padding: 0 var(--space-1);
}

/* Full-width editor container */
.editor-container {
  min-height: 500px;
  padding: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

/* File Panel Slide-over */
.file-panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
}

.file-panel {
  width: 400px;
  max-width: 100%;
  height: 100%;
  background: var(--color-bg);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

/* Slide transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.slide-enter-from .file-panel,
.slide-leave-to .file-panel {
  transform: translateX(100%);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
</style>
