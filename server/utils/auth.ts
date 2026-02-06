import type { H3Event } from 'h3';
import { createError, deleteCookie, getCookie, getHeader, setCookie } from 'h3';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import type { OrgMember, Organization, ProjectRole, SystemRole, User } from '~/types/domain';
import { createId, nowIso } from '~/server/utils/id';
import { getDefaultUserId, getStore } from '~/server/utils/store';
import { getSupabaseAnonClient } from '~/server/utils/supabase';
import { db, dbOrgMembers, dbOrganizations, dbProjectMembers, dbProjects, dbUsers, dbInvitations } from '~/server/utils/db';

const roleRank: Record<ProjectRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3
};

const SESSION_COOKIE = 'wb_session';
const ACTIVE_ORG_COOKIE = 'wb_active_org';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthMode = 'disabled' | 'local' | 'supabase';

const isTrueFlag = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizeName = (authUser: Pick<SupabaseAuthUser, 'email' | 'user_metadata'>): string => {
  const metadataName = typeof authUser.user_metadata?.name === 'string' ? authUser.user_metadata.name.trim() : '';

  if (metadataName) {
    return metadataName;
  }

  if (authUser.email) {
    return authUser.email.split('@')[0] || 'User';
  }

  return 'User';
};

const slugify = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
};

