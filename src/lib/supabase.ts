import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://sua-url-supabase.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anon-supabase';

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL && 
  env.VITE_SUPABASE_ANON_KEY &&
  !env.VITE_SUPABASE_URL.includes('sua-url-supabase')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
