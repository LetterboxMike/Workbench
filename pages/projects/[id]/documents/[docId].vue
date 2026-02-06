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
const taskDraft = ref('');
const showExportModal = ref(false);

const load = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [metaResponse, contentResponse, taskResponse] = await Promise.all([
      api.get<{ data: { id: string; title: string; tags: string[] } }>(`/api/documents/${documentId.value}`),
      api.get<{ data: { last_snapshot: Record<string, unknown> } }>(`/api/documents/${documentId.value}/content`),
      api.get<{ data: Array<{ id: string; title: string; status: string; priority: string }> }>(
        `/api/projects/${projectId.value}/tasks?source_document_id=${documentId.value}`
      )
    ]);

    documentMeta.value = metaResponse.data;
    content.value = contentResponse.data.last_snapshot;
    linkedTasks.value = taskResponse.data;
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

const createTask = async () => {
  const title = taskDraft.value.trim();

  if (!title) {
    return;
  }

  await api.post(`/api/projects/${projectId.value}/tasks`, {
    title,
    source_document_id: documentId.value
  });

  taskDraft.value = '';
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
          <NuxtLink :to="`/projects/${projectId}/tasks/list`">Task list</NuxtLink>
          <NuxtLink :to="`/projects/${projectId}/tasks/kanban`">Kanban</NuxtLink>
          <button @click="showExportModal = true" class="export-btn">Export</button>
        </div>
      </header>

      <p v-if="errorMessage">{{ errorMessage }}</p>

      <div>
        <article>
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

        <aside>
          <h3>Linked tasks</h3>
          <p>Tasks created here appear in every task view for this project.</p>

          <form @submit.prevent="createTask">
            <input v-model="taskDraft" placeholder="Create linked task" />
            <button type="submit">Add</button>
          </form>

          <div v-if="linkedTasks.length">
            <article v-for="task in linkedTasks" :key="task.id">
              <strong>{{ task.title }}</strong>
              <div>
                <TaskPill kind="status" :value="task.status" />
                <TaskPill kind="priority" :value="task.priority" />
              </div>
            </article>
          </div>

          <p v-else>No linked tasks yet.</p>

          <NuxtLink :to="`/projects/${projectId}/tasks/list`">Open full task list</NuxtLink>
        </aside>
      </div>
    </template>

    <ExportDocumentModal
      :open="showExportModal"
      :document-id="documentId"
      :document-title="documentMeta?.title || 'Untitled'"
      @close="showExportModal = false"
      @exported="showExportModal = false"
    />
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
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

header > div:first-child {
  flex: 1;
}

header > div:first-child a {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  text-decoration: none;
  margin-bottom: var(--space-3);
  transition: color var(--transition-fast);
}

header > div:first-child a:hover {
  color: var(--color-text-secondary);
}

header > div:first-child input {
  display: block;
  width: 100%;
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  background: transparent;
  border: none;
  padding: 0;
  margin-bottom: var(--space-3);
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

header > div:last-child a {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast), color var(--transition-fast);
}

header > div:last-child a:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.export-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.export-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

section > div {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-8);
}

article {
  min-height: 400px;
  padding: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

aside {
  padding: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  height: fit-content;
}

aside h3 {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

aside > p {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

aside form {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

aside form input {
  flex: 1;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  outline: none;
}

aside form input:focus {
  border-color: var(--color-border-strong);
}

aside form input::placeholder {
  color: var(--color-text-tertiary);
}

aside form button {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-bg);
  background: var(--color-text);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

aside form button:hover {
  opacity: 0.9;
}

aside > div {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

aside > div > article {
  min-height: auto;
  padding: var(--space-3);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

aside > div > article strong {
  display: block;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

aside > div > article > div {
  display: flex;
  gap: var(--space-2);
}

aside > a {
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

aside > a:hover {
  color: var(--color-text);
}
</style>