const createUniqueOrgSlug = (name: string): string => {
  const store = getStore();
  const base = slugify(name) || `workspace-${createId().slice(0, 8)}`;
  let candidate = base;
  let suffix = 2;

  while (store.organizations.some((org) => org.slug === candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const createPersonalOrgName = (user: User): string => {
  const base = user.name?.trim() || user.email.split('@')[0] || 'User';
  return `${base}'s Workspace`;
};

const createOrganization = (name: string): Organization => {
  const org: Organization = {
    id: createId(),
    name: name.trim(),
    slug: createUniqueOrgSlug(name),
    created_at: nowIso()
  };

  const store = getStore();
  store.organizations.push(org);
  return org;
};

const getSessionToken = (event: H3Event): string | null => {
  const cookieToken = getCookie(event, SESSION_COOKIE);

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = getHeader(event, 'authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    return token || null;
  }

  return null;
};

const resolveDefaultOrgId = (memberships: OrgMember[]): string | null => {
  if (memberships.length === 0) {
    return null;
  }

  const superAdminMembership = memberships.find((membership) => membership.system_role === 'super_admin');
  return superAdminMembership?.org_id || memberships[0]!.org_id;
};

const getLocalSession = (token: string) => {
  const store = getStore();
  const now = Date.now();
  store.local_auth_sessions = store.local_auth_sessions.filter((session) => Date.parse(session.expires_at) > now);
  return store.local_auth_sessions.find((session) => session.token === token) || null;
};

const deleteLocalSession = (token: string): void => {
  const store = getStore();
  store.local_auth_sessions = store.local_auth_sessions.filter((session) => session.token !== token);
};

const acceptPendingInvitations = (user: User): void => {
  const store = getStore();
  const email = normalizeEmail(user.email);
  const now = nowIso();

  const pendingInvites = store.invitations.filter(
    (invite) => !invite.accepted_at && normalizeEmail(invite.email) === email
  );

  for (const invite of pendingInvites) {
    if (!store.org_members.some((member) => member.org_id === invite.org_id && member.user_id === user.id)) {
      store.org_members.push({
        org_id: invite.org_id,
        user_id: user.id,
        system_role: 'member',
        created_at: now
      });
    }

    if (!store.project_members.some((member) => member.project_id === invite.project_id && member.user_id === user.id)) {
      store.project_members.push({
        project_id: invite.project_id,
        user_id: user.id,
        role: invite.role,
        invited_by: invite.invited_by,
        joined_at: now
      });
    }

    invite.accepted_at = now;
  }
};

const ensureUserMemberships = (user: User): void => {
  const store = getStore();
  acceptPendingInvitations(user);

  const memberships = store.org_members.filter((member) => member.user_id === user.id);

  if (memberships.length > 0) {
    return;
  }

  const org = createOrganization(createPersonalOrgName(user));
  store.org_members.push({
    org_id: org.id,
    user_id: user.id,
    system_role: 'super_admin',
    created_at: nowIso()
  });
};

export const getAuthMode = (): AuthMode => {
  if (isTrueFlag(process.env.WORKBENCH_AUTH_DISABLED)) {
    return 'disabled';
  }

  return getSupabaseAnonClient() ? 'supabase' : 'local';
};

export const isSupabaseAuthEnabled = (): boolean => {
  return getAuthMode() === 'supabase';
};

export const isAuthRequired = (): boolean => {
  return getAuthMode() !== 'disabled';
};

export const setSessionCookie = (event: H3Event, token: string): void => {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  });
};

export const setActiveOrgCookie = (event: H3Event, orgId: string | null): void => {
  if (orgId) {
    setCookie(event, ACTIVE_ORG_COOKIE, orgId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS
    });
    return;
  }

  deleteCookie(event, ACTIVE_ORG_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
};

export const clearSessionCookie = (event: H3Event): void => {
  const token = getCookie(event, SESSION_COOKIE);

  if (token) {
    deleteLocalSession(token);
  }

  deleteCookie(event, SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  setActiveOrgCookie(event, null);
};

export const syncStoreUserFromAuth = (authUser: Pick<SupabaseAuthUser, 'id' | 'email' | 'user_metadata'>): User => {
  const store = getStore();
  const email = normalizeEmail(authUser.email || '');
  const name = normalizeName(authUser);
  let user = store.users.find((item) => item.id === authUser.id);

  if (!user) {
    user = {
      id: authUser.id,
      email,
      name,
      avatar_url: null,
      created_at: nowIso()
    };

    store.users.push(user);
  } else {
    user.email = email || user.email;
    user.name = name || user.name;
  }

  ensureUserMemberships(user);
  return user;
};

export const getUserByEmail = (email: string): User | null => {
  const normalized = normalizeEmail(email);
  const store = getStore();
  return store.users.find((item) => normalizeEmail(item.email) === normalized) || null;
};

export const createLocalSession = (event: H3Event, userId: string, preferredOrgId: string | null = null): string => {
  const store = getStore();
  const memberships = store.org_members.filter((member) => member.user_id === userId);
  const activeOrgId =
    (preferredOrgId && memberships.some((member) => member.org_id === preferredOrgId) ? preferredOrgId : null) ||
    resolveDefaultOrgId(memberships);

  const token = createId();
  const now = Date.now();

  store.local_auth_sessions = store.local_auth_sessions.filter(
    (session) => session.user_id !== userId || Date.parse(session.expires_at) <= now
  );

  store.local_auth_sessions.push({
    token,
    user_id: userId,
    active_org_id: activeOrgId,
    created_at: nowIso(),
    expires_at: new Date(now + SESSION_MAX_AGE_SECONDS * 1000).toISOString()
  });

  setSessionCookie(event, token);
  setActiveOrgCookie(event, activeOrgId);

  return token;
};

export const getUserOrgMemberships = (userId: string): OrgMember[] => {
  const store = getStore();
  return store.org_members.filter((member) => member.user_id === userId);
};

export const getActiveOrgIdForUser = (event: H3Event, userId: string): string | null => {
  const memberships = getUserOrgMemberships(userId);

  if (memberships.length === 0) {
    return null;
  }

  const requestedOrgId = getHeader(event, 'x-workbench-org-id') || getCookie(event, ACTIVE_ORG_COOKIE) || null;

  if (requestedOrgId && memberships.some((member) => member.org_id === requestedOrgId)) {
    return requestedOrgId;
  }

  const token = getSessionToken(event);

  if (token) {
    const session = getLocalSession(token);

    if (session?.user_id === userId && session.active_org_id && memberships.some((member) => member.org_id === session.active_org_id)) {
      return session.active_org_id;
    }
  }

  return resolveDefaultOrgId(memberships);
};

export const setActiveOrgForSession = (event: H3Event, userId: string, orgId: string): void => {
  const memberships = getUserOrgMemberships(userId);

  if (!memberships.some((member) => member.org_id === orgId)) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this organization.' });
  }

  const token = getSessionToken(event);

  if (token) {
    const session = getLocalSession(token);

    if (session && session.user_id === userId) {
      session.active_org_id = orgId;
    }
  }

  setActiveOrgCookie(event, orgId);
};

export const createOrganizationForUser = (userId: string, name: string, asSuperAdmin = true): Organization => {
  const store = getStore();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw createError({ statusCode: 400, statusMessage: 'Organization name is required.' });
  }

  const org = createOrganization(trimmedName);

  store.org_members.push({
    org_id: org.id,
    user_id: userId,
    system_role: asSuperAdmin ? 'super_admin' : 'member',
    created_at: nowIso()
  });

  return org;
};

