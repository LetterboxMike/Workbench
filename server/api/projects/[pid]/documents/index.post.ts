import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { createId, nowIso } from '~/server/utils/id';
import { asStringArray, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import { assertCanCreateDocumentAuto } from '~/server/utils/billing';

interface CreateDocumentBody {
  title?: string;
  parent_document_id?: string | null;
  sort_order?: number;
  tags?: string[];
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.pid;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAccessDb(projectId, user.id, 'editor');

    const project = await db.projects.get(projectId);

    if (!project) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
    }

    await assertCanCreateDocumentAuto(project.org_id, projectId, true);

    const body = await readJsonBody<CreateDocumentBody>(event);
    const title = body.title?.trim() || 'Untitled';
    const parentDocumentId = body.parent_document_id || null;

    if (parentDocumentId) {
      const parent = await db.documents.get(parentDocumentId);

      if (!parent || parent.project_id !== projectId || parent.is_archived) {
        throw createError({ statusCode: 400, statusMessage: 'parent_document_id must reference an active document in this project.' });
      }
    }

    // Calculate sort_order if not provided
    let sortOrder = body.sort_order;
    if (typeof sortOrder !== 'number') {
      const siblingDocs = await db.documents.list(projectId, false);
      sortOrder = siblingDocs.filter((doc) => doc.parent_document_id === parentDocumentId).length;
    }

    const document = await db.documents.create({
      project_id: projectId,
      title,
      parent_document_id: parentDocumentId,
      created_by: user.id,
      tags: asStringArray(body.tags),
      sort_order: sortOrder
    });

    await logActivityDb({
      orgId: project.org_id,
      projectId,
      actorId: user.id,
      action: 'created',
      targetType: 'document',
      targetId: document.id,
      metadata: {
        title: document.title
      }
    });

    return {
      data: document
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAccess(projectId, user.id, 'editor');

  const store = getStore();
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  await assertCanCreateDocumentAuto(project.org_id, projectId, false);

  const body = await readJsonBody<CreateDocumentBody>(event);
  const title = body.title?.trim() || 'Untitled';
  const parentDocumentId = body.parent_document_id || null;

  if (parentDocumentId) {
    const parent = store.documents.find((item) => item.id === parentDocumentId && item.project_id === projectId && !item.is_archived);

    if (!parent) {
      throw createError({ statusCode: 400, statusMessage: 'parent_document_id must reference an active document in this project.' });
    }
  }

  const document = {
    id: createId(),
    project_id: projectId,
    parent_document_id: parentDocumentId,
    title,
    created_by: user.id,
    created_at: nowIso(),
    updated_at: nowIso(),
    sort_order:
      typeof body.sort_order === 'number'
        ? body.sort_order
        : store.documents.filter((item) => item.project_id === projectId && item.parent_document_id === parentDocumentId).length,
    is_archived: false,
    tags: asStringArray(body.tags)
  };

  store.documents.push(document);

  store.document_content.push({
    document_id: document.id,
    yjs_state: null,
    last_snapshot: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        }
      ]
    },
    updated_at: nowIso()
  });

  logActivity({
    orgId: project.org_id,
    projectId,
    actorId: user.id,
    action: 'created',
    targetType: 'document',
    targetId: document.id,
    metadata: {
      title: document.title
    }
  });

  return {
    data: document
  };
});
