import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedAnonClient: SupabaseClient | null = null;

export const getSupabaseServiceClient = (): SupabaseClient | null => {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  cachedClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return cachedClient;
};

export const getSupabaseAnonClient = (): SupabaseClient | null => {
  if (cachedAnonClient) {
    return cachedAnonClient;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  cachedAnonClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return cachedAnonClient;
};
