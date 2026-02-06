<script setup lang="ts">
const route = useRoute();
const api = useWorkbenchApi();

const projectId = computed(() => route.params.id as string);
const loading = ref(true);
const tasks = ref<Array<{ id: string; status: string; due_date?: string | null }>>([]);

const STATUS_ORDER = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'];

const statusSummary = computed(() => {
  return STATUS_ORDER.map((status) => ({
    status,
    count: tasks.value.filter((task) => task.status === status).length
  }));
});

const overdueCount = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return tasks.value.filter((task) => task.due_date && task.due_date < today && task.status !== 'done' && task.status !== 'cancelled').length;
});

const load = async () => {
  loading.value = true;

  try {
    const response = await api.get<{ data: typeof tasks.value }>(`/api/projects/${projectId.value}/tasks`);
    tasks.value = response.data;
  } finally {
    loading.value = false;
  }
};

watch(projectId, load, { immediate: true });
</script>

<template>
  <section>
    <header>
      <div>
        <h1>Tasks</h1>
        <p>Choose the best lens for planning, execution, and due-date management.</p>
      </div>

      <div>
        <span>{{ tasks.length }} total</span>
        <span>{{ overdueCount }} overdue</span>
      </div>
    </header>

    <p v-if="loading">Loading task summary...</p>

    <template v-else>
      <section>
        <NuxtLink :to="`/projects/${projectId}/tasks/list`">
          <h2>List view</h2>
          <p>Bulk edits, filtering, and tabular control for operational triage.</p>
        </NuxtLink>

        <NuxtLink :to="`/projects/${projectId}/tasks/kanban`">
          <h2>Kanban view</h2>
          <p>Status flow management with drag and drop across workflow stages.</p>
        </NuxtLink>

        <NuxtLink :to="`/projects/${projectId}/tasks/calendar`">
          <h2>Calendar view</h2>
          <p>Due-date scheduling and deadline balancing for unscheduled work.</p>
        </NuxtLink>
      </section>

      <section>
        <h2>Status distribution</h2>
        <div>
          <article v-for="item in statusSummary" :key="item.status">
            <TaskPill kind="status" :value="item.status" />
            <strong>{{ item.count }}</strong>
          </article>
        </div>
      </section>
    </template>
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
  gap: var(--space-4);
}

header > div:last-child span {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
}

header > div:last-child span:last-child {
  color: var(--color-priority-urgent);
}

section > p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

section > section:first-of-type {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-10);
}

section > section:first-of-type a {
  display: block;
  padding: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

section > section:first-of-type a:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

section > section:first-of-type h2 {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

section > section:first-of-type p {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

section > section:last-of-type {
  margin-top: var(--space-8);
}

section > section:last-of-type h2 {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-4);
}

section > section:last-of-type > div {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

section > section:last-of-type article {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

section > section:last-of-type article strong {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
</style>
