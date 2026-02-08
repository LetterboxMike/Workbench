import { createError, defineEventHandler } from 'h3';
import {
  assertOrgSuperAdmin,
  assertOrgSuperAdminDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { readJsonBody } from '~/server/utils/request';
import { createMagicLinkAuto } from '~/server/utils/magic-links';
import { logActivityAuto } from '~/server/utils/activity';
import { assertCanInviteOrgMemberAuto } from '~/server/utils/billing';
import type { SystemRole } from '~/types/domain';

interface InviteMemberBody {
  email: string;
  system_role: SystemRole;
}

export default defineEventHandler(async (event) => {
  const isDb = useDbAuth();
  const user = isDb ? await getCurrentUserDb(event) : await getCurrentUser(event);
  const orgId = event.context.params?.id;

  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization id is required.' });
  }

  // Verify super admin permission
  if (isDb) {
    await assertOrgSuperAdminDb(orgId, user.id);
  } else {
    assertOrgSuperAdmin(orgId, user.id);
  }

  await assertCanInviteOrgMemberAuto(orgId, isDb);

  const body = await readJsonBody<InviteMemberBody>(event);
  const email = body.email.trim().toLowerCase();
  const systemRole = body.system_role;

  // Validate role
  if (!['super_admin', 'member'].includes(systemRole)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid system_role.' });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email address.' });
  }

  // Create magic link
  const magicLink = await createMagicLinkAuto(orgId, email, systemRole, user.id);

  // Generate full URL
  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl || process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:4000';
  const inviteUrl = `${baseUrl}/invite/${magicLink.token}`;

  // Log activity
  await logActivityAuto({
    orgId,
    actorId: user.id,
    action: 'invited_member',
    targetType: 'magic_link',
    targetId: magicLink.id,
    metadata: {
      email,
      system_role: systemRole
    }
  });

  return {
    data: {
      invite_url: inviteUrl,
      expires_at: magicLink.expires_at,
      email: magicLink.email,
      system_role: magicLink.system_role
    }
  };
});
