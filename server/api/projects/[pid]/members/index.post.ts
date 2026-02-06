import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAdmin,
  assertProjectAdminDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { createId, nowIso } from '~/server/utils/id';
import { PROJECT_ROLES } from '~/server/utils/constants';
import { ensureString, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

interface InviteBody {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.pid;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  const body = await readJsonBody<InviteBody>(event);
  const email = ensureString(body.email, 'email').toLowerCase();

  if (!PROJECT_ROLES.includes(body.role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAdminDb(projectId, user.id);

    const project = await db.projects.get(projectId);

    if (!project) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
    }

    const existingUser = await db.users.getByEmail(email);

    if (existingUser) {
      // Check if user is already in the org, if not add them
      const existingOrgMember = await db.orgMembers.get(project.org_id, existingUser.id);
      if (!existingOrgMember) {
        await db.orgMembers.create({
          org_id: project.org_id,
          user_id: existingUser.id,
          system_role: 'member'
        });
      }

      // Check if user is already a project member
      const existingMembership = await db.projectMembers.get(projectId, existingUser.id);

      if (existingMembership) {
        // Update role
        const updatedMembership = await db.projectMembers.updateRole(projectId, existingUser.id, body.role);

        await db.notifications.create({
          user_id: existingUser.id,
          type: 'project_invite',
          title: `Role updated in ${project.name}`,
          body: `Your role was updated to ${body.role}.`,
          link: `/projects/${projectId}`
        });

        await logActivityDb({
          orgId: project.org_id,
          projectId: project.id,
          actorId: user.id,
          action: 'added',
          targetType: 'member',
          targetId: existingUser.id,
          metadata: { role: body.role }
        });

        return { data: updatedMembership };
      } else {
        // Add new membership
        const newMembership = await db.projectMembers.create({
          project_id: projectId,
          user_id: existingUser.id,
          role: body.role,
          invited_by: user.id
        });

        await db.notifications.create({
          user_id: existingUser.id,
          type: 'project_invite',
          title: `Added to ${project.name}`,
          body: `You were added as ${body.role}.`,
          link: `/projects/${projectId}`
        });

        await logActivityDb({
          orgId: project.org_id,
          projectId: project.id,
          actorId: user.id,
          action: 'added',
          targetType: 'member',
          targetId: existingUser.id,
          metadata: { role: body.role }
        });

        return { data: newMembership };
      }
    }

    // User doesn't exist, check for existing invitation
    const existingInvite = await db.invitations.getPendingByProjectAndEmail(projectId, email);

    if (existingInvite) {
      return { data: existingInvite };
    }

    // Create new invitation
    const invitation = await db.invitations.create({
      org_id: project.org_id,
      project_id: projectId,
      email,
      role: body.role,
      invited_by: user.id
    });

    await logActivityDb({
      orgId: project.org_id,
      projectId: project.id,
      actorId: user.id,
      action: 'invited',
      targetType: 'member',
      targetId: email,
      metadata: { role: body.role }
    });

    return { data: invitation };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAdmin(projectId, user.id);

  const store = getStore();
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  const existingUser = store.users.find((candidate) => candidate.email.toLowerCase() === email);

  if (existingUser) {
    if (!store.org_members.some((member) => member.org_id === project.org_id && member.user_id === existingUser.id)) {
      store.org_members.push({
        org_id: project.org_id,
        user_id: existingUser.id,
        system_role: 'member',
        created_at: nowIso()
      });
    }

    const existingMembership = store.project_members.find(
      (member) => member.project_id === projectId && member.user_id === existingUser.id
    );

    if (existingMembership) {
      existingMembership.role = body.role;
    } else {
      store.project_members.push({
        project_id: projectId,
        user_id: existingUser.id,
        role: body.role,
        invited_by: user.id,
        joined_at: nowIso()
      });
    }

    store.notifications.unshift({
      id: createId(),
      user_id: existingUser.id,
      type: 'project_invite',
      title: `Added to ${project.name}`,
      body: `You were added as ${body.role}.`,
      link: `/projects/${projectId}`,
      read_at: null,
      created_at: nowIso()
    });

    logActivity({
      orgId: project.org_id,
      projectId: project.id,
      actorId: user.id,
      action: 'added',
      targetType: 'member',
      targetId: existingUser.id,
      metadata: { role: body.role }
    });

    return {
      data:
        existingMembership ||
        store.project_members.find((member) => member.project_id === projectId && member.user_id === existingUser.id)!
    };
  }

  const existingInvite = store.invitations.find((invite) => invite.project_id === projectId && invite.email === email && !invite.accepted_at);

  if (existingInvite) {
    return {
      data: existingInvite
    };
  }

  const invitation = {
    id: createId(),
    org_id: project.org_id,
    project_id: projectId,
    email,
    role: body.role,
    invited_by: user.id,
    created_at: nowIso(),
    accepted_at: null
  };

  store.invitations.push(invitation);

  logActivity({
    orgId: project.org_id,
    projectId: project.id,
    actorId: user.id,
    action: 'invited',
    targetType: 'member',
    targetId: email,
    metadata: { role: body.role }
  });

  return {
    data: invitation
  };
});
