<script setup lang="ts">
const api = useWorkbenchApi();
const loading = ref(true);
const notifications = ref<
  Array<{
    id: string;
    title: string;
    body?: string | null;
    link?: string | null;
    read_at?: string | null;
    created_at: string;
  }>
>([]);

const unreadCount = computed(() => notifications.value.filter((item) => !item.read_at).length);

const load = async () => {
  loading.value = true;

  try {
    const response = await api.get<{ data: typeof notifications.value }>('/api/notifications');
    notifications.value = response.data;
  } finally {
    loading.value = false;
  }
};

const markRead = async (id: string) => {
  await api.patch(`/api/notifications/${id}/read`);
  await load();
};

const markAllRead = async () => {
  if (unreadCount.value === 0) {
    return;
  }

  await api.post('/api/notifications/read-all');
  await load();
};

onMounted(load);
</script>

<template>
  <section>
    <header>
      <div>
        <h1>Notifications</h1>
        <p>Mentions, assignments, and updates from projects you can access.</p>
      </div>

      <div>
        <span>{{ unreadCount }} unread</span>
        <button type="button" :disabled="unreadCount === 0" @click="markAllRead">Mark all read</button>
      </div>
    </header>

    <p v-if="loading">Loading notifications...</p>

    <section v-else>
      <article v-for="item in notifications" :key="item.id">
        <div>
          <h2>{{ item.title }}</h2>
          <p v-if="item.body">{{ item.body }}</p>
        </div>

        <div>
          <span>{{ new Date(item.created_at).toLocaleString() }}</span>
          <div>
            <NuxtLink v-if="item.link" :to="item.link">Open</NuxtLink>
            <button v-if="!item.read_at" type="button" @click="markRead(item.id)">Mark read</button>
          </div>
        </div>
      </article>

      <p v-if="notifications.length === 0">You are all caught up. New activity will appear here.</p>
    </section>
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
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

header > div:last-child button:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

header > div:last-child button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

section > p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

article {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

article:hover {
  background: var(--color-bg-hover);
}

article > div:first-child h2 {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

article > div:first-child p {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
}

article > div:last-child {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  flex-shrink: 0;
}

article > div:last-child span {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

article > div:last-child > div {
  display: flex;
  gap: var(--space-3);
}

article > div:last-child a {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

article > div:last-child a:hover {
  color: var(--color-text);
}

article > div:last-child button {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color var(--transition-fast);
}

article > div:last-child button:hover {
  color: var(--color-text);
}

section > section > p {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
  text-align: center;
}
</style>
