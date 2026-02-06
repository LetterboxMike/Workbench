import { createError } from 'h3';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export const resolveTargetProjectId = (targetType: string, targetId: string): string => {
  const store = getStore();

  if (targetType === 'document') {
    const document = store.documents.find((item) => item.id === targetId);

    if (!document) {
      throw createError({ statusCode: 404, statusMessage: 'Document target not found.' });
    }

    return document.project_id;
  }

  if (targetType === 'task') {
    const task = store.tasks.find((item) => item.id === targetId);

    if (!task) {
      throw createError({ statusCode: 404, statusMessage: 'Task target not found.' });
    }

    return task.project_id;
  }

  if (targetType === 'block') {
    const [documentId] = targetId.split(':');
    const document = store.documents.find((item) => item.id === documentId);

    if (!document) {
      throw createError({ statusCode: 404, statusMessage: 'Block target document not found.' });
    }

    return document.project_id;
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid target type.' });
};

export const resolveTargetProjectIdDb = async (targetType: string, targetId: string): Promise<string> => {
  if (targetType === 'document') {
    const document = await db.documents.get(targetId);

    if (!document) {
      throw createError({ statusCode: 404, statusMessage: 'Document target not found.' });
    }

    return document.project_id;
  }

  if (targetType === 'task') {
    const task = await db.tasks.get(targetId);

    if (!task) {
      throw createError({ statusCode: 404, statusMessage: 'Task target not found.' });
    }

    return task.project_id;
  }

  if (targetType === 'block') {
    const [documentId] = targetId.split(':');
    const document = await db.documents.get(documentId!);

    if (!document) {
      throw createError({ statusCode: 404, statusMessage: 'Block target document not found.' });
    }

    return document.project_id;
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid target type.' });
};