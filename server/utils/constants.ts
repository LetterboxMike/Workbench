import type { TaskPriority, TaskStatus } from '~/types/domain';

export const TASK_STATUSES: TaskStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
  'cancelled'
];

export const TASK_PRIORITIES: TaskPriority[] = ['none', 'low', 'medium', 'high', 'urgent'];

export const PROJECT_ROLES = ['admin', 'editor', 'viewer'] as const;
export const COMMENT_TARGET_TYPES = ['document', 'task', 'block'] as const;

export const isTaskStatus = (value: unknown): value is TaskStatus => {
  return typeof value === 'string' && TASK_STATUSES.includes(value as TaskStatus);
};

export const isTaskPriority = (value: unknown): value is TaskPriority => {
  return typeof value === 'string' && TASK_PRIORITIES.includes(value as TaskPriority);
};
