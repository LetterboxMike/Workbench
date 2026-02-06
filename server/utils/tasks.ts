import type { Task } from '~/types/domain';

interface TaskFilters {
  status?: string;
  assignee_id?: string;
  priority?: string;
  due_date?: string;
  tags?: string[];
  source_document_id?: string;
  q?: string;
}

export const filterTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) {
      return false;
    }

    if (filters.assignee_id && task.assignee_id !== filters.assignee_id) {
      return false;
    }

    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }

    if (filters.due_date && task.due_date !== filters.due_date) {
      return false;
    }

    if (filters.source_document_id && task.source_document_id !== filters.source_document_id) {
      return false;
    }

    if (filters.tags?.length) {
      const containsAll = filters.tags.every((tag) => task.tags.includes(tag));

      if (!containsAll) {
        return false;
      }
    }

    if (filters.q) {
      const haystack = `${task.title} ${task.description || ''}`.toLowerCase();

      if (!haystack.includes(filters.q.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
};

export const sortTasks = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    const dueA = a.due_date || '9999-12-31';
    const dueB = b.due_date || '9999-12-31';

    if (dueA !== dueB) {
      return dueA.localeCompare(dueB);
    }

    return b.updated_at.localeCompare(a.updated_at);
  });
};