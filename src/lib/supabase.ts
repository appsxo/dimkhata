// ====================================================================
// DIMKHATA (ডিমখাতা) — Supabase Client Initializer
// Business: Sharif & Eman Enterprise (শরিফ এন্ড ইমান এন্টারপ্রাইজ)
// ====================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_'));

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
