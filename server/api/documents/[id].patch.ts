import { createError, defineEventHandler } from 'h3';
import { getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { getDocumentWithAccess, getDocumentWithAccessDb } from '~/server/utils/documents';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { nowIso } from '~/server/utils/id';
import { asStringArray, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

interface UpdateDocumentBody {
  title?: string;
  parent_document_id?: string | null;
  sort_order?: number;
  tags?: string[];
  is_archived?: boolean;
}

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
    const body = await readJsonBody<UpdateDocumentBody>(event);

    const updates: Parameters<typeof db.documents.update>[1] = {};

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim();
    }

    if (body.parent_document_id !== undefined) {
      const nextParentId = body.parent_document_id || null;

      if (nextParentId === document.id) {
        throw createError({ statusCode: 400, statusMessage: 'A document cannot be its own parent.' });
      }

      if (nextParentId) {
        const parent = await db.documents.get(nextParentId);

        if (!parent || parent.project_id !== document.project_id || parent.is_archived) {
          throw createError({
            statusCode: 400,
            statusMessage: 'parent_document_id must reference an active document in the same project.'
          });
        }

        // Check for cycles
        let cursorId: string | null = nextParentId;
        while (cursorId) {
          if (cursorId === document.id) {
            throw createError({ statusCode: 400, statusMessage: 'parent_document_id would create a cycle.' });
          }

          const cursor = await db.documents.get(cursorId);
          cursorId = cursor?.parent_document_id || null;
        }
      }

      updates.parent_document_id = nextParentId;
    }

    if (typeof body.sort_order === 'number') {
      updates.sort_order = body.sort_order;
    }

    if (body.is_archived !== undefined) {
      updates.is_archived = !!body.is_archived;
    }

    if (body.tags !== undefined) {
      updates.tags = asStringArray(body.tags);
    }

    const updatedDocument = await db.documents.update(documentId, updates);

    const project = await db.projects.get(document.project_id);

    if (project) {
      await logActivityDb({
        orgId: project.org_id,
        projectId: project.id,
        actorId: user.id,
        action: 'updated',
        targetType: 'document',
        targetId: document.id,
        metadata: {
          title: updatedDocument.title
        }
      });
    }

    return {
      data: updatedDocument
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const document = getDocumentWithAccess(documentId, user.id, 'editor');
  const store = getStore();
  const body = await readJsonBody<UpdateDocumentBody>(event);

  if (typeof body.title === 'string' && body.title.trim()) {
    document.title = body.title.trim();
  }

  if (body.parent_document_id !== undefined) {
    const nextParentId = body.parent_document_id || null;

    if (nextParentId === document.id) {
      throw createError({ statusCode: 400, statusMessage: 'A document cannot be its own parent.' });
    }

    if (nextParentId) {
      const parent = store.documents.find((item) => item.id === nextParentId);

      if (!parent || parent.project_id !== document.project_id || parent.is_archived) {
        throw createError({
          statusCode: 400,
          statusMessage: 'parent_document_id must reference an active document in the same project.'
        });
      }

      let cursorId: string | null = nextParentId;
      while (cursorId) {
        if (cursorId === document.id) {
          throw createError({ statusCode: 400, statusMessage: 'parent_document_id would create a cycle.' });
        }

        const cursor = store.documents.find((item) => item.id === cursorId);
        cursorId = cursor?.parent_document_id || null;
      }
    }

    document.parent_document_id = nextParentId;
  }

  if (typeof body.sort_order === 'number') {
    document.sort_order = body.sort_order;
  }

  if (body.is_archived !== undefined) {
    document.is_archived = !!body.is_archived;
  }

  if (body.tags !== undefined) {
    document.tags = asStringArray(body.tags);
  }

  document.updated_at = nowIso();

  const project = store.projects.find((item) => item.id === document.project_id);

  if (project) {
    logActivity({
      orgId: project.org_id,
      projectId: project.id,
      actorId: user.id,
      action: 'updated',
      targetType: 'document',
      targetId: document.id,
      metadata: {
        title: document.title
      }
    });
  }

  return {
    data: document
  };
});
