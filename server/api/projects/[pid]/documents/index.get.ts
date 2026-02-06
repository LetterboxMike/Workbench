import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import type { Document } from '~/types/domain';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

interface DocumentNode extends Document {
  children: DocumentNode[];
}

const buildTree = (documents: Document[]): DocumentNode[] => {
  const byParent = new Map<string | null, Document[]>();
  const byId = new Map<string, Document>();

  for (const document of documents) {
    byId.set(document.id, document);
    const key = document.parent_document_id || null;
    const list = byParent.get(key) || [];
    list.push(document);
    byParent.set(key, list);
  }

  const build = (parentId: string | null, seen: Set<string>): DocumentNode[] => {
    const siblings = (byParent.get(parentId) || []).sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

    return siblings.map((document) => {
      if (seen.has(document.id)) {
        return {
          ...document,
          children: []
        };
      }

      const nextSeen = new Set(seen);
      nextSeen.add(document.id);

      return {
        ...document,
        children: build(document.id, nextSeen)
      };
    });
  };

  const roots = documents
    .filter((document) => !document.parent_document_id || !byId.has(document.parent_document_id))
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

  return roots.map((root) => ({
    ...root,
    children: build(root.id, new Set([root.id]))
  }));
};

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.pid;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAccessDb(projectId, user.id, 'viewer');

    const documents = await db.documents.list(projectId, false);
    const sortedDocs = documents.sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

    return {
      data: {
        tree: buildTree(sortedDocs),
        flat: sortedDocs
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAccess(projectId, user.id, 'viewer');

  const store = getStore();
  const documents = store.documents
    .filter((item) => item.project_id === projectId && !item.is_archived)
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

  return {
    data: {
      tree: buildTree(documents),
      flat: documents
    }
  };
});