export const getCurrentUser = async (event: H3Event): Promise<User> => {
  const authMode = getAuthMode();

  if (authMode === 'disabled') {
    const store = getStore();
    const demoUser = store.users.find((item) => item.id === getDefaultUserId());

    if (!demoUser) {
      throw createError({ statusCode: 401, statusMessage: 'User not found.' });
    }

    return demoUser;
  }

  if (authMode === 'supabase') {
    const supabaseClient = getSupabaseAnonClient();

    if (!supabaseClient) {
      throw createError({ statusCode: 500, statusMessage: 'Supabase auth client unavailable.' });
    }

    const token = getSessionToken(event);

    if (!token) {
      throw createError({ statusCode: 401, statusMessage: 'Sign in required.' });
    }

    const { data, error } = await supabaseClient.auth.getUser(token);

    if (error || !data.user) {
      clearSessionCookie(event);
      throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session.' });
    }

    const user = syncStoreUserFromAuth(data.user);
    const activeOrgId = getActiveOrgIdForUser(event, user.id);
    setActiveOrgCookie(event, activeOrgId);
    return user;
  }

  const token = getSessionToken(event);

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in required.' });
  }

  const session = getLocalSession(token);

  if (!session) {
    clearSessionCookie(event);
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session.' });
  }

  const store = getStore();
  const user = store.users.find((item) => item.id === session.user_id);

  if (!user) {
    clearSessionCookie(event);
    throw createError({ statusCode: 401, statusMessage: 'User not found.' });
  }

  ensureUserMemberships(user);

  const memberships = getUserOrgMemberships(user.id);
  const resolvedOrgId =
    (session.active_org_id && memberships.some((membership) => membership.org_id === session.active_org_id) ? session.active_org_id : null) ||
    resolveDefaultOrgId(memberships);

  session.active_org_id = resolvedOrgId;
  setActiveOrgCookie(event, resolvedOrgId);

  return user;
};

export const getSystemRole = (orgId: string, userId: string): SystemRole | null => {
  const store = getStore();
  return store.org_members.find((member) => member.org_id === orgId && member.user_id === userId)?.system_role || null;
};

export const getProjectRole = (projectId: string, userId: string): ProjectRole | null => {
  const store = getStore();
  return store.project_members.find((member) => member.project_id === projectId && member.user_id === userId)?.role || null;
};

export const assertOrgMembership = (orgId: string, userId: string): void => {
  const role = getSystemRole(orgId, userId);

  if (!role) {
    throw createError({ statusCode: 403, statusMessage: 'Organization membership required.' });
  }
};

export const assertProjectAccess = (
  projectId: string,
  userId: string,
  minimumRole: ProjectRole = 'viewer'
): void => {
  const store = getStore();
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  const systemRole = getSystemRole(project.org_id, userId);

  if (systemRole === 'super_admin') {
    return;
  }

  const projectRole = getProjectRole(projectId, userId);

  if (!projectRole || roleRank[projectRole] < roleRank[minimumRole]) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient project permissions.' });
  }
};

