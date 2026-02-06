import { createError } from 'h3';
import { assertProjectAccess, assertProjectAccessDb } from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import type { Document } from '~/types/domain';

export const getDocumentWithAccess = (documentId: string, userId: string, minimumRole: 'viewer' | 'editor' | 'admin' = 'viewer') => {
  const store = getStore();
  const document = store.documents.find((item) => item.id === documentId);

  if (!document) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found.' });
  }

  assertProjectAccess(document.project_id, userId, minimumRole);

  return document;
};

// Database-backed version for Supabase mode
export const getDocumentWithAccessDb = async (
  documentId: string,
  userId: string,
  minimumRole: 'viewer' | 'editor' | 'admin' = 'viewer'
): Promise<Document> => {
  const document = await db.documents.get(documentId);

  if (!document) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found.' });
  }

  await assertProjectAccessDb(document.project_id, userId, minimumRole);

  return document;
};