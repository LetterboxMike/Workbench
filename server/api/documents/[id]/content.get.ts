import { createError, defineEventHandler } from 'h3';
import { getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { getDocumentWithAccess, getDocumentWithAccessDb } from '~/server/utils/documents';
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
    await getDocumentWithAccessDb(documentId, user.id, 'viewer');

    const content = await db.documentContent.get(documentId);

    return {
      data:
        content || {
          document_id: documentId,
          yjs_state: null,
          last_snapshot: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [] }]
          },
          updated_at: new Date().toISOString()
        }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  getDocumentWithAccess(documentId, user.id, 'viewer');

  const store = getStore();
  const content = store.document_content.find((item) => item.document_id === documentId);

  return {
    data:
      content || {
        document_id: documentId,
        yjs_state: null,
        last_snapshot: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }]
        },
        updated_at: new Date().toISOString()
      }
  };
});
