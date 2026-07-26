import { createClient } from '@supabase/supabase-js';
import { config } from './env.config.js';

if (!config.supabase.url || !config.supabase.anonKey) {
  console.warn('Supabase URL or Anon Key is missing in environment variables.');
}

// Client with anon key (subject to RLS policies)
export const supabaseAnonClient = createClient(
  config.supabase.url || '',
  config.supabase.anonKey || ''
);

// Client with service role key (bypasses RLS policies)
// Created dynamically to allow the app to boot even if the key is missing initially,
// throwing an error only when it's actually used.
export const getSupabaseServiceClient = () => {
  if (!config.supabase.serviceRoleKey) {
    throw new Error('Service role key not configured');
  }
  return createClient(config.supabase.url, config.supabase.serviceRoleKey);
};
