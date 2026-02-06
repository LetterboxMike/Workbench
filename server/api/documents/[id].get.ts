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
    const document = await getDocumentWithAccessDb(documentId, user.id, 'viewer');
    const content = await db.documentContent.get(document.id);

    return {
      data: {
        ...document,
        has_content: !!content
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const document = getDocumentWithAccess(documentId, user.id, 'viewer');
  const store = getStore();

  return {
    data: {
      ...document,
      has_content: !!store.document_content.find((item) => item.document_id === document.id)
    }
  };
});
