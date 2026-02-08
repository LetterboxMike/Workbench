<script setup lang="ts">
const route = useRoute();
const api = useWorkbenchApi();

const projectId = computed(() => route.params.id as string);
const loading = ref(true);
const creating = ref(false);
const showBatchExportModal = ref(false);
const documents = ref<
  Array<{
    id: string;
    title: string;
    updated_at: string;
    parent_document_id?: string | null;
    tags?: string[];
  }>
>([]);

const parentTitles = computed(() => {
  const lookup = new Map<string, string>();

  for (const document of documents.value) {
    lookup.set(document.id, document.title);
  }

  return lookup;
});

const loadDocuments = async () => {
  loading.value = true;

  try {
    const response = await api.get<{ data: { flat: typeof documents.value } }>(`/api/projects/${projectId.value}/documents`);
    documents.value = response.data.flat;
  } finally {
    loading.value = false;
  }
};

const createDocument = async () => {
  if (creating.value) {
    return;
  }

  creating.value = true;

  try {
    const created = await api.post<{ data: { id: string } }>(`/api/projects/${projectId.value}/documents`, {
      title: 'Untitled document'
    });

    await navigateTo(`/projects/${projectId.value}/documents/${created.data.id}`);
  } finally {
    creating.value = false;
  }
};

watch(projectId, loadDocuments, { immediate: true });
</script>

<template>
  <section>
    <header>
      <div>
        <h1>Documents</h1>
        <p>Create, browse, and open project documentation without leaving the project context.</p>
      </div>

      <div>
        <span>{{ documents.length }} docs</span>
        <button type="button" class="batch-export-btn" :disabled="documents.length === 0" @click="showBatchExportModal = true">Batch Export</button>
        <button type="button" :disabled="creating" @click="createDocument">{{ creating ? 'Creating...' : 'New document' }}</button>
      </div>
    </header>

    <section>
      <p v-if="loading">Loading documents...</p>

      <div v-else-if="documents.length">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Parent</th>
              <th>Updated</th>
              <th>Tags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="document in documents" :key="document.id">
              <td>
                <strong>{{ document.title }}</strong>
              </td>
              <td>
                <span>{{ document.parent_document_id ? parentTitles.get(document.parent_document_id) || 'Nested' : 'Top level' }}</span>
              </td>
              <td>
                <span>{{ new Date(document.updated_at).toLocaleString() }}</span>
              </td>
              <td>
                <div>
                  <span v-for="tag in document.tags || []" :key="tag">{{ tag }}</span>
                  <span v-if="!document.tags?.length">No tags</span>
                </div>
              </td>
              <td>
                <NuxtLink :to="`/projects/${projectId}/documents/${document.id}`">Open</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else>No documents yet. Create your first document to start linking knowledge with tasks.</p>
    </section>

    <BatchExportModal
      :open="showBatchExportModal"
      :project-id="projectId"
      :documents="documents"
      @close="showBatchExportModal = false"
      @exported="showBatchExportModal = false"
    />
  </section>
</template>

<style scoped>
section {
  max-width: var(--content-max-width);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

header h1 {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

header > div:first-child p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
}

header > div:last-child {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

header > div:last-child span {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

header > div:last-child button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-bg);
  background: var(--color-text);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

header > div:last-child .batch-export-btn {
  color: var(--color-text-secondary);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
}

header > div:last-child .batch-export-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

header > div:last-child button:hover:not(:disabled) {
  opacity: 0.9;
}

header > div:last-child button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

section > section p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  border-bottom: 1px solid var(--color-border);
}

th {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
  padding: var(--space-3) var(--space-4);
}

tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

tbody tr:hover {
  background: var(--color-bg-hover);
}

td {
  padding: var(--space-4);
  vertical-align: middle;
}

td strong {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

td span {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

td > div {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

td > div > span {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-surface);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-xs);
}

td a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

td a:hover {
  color: var(--color-text);
}
</style>
