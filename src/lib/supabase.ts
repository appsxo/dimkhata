// ====================================================================
// DIMKHATA (ডিমখাতা) — Supabase Client Initializer
// Business: Sharif & Eman Enterprise (শরিফ এন্ড ইমান এন্টারপ্রাইজ)
// ====================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