export const assertOrgSuperAdmin = (orgId: string, userId: string): void => {
  const role = getSystemRole(orgId, userId);

  if (role !== 'super_admin') {
    throw createError({ statusCode: 403, statusMessage: 'Super admin access required.' });
  }
};

export const assertProjectAdmin = (projectId: string, userId: string): void => {
  assertProjectAccess(projectId, userId, 'admin');
};

// ============================================================================
// DATABASE-BACKED FUNCTIONS (for Supabase mode)
// ============================================================================

const createUniqueOrgSlugDb = async (name: string): Promise<string> => {
  const base = slugify(name) || `workspace-${createId().slice(0, 8)}`;
  let candidate = base;
  let suffix = 2;

  while (await dbOrganizations.getBySlug(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const createPersonalOrgNameDb = (user: User): string => {
  const base = user.name?.trim() || user.email.split('@')[0] || 'User';
  return `${base}'s Workspace`;
};

const acceptPendingInvitationsDb = async (user: User): Promise<void> => {
  const pendingInvites = await dbInvitations.getByEmail(user.email);

  for (const invite of pendingInvites) {
    // Add user to org if not already a member
    const existingOrgMember = await dbOrgMembers.get(invite.org_id, user.id);
    if (!existingOrgMember) {
      await dbOrgMembers.create({
        org_id: invite.org_id,
        user_id: user.id,
        system_role: 'member'
      });
    }

    // Add user to project if not already a member
    const existingProjectMember = await dbProjectMembers.get(invite.project_id, user.id);
    if (!existingProjectMember) {
      await dbProjectMembers.create({
        project_id: invite.project_id,
        user_id: user.id,
        role: invite.role,
        invited_by: invite.invited_by
      });
    }

    // Mark invitation as accepted
    await dbInvitations.accept(invite.id);
  }
};

const ensureUserMembershipsDb = async (user: User): Promise<void> => {
  await acceptPendingInvitationsDb(user);

  const memberships = await dbOrgMembers.getUserOrgs(user.id);

  if (memberships.length > 0) {
    return;
  }

  // Create a personal workspace for the user
  const orgName = createPersonalOrgNameDb(user);
  const orgSlug = await createUniqueOrgSlugDb(orgName);
  const org = await dbOrganizations.create({ name: orgName, slug: orgSlug });

  await dbOrgMembers.create({
    org_id: org.id,
    user_id: user.id,
    system_role: 'super_admin'
  });
};

export const syncUserFromAuthDb = async (authUser: Pick<SupabaseAuthUser, 'id' | 'email' | 'user_metadata'>): Promise<User> => {
  const email = normalizeEmail(authUser.email || '');
  const name = normalizeName(authUser);

  let user = await dbUsers.get(authUser.id);

  if (!user) {
    // User should be created by the Supabase trigger, but if not, create here
    try {
      user = await dbUsers.create({
        id: authUser.id,
        email,
        name,
        avatar_url: null
      });
    } catch (err) {
      // User might have been created by trigger in the meantime
      user = await dbUsers.get(authUser.id);
      if (!user) throw err;
    }
  }

  await ensureUserMembershipsDb(user);
  return user;
};

export const getUserOrgMembershipsDb = async (userId: string): Promise<(OrgMember & { organization: Organization })[]> => {
  return dbOrgMembers.getUserOrgs(userId);
};

export const getActiveOrgIdForUserDb = async (event: H3Event, userId: string): Promise<string | null> => {
  const memberships = await dbOrgMembers.getUserOrgs(userId);

  if (memberships.length === 0) {
    return null;
  }

  const requestedOrgId = getHeader(event, 'x-workbench-org-id') || getCookie(event, ACTIVE_ORG_COOKIE) || null;

  if (requestedOrgId && memberships.some((member) => member.org_id === requestedOrgId)) {
    return requestedOrgId;
  }

  // Return first super_admin org, or first org
  const superAdminMembership = memberships.find((m) => m.system_role === 'super_admin');
  return superAdminMembership?.org_id || memberships[0]?.org_id || null;
};

export const setActiveOrgForSessionDb = async (event: H3Event, userId: string, orgId: string): Promise<void> => {
  const memberships = await dbOrgMembers.getUserOrgs(userId);

  if (!memberships.some((member) => member.org_id === orgId)) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this organization.' });
  }

  setActiveOrgCookie(event, orgId);
};

export const createOrganizationForUserDb = async (userId: string, name: string, asSuperAdmin = true): Promise<Organization> => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw createError({ statusCode: 400, statusMessage: 'Organization name is required.' });
  }

  const slug = await createUniqueOrgSlugDb(trimmedName);
  const org = await dbOrganizations.create({ name: trimmedName, slug });

  await dbOrgMembers.create({
    org_id: org.id,
    user_id: userId,
    system_role: asSuperAdmin ? 'super_admin' : 'member'
  });

  return org;
};

export const getCurrentUserDb = async (event: H3Event): Promise<User> => {
  const authMode = getAuthMode();

  if (authMode === 'disabled') {
    const store = getStore();
    const demoUser = store.users.find((item) => item.id === getDefaultUserId());

    if (!demoUser) {
      throw createError({ statusCode: 401, statusMessage: 'User not found.' });
    }

    return demoUser;
  }

  if (authMode !== 'supabase') {
    // Fall back to store-based auth for local mode
    return getCurrentUser(event);
  }

  const supabaseClient = getSupabaseAnonClient();

  if (!supabaseClient) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase auth client unavailable.' });
  }

  const token = getSessionToken(event);

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in required.' });
  }

  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data.user) {
    clearSessionCookie(event);
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session.' });
  }

  const user = await syncUserFromAuthDb(data.user);
  const activeOrgId = await getActiveOrgIdForUserDb(event, user.id);
  setActiveOrgCookie(event, activeOrgId);

  return user;
};

export const getSystemRoleDb = async (orgId: string, userId: string): Promise<SystemRole | null> => {
  const member = await dbOrgMembers.get(orgId, userId);
  return member?.system_role || null;
};

export const getProjectRoleDb = async (projectId: string, userId: string): Promise<ProjectRole | null> => {
  const member = await dbProjectMembers.get(projectId, userId);
  return member?.role || null;
};

export const assertOrgMembershipDb = async (orgId: string, userId: string): Promise<void> => {
  const role = await getSystemRoleDb(orgId, userId);

  if (!role) {
    throw createError({ statusCode: 403, statusMessage: 'Organization membership required.' });
  }
};

export const assertProjectAccessDb = async (
  projectId: string,
  userId: string,
  minimumRole: ProjectRole = 'viewer'
): Promise<void> => {
  const project = await dbProjects.get(projectId);

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  const systemRole = await getSystemRoleDb(project.org_id, userId);

  if (systemRole === 'super_admin') {
    return;
  }

  const projectRole = await getProjectRoleDb(projectId, userId);

  if (!projectRole || roleRank[projectRole] < roleRank[minimumRole]) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient project permissions.' });
  }
};

export const assertOrgSuperAdminDb = async (orgId: string, userId: string): Promise<void> => {
  const role = await getSystemRoleDb(orgId, userId);

  if (role !== 'super_admin') {
    throw createError({ statusCode: 403, statusMessage: 'Super admin access required.' });
  }
};

export const assertProjectAdminDb = async (projectId: string, userId: string): Promise<void> => {
  await assertProjectAccessDb(projectId, userId, 'admin');
};

// Helper to check if we should use DB functions
export const useDbAuth = (): boolean => {
  return getAuthMode() === 'supabase';
};
