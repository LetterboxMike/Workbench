import { createError, defineEventHandler, getQuery } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getCurrentUser,
  getCurrentUserDb,
  getSystemRole,
  useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = typeof query.q === 'string' ? query.q.trim().toLowerCase() : '';
  const projectId = typeof query.project_id === 'string' ? query.project_id : null;
  const includeAll = query.include_all === '1' || query.include_all === 'true';

  if (!q) {
    throw createError({ statusCode: 400, statusMessage: 'q is required.' });
  }

  const useDb = useDbAuth();

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    const activeOrgId = await getActiveOrgIdForUserDb(event, user.id);

    if (projectId) {
      // Search within a specific project
      await assertProjectAccessDb(projectId, user.id, 'viewer');
      const results = await db.search.search(q, { project_id: projectId, limit: 20 });
      return { data: results };
    }

    // Get all projects user has access to
    const orgMemberships = await db.orgMembers.getUserOrgs(user.id);
    const superAdminOrgIds = new Set(
      orgMemberships.filter((m) => m.system_role === 'super_admin').map((m) => m.org_id)
    );

    const accessibleProjects = await db.projects.listForUser(
      user.id,
      includeAll ? undefined : (activeOrgId || undefined)
    );

    // Also include projects from orgs where user is super_admin
    const allOrgProjects = includeAll
      ? await Promise.all(
          Array.from(superAdminOrgIds).map((orgId) => db.projects.list(orgId))
        )
      : activeOrgId && superAdminOrgIds.has(activeOrgId)
        ? [await db.projects.list(activeOrgId)]
        : [];

    const allProjectIds = new Set([
      ...accessibleProjects.map((p) => p.id),
      ...allOrgProjects.flat().map((p) => p.id)
    ]);

    // Search across all accessible projects
    const searchResults = await Promise.all(
      Array.from(allProjectIds).map((pid) =>
        db.search.search(q, { project_id: pid, limit: 20 })
      )
    );

    // Combine and deduplicate results
    const documents = searchResults.flatMap((r) => r.documents).slice(0, 20);
    const tasks = searchResults.flatMap((r) => r.tasks).slice(0, 20);
    const comments = searchResults.flatMap((r) => r.comments).slice(0, 20);

    return {
      data: {
        documents,
        tasks,
        comments
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const store = getStore();
  const activeOrgId = getActiveOrgIdForUser(event, user.id);
  const allowedProjectIds = new Set<string>();

  if (projectId) {
    assertProjectAccess(projectId, user.id, 'viewer');
    allowedProjectIds.add(projectId);
  } else {
    for (const project of store.projects) {
      if (!includeAll && activeOrgId && project.org_id !== activeOrgId) {
        continue;
      }

      const projectMember = store.project_members.some((member) => member.project_id === project.id && member.user_id === user.id);
      const superAdmin = getSystemRole(project.org_id, user.id) === 'super_admin';

      if (projectMember || superAdmin) {
        allowedProjectIds.add(project.id);
      }
    }
  }

  const documents = store.documents
    .filter((document) => allowedProjectIds.has(document.project_id))
    .filter((document) => document.title.toLowerCase().includes(q))
    .slice(0, 20);

  const tasks = store.tasks
    .filter((task) => allowedProjectIds.has(task.project_id))
    .filter((task) => `${task.title} ${task.description || ''}`.toLowerCase().includes(q))
    .slice(0, 20);

  const comments = store.comments
    .filter((comment) => {
      if (comment.target_type === 'task') {
        const task = store.tasks.find((item) => item.id === comment.target_id);
        return task ? allowedProjectIds.has(task.project_id) : false;
      }

      if (comment.target_type === 'document') {
        const document = store.documents.find((item) => item.id === comment.target_id);
        return document ? allowedProjectIds.has(document.project_id) : false;
      }

      if (comment.target_type === 'block') {
        const [documentId] = comment.target_id.split(':');
        const document = store.documents.find((item) => item.id === documentId);
        return document ? allowedProjectIds.has(document.project_id) : false;
      }

      return false;
    })
    .filter((comment) => comment.body.toLowerCase().includes(q))
    .slice(0, 20);

  return {
    data: {
      documents,
      tasks,
      comments
    }
  };
});
