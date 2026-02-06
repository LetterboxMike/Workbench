import { createError, defineEventHandler } from 'h3';
import {
  createLocalSession,
  getAuthMode,
  getUserByEmail,
  setSessionCookie,
  syncStoreUserFromAuth,
  syncUserFromAuthDb
} from '~/server/utils/auth';
import { createId, nowIso } from '~/server/utils/id';
import { hashPassword } from '~/server/utils/password';
import { ensureString, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { getSupabaseAnonClient } from '~/server/utils/supabase';

interface SignupBody {
  email: string;
  password: string;
  name?: string;
}

export default defineEventHandler(async (event) => {
  const body = await readJsonBody<SignupBody>(event);
  const email = ensureString(body.email, 'email').toLowerCase();
  const password = ensureString(body.password, 'password');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const authMode = getAuthMode();

  if (authMode === 'disabled') {
    throw createError({ statusCode: 400, statusMessage: 'Authentication is disabled in this environment.' });
  }

  if (authMode === 'supabase') {
    const supabase = getSupabaseAnonClient();

    if (!supabase) {
      throw createError({ statusCode: 500, statusMessage: 'Supabase auth client unavailable.' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: name ? { name } : undefined
      }
    });

    if (error || !data.user) {
      throw createError({ statusCode: 400, statusMessage: error?.message || 'Sign up failed.' });
    }

    if (data.session?.access_token) {
      setSessionCookie(event, data.session.access_token);
    }

    // Use database-backed sync for Supabase mode
    const user = await syncUserFromAuthDb(data.user);

    return {
      data: {
        user,
        email_confirmed: !!data.user.email_confirmed_at,
        auth_mode: authMode
      }
    };
  }

  const store = getStore();
  const existingAccount = store.local_auth_accounts.find((account) => account.email.toLowerCase() === email);

  if (existingAccount) {
    throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists.' });
  }

  let user = getUserByEmail(email);

  if (!user) {
    user = {
      id: createId(),
      email,
      name: name || email.split('@')[0] || 'User',
      avatar_url: null,
      created_at: nowIso()
    };
    store.users.push(user);
  } else if (name) {
    user.name = name;
  }

  store.local_auth_accounts.push({
    user_id: user.id,
    email,
    password_hash: hashPassword(password),
    created_at: nowIso()
  });

  const syncedUser = syncStoreUserFromAuth({
    id: user.id,
    email: user.email,
    user_metadata: { name: user.name }
  });

  createLocalSession(event, syncedUser.id);

  return {
    data: {
      user: syncedUser,
      email_confirmed: true,
      auth_mode: authMode
    }
  };
});
