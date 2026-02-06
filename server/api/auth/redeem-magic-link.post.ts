import { createError, defineEventHandler } from 'h3';
import {
  createLocalSession,
  getAuthMode,
  getUserByEmail,
  setSessionCookie,
  syncUserFromAuthDb
} from '~/server/utils/auth';
import { readJsonBody } from '~/server/utils/request';
import { getSupabaseAnonClient, getSupabaseServiceClient } from '~/server/utils/supabase';
import {
  getMagicLinkByTokenAuto,
  redeemMagicLinkAuto
} from '~/server/utils/magic-links';
import { getStore } from '~/server/utils/store';
import { createId, nowIso } from '~/server/utils/id';
import { db } from '~/server/utils/db';
import { logActivityAuto } from '~/server/utils/activity';
import { hashPassword } from '~/server/utils/password';
import type { User } from '~/types/domain';

interface RedeemMagicLinkBody {
  token: string;
  name?: string;
  password?: string;
}

export default defineEventHandler(async (event) => {
  const body = await readJsonBody<RedeemMagicLinkBody>(event);
  const { token, name, password } = body;

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token is required.' });
  }

  // Fetch and validate magic link
  const magicLink = await getMagicLinkByTokenAuto(token);

  if (!magicLink) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired invitation link.'
    });
  }

  const authMode = getAuthMode();

  if (authMode === 'supabase') {
    // SUPABASE MODE: Create account via Supabase Auth
    const supabase = getSupabaseAnonClient();
    const serviceClient = getSupabaseServiceClient();

    if (!supabase || !serviceClient) {
      throw createError({ statusCode: 500, statusMessage: 'Supabase unavailable.' });
    }

    // Check if user exists
    let user = await db.users.getByEmail(magicLink.email);

    if (!user) {
      // Create new Supabase auth user
      if (!name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Name is required for new account.'
        });
      }

      // Generate random password for Supabase (user won't know it - magic link only)
      const tempPassword = createId() + createId();

      const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
        email: magicLink.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError || !authData.user) {
        throw createError({
          statusCode: 500,
          statusMessage: authError?.message || 'Failed to create account.'
        });
      }

      // Sync to workbench users table
      user = await syncUserFromAuthDb(authData.user);
    }

    // Add to organization
    const existingMember = await db.orgMembers.get(magicLink.org_id, user.id);
    if (!existingMember) {
      await db.orgMembers.create({
        org_id: magicLink.org_id,
        user_id: user.id,
        system_role: magicLink.system_role
      });
    }

    // Mark link as redeemed
    await redeemMagicLinkAuto(magicLink.id, user.id);

    // Create session by signing in with the temp password
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: magicLink.email,
      password: tempPassword
    });

    if (sessionError || !sessionData.session) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create session.' });
    }

    setSessionCookie(event, sessionData.session.access_token);

    // Log activity
    await logActivityAuto({
      orgId: magicLink.org_id,
      actorId: user.id,
      action: 'joined_via_magic_link',
      targetType: 'org_member',
      targetId: user.id,
      metadata: {
        invited_by: magicLink.invited_by,
        system_role: magicLink.system_role
      }
    });

    return {
      data: {
        user,
        redirect_to: '/projects'
      }
    };
  }

  // LOCAL MODE
  const store = getStore();

  // Check if user exists
  let user = getUserByEmail(magicLink.email);

  if (!user) {
    // Create new user
    if (!name || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name and password are required for new account.'
      });
    }

    const userId = createId();
    const newUser: User = {
      id: userId,
      email: magicLink.email,
      name,
      avatar_url: null,
      created_at: nowIso()
    };

    store.users.push(newUser);

    // Create auth account
    store.local_auth_accounts.push({
      user_id: userId,
      email: magicLink.email,
      password_hash: hashPassword(password),
      created_at: nowIso()
    });

    user = newUser;
  }

  // Add to organization if not already a member
  const existingMember = store.org_members.find(
    (m) => m.org_id === magicLink.org_id && m.user_id === user.id
  );

  if (!existingMember) {
    store.org_members.push({
      org_id: magicLink.org_id,
      user_id: user.id,
      system_role: magicLink.system_role,
      created_at: nowIso()
    });
  }

  // Mark link as redeemed
  await redeemMagicLinkAuto(magicLink.id, user.id);

  // Create session
  createLocalSession(event, user.id, magicLink.org_id);

  // Log activity
  await logActivityAuto({
    orgId: magicLink.org_id,
    actorId: user.id,
    action: 'joined_via_magic_link',
    targetType: 'org_member',
    targetId: user.id,
    metadata: {
      invited_by: magicLink.invited_by,
      system_role: magicLink.system_role
    }
  });

  return {
    data: {
      user,
      redirect_to: '/projects'
    }
  };
});
