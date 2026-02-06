import { createError, defineEventHandler } from 'h3';
import { getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { getDocumentWithAccess, getDocumentWithAccessDb } from '~/server/utils/documents';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { nowIso } from '~/server/utils/id';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const documentId = event.context.params?.id;

  if (!documentId) {
    throw createError({ statusCode: 400, statusMessage: 'Document id is required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    const document = await getDocumentWithAccessDb(documentId, user.id, 'editor');

    // Archive document and all children recursively
    const queue = [document.id];
    const archivedIds: string[] = [];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = await db.documents.get(currentId);

      if (!current || current.project_id !== document.project_id || current.is_archived) {
        continue;
      }

      await db.documents.update(current.id, { is_archived: true });
      archivedIds.push(current.id);

      // Find children
      const children = await db.documents.getChildren(current.id);
      for (const child of children) {
        queue.push(child.id);
      }
    }

    const project = await db.projects.get(document.project_id);

    if (project) {
      await logActivityDb({
        orgId: project.org_id,
        projectId: project.id,
        actorId: user.id,
        action: 'archived',
        targetType: 'document',
        targetId: document.id,
        metadata: {
          archived_count: archivedIds.length
        }
      });
    }

    return {
      data: {
        archived: true,
        id: document.id,
        archived_ids: archivedIds
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const document = getDocumentWithAccess(documentId, user.id, 'editor');
  const store = getStore();
  const timestamp = nowIso();
  const queue = [document.id];
  const archivedIds: string[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = store.documents.find((item) => item.id === currentId && item.project_id === document.project_id);

    if (!current || current.is_archived) {
      continue;
    }

    current.is_archived = true;
    current.updated_at = timestamp;
    archivedIds.push(current.id);

    for (const child of store.documents) {
      if (child.parent_document_id === current.id) {
        queue.push(child.id);
      }
    }
  }

  const project = store.projects.find((item) => item.id === document.project_id);

  if (project) {
    logActivity({
      orgId: project.org_id,
      projectId: project.id,
      actorId: user.id,
      action: 'archived',
      targetType: 'document',
      targetId: document.id,
      metadata: {
        archived_count: archivedIds.length
      }
    });
  }

  return {
    data: {
      archived: true,
      id: document.id,
      archived_ids: archivedIds
    }
  };
});
