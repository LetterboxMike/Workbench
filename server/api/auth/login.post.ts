import { createError, defineEventHandler } from 'h3';
import {
  clearSessionCookie,
  createLocalSession,
  getAuthMode,
  getUserByEmail,
  setSessionCookie,
  syncStoreUserFromAuth,
  syncUserFromAuthDb
} from '~/server/utils/auth';
import { ensureString, readJsonBody } from '~/server/utils/request';
import { getSupabaseAnonClient } from '~/server/utils/supabase';
import { verifyPassword } from '~/server/utils/password';
import { getStore } from '~/server/utils/store';

interface LoginBody {
  email: string;
  password: string;
}

export default defineEventHandler(async (event) => {
  const body = await readJsonBody<LoginBody>(event);
  const email = ensureString(body.email, 'email').toLowerCase();
  const password = ensureString(body.password, 'password');
  const authMode = getAuthMode();

  if (authMode === 'disabled') {
    throw createError({ statusCode: 400, statusMessage: 'Authentication is disabled in this environment.' });
  }

  if (authMode === 'supabase') {
    const supabase = getSupabaseAnonClient();

    if (!supabase) {
      throw createError({ statusCode: 500, statusMessage: 'Supabase auth client unavailable.' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session || !data.user) {
      clearSessionCookie(event);
      throw createError({ statusCode: 401, statusMessage: error?.message || 'Invalid email or password.' });
    }

    setSessionCookie(event, data.session.access_token);

    // Use database-backed sync for Supabase mode
    const user = await syncUserFromAuthDb(data.user);

    return {
      data: {
        user,
        auth_mode: authMode
      }
    };
  }

  const store = getStore();
  const account = store.local_auth_accounts.find((item) => item.email.toLowerCase() === email.toLowerCase());

  if (!account || !verifyPassword(password, account.password_hash)) {
    clearSessionCookie(event);
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password.' });
  }

  const user = getUserByEmail(email);

  if (!user) {
    clearSessionCookie(event);
    throw createError({ statusCode: 401, statusMessage: 'Account exists but user profile is missing.' });
  }

  createLocalSession(event, user.id);

  return {
    data: {
      user,
      auth_mode: authMode
    }
  };
});
