import { createError, defineEventHandler } from 'h3';
import { getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { getDocumentWithAccess, getDocumentWithAccessDb } from '~/server/utils/documents';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { nowIso } from '~/server/utils/id';
import { readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

interface UpdateDocumentContentBody {
  yjs_state?: string | null;
  last_snapshot?: Record<string, unknown>;
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
    const body = await readJsonBody<UpdateDocumentContentBody>(event);

    const contentUpdates: Parameters<typeof db.documentContent.upsert>[0] = {
      document_id: documentId
    };

    if (body.yjs_state !== undefined) {
      contentUpdates.yjs_state = body.yjs_state;
    }

    if (body.last_snapshot && typeof body.last_snapshot === 'object') {
      contentUpdates.last_snapshot = body.last_snapshot;
    }

    const content = await db.documentContent.upsert(contentUpdates);

    // Update document's updated_at timestamp
    await db.documents.update(documentId, {});

    const project = await db.projects.get(document.project_id);

    if (project) {
      await logActivityDb({
        orgId: project.org_id,
        projectId: project.id,
        actorId: user.id,
        action: 'content_updated',
        targetType: 'document',
        targetId: document.id,
        metadata: {
          has_yjs: !!content.yjs_state
        }
      });
    }

    return {
      data: content
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const document = getDocumentWithAccess(documentId, user.id, 'editor');
  const body = await readJsonBody<UpdateDocumentContentBody>(event);
  const store = getStore();
  let content = store.document_content.find((item) => item.document_id === documentId);

  if (!content) {
    content = {
      document_id: documentId,
      yjs_state: null,
      last_snapshot: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [] }]
      },
      updated_at: nowIso()
    };

    store.document_content.push(content);
  }

  if (body.yjs_state !== undefined) {
    content.yjs_state = body.yjs_state;
  }

  if (body.last_snapshot && typeof body.last_snapshot === 'object') {
    content.last_snapshot = body.last_snapshot;
  }

  content.updated_at = nowIso();
  document.updated_at = nowIso();

  const project = store.projects.find((item) => item.id === document.project_id);

  if (project) {
    logActivity({
      orgId: project.org_id,
      projectId: project.id,
      actorId: user.id,
      action: 'content_updated',
      targetType: 'document',
      targetId: document.id,
      metadata: {
        has_yjs: !!content.yjs_state
      }
    });
  }

  return {
    data: content
  };
});
