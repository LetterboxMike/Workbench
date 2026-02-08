<script setup lang="ts">
interface SearchResultState {
  documents: Array<{ id: string; title: string; project_id: string }>;
  tasks: Array<{ id: string; title: string; project_id: string }>;
  comments: Array<{ id: string; body: string; target_type: string; target_id: string }>;
}

const props = defineProps<{
  open: boolean;
  projectId?: string | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const api = useWorkbenchApi();
const inputRef = ref<HTMLInputElement | null>(null);
const query = ref('');
const loading = ref(false);
const results = ref<SearchResultState>({
  documents: [],
  tasks: [],
  comments: []
});

let timer: ReturnType<typeof setTimeout> | null = null;
let lastRequestId = 0;

const hasResults = computed(() => results.value.documents.length + results.value.tasks.length + results.value.comments.length > 0);

const reset = () => {
  query.value = '';
  loading.value = false;
  results.value = {
    documents: [],
    tasks: [],
    comments: []
  };
};

const close = () => {
  emit('close');
  reset();
};

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close();
  }
};

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      window.removeEventListener('keydown', onEscape);
      reset();
      return;
    }

    window.addEventListener('keydown', onEscape);
    await nextTick();
    inputRef.value?.focus();
  }
);

watch(query, (value) => {
  if (timer) {
    clearTimeout(timer);
  }

  if (!value.trim()) {
    lastRequestId += 1;
    loading.value = false;
    results.value = {
      documents: [],
      tasks: [],
      comments: []
    };
    return;
  }

  timer = setTimeout(async () => {
    const requestId = ++lastRequestId;
    loading.value = true;

    try {
      const response = await api.get<{ data: SearchResultState }>(
        `/api/search?q=${encodeURIComponent(value)}${props.projectId ? `&project_id=${props.projectId}` : ''}`
      );

      if (requestId === lastRequestId) {
        results.value = response.data;
      }
    } finally {
      if (requestId === lastRequestId) {
        loading.value = false;
      }
    }
  }, 220);
});

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer);
  }

  window.removeEventListener('keydown', onEscape);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" @click.self="close">
      <section role="dialog" aria-modal="true" aria-label="Search">
        <header>
          <div>
            <h2>Search workspace</h2>
            <p>Find documents, tasks, and comments with one query.</p>
          </div>
          <button type="button" @click="close">Close</button>
        </header>

        <div>
          <input ref="inputRef" v-model="query" placeholder="Type to search..." />
        </div>

        <div>
          <p v-if="!query.trim()">Start typing to search across the current workspace scope.</p>
          <p v-else-if="loading">Searching...</p>

          <template v-else>
            <section>
              <div>
                <h3>Documents</h3>
                <span>{{ results.documents.length }}</span>
              </div>
              <NuxtLink
                v-for="document in results.documents"
                :key="document.id"
                :to="`/projects/${document.project_id}/documents/${document.id}`"

                @click="close"
              >
                <strong>{{ document.title }}</strong>
                <span>Document</span>
              </NuxtLink>
              <p v-if="results.documents.length === 0">No document matches.</p>
            </section>

            <section>
              <div>
                <h3>Tasks</h3>
                <span>{{ results.tasks.length }}</span>
              </div>
              <NuxtLink
                v-for="task in results.tasks"
                :key="task.id"
                :to="`/projects/${task.project_id}/tasks/list`"

                @click="close"
              >
                <strong>{{ task.title }}</strong>
                <span>Task</span>
              </NuxtLink>
              <p v-if="results.tasks.length === 0">No task matches.</p>
            </section>

            <section>
              <div>
                <h3>Comments</h3>
                <span>{{ results.comments.length }}</span>
              </div>
              <article v-for="comment in results.comments" :key="comment.id">
                <strong>{{ comment.body }}</strong>
                <span>{{ comment.target_type }}</span>
              </article>
              <p v-if="results.comments.length === 0">No comment matches.</p>
            </section>

            <p v-if="!hasResults">No matches found. Try a shorter keyword or remove filters.</p>
          </template>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
/* Modal backdrop */
div:first-child {
  position: fixed;
  inset: 0;
  background: rgba(22, 22, 22, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 120px;
  z-index: 1000;
}

/* Modal dialog */
section[role="dialog"] {
  width: 100%;
  max-width: 600px;
  max-height: calc(100vh - 200px);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Header */
header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

header > div h2 {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

header > div p {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
}

header button {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: transparent;
  border: none;
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  transition: color var(--transition-fast);
}

header button:hover {
  color: var(--color-text);
}

/* Search input */
section[role="dialog"] > div:nth-child(2) {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

section[role="dialog"] > div:nth-child(2) input {
  width: 100%;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  outline: none;
}

section[role="dialog"] > div:nth-child(2) input:focus {
  border-color: var(--color-border-strong);
}

section[role="dialog"] > div:nth-child(2) input::placeholder {
  color: var(--color-text-tertiary);
}

/* Results container */
section[role="dialog"] > div:last-child {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-6);
}

section[role="dialog"] > div:last-child > p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  text-align: center;
  padding: var(--space-6) 0;
}

/* Result sections */
section[role="dialog"] > div:last-child > section {
  margin-bottom: var(--space-6);
}

section[role="dialog"] > div:last-child > section:last-child {
  margin-bottom: 0;
}

section[role="dialog"] > div:last-child > section > div:first-child {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

section[role="dialog"] > div:last-child > section > div:first-child h3 {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

section[role="dialog"] > div:last-child > section > div:first-child span {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-surface);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-xs);
}

/* Result items (links) */
section[role="dialog"] > div:last-child > section > a {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  margin: 0 calc(-1 * var(--space-4));
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

section[role="dialog"] > div:last-child > section > a:hover {
  background: var(--color-bg-hover);
}

section[role="dialog"] > div:last-child > section > a strong {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

section[role="dialog"] > div:last-child > section > a span {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* Result items (articles - for comments) */
section[role="dialog"] > div:last-child > section > article {
  padding: var(--space-3) var(--space-4);
  margin: 0 calc(-1 * var(--space-4));
  border-radius: var(--radius-sm);
}

section[role="dialog"] > div:last-child > section > article strong {
  display: block;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

section[role="dialog"] > div:last-child > section > article span {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* Empty state in sections */
section[role="dialog"] > div:last-child > section > p {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding: var(--space-2) 0;
}
</style>
