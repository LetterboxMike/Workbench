import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const useWorkbenchSupabase = (): SupabaseClient | null => {
  if (client) {
    return client;
  }

  const config = useRuntimeConfig();
  const url = config.public.supabaseUrl;
  const key = config.public.supabaseAnonKey;

  if (!url || !key) {
    return null;
  }

  client = createClient(url, key);
  return client;
};