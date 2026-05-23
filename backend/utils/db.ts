import { createClient } from '@supabase/supabase-js';
import { envConfig } from '../config/env.config';

const supabaseUrl = envConfig.supabase.url;
const supabaseAnonKey = envConfig.supabase.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});