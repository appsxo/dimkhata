// ====================================================================
// DIMKHATA (ডিমখাতা) — Production Supabase Cloud Engine
// Business: Sharif & Eman Enterprise (শরিফ এন্ড ইমান এন্টারপ্রাইজ)
// Single Source of Truth for Real-Time Consistent Multi-Device Sync
// ====================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_PROJECT_ID = 'npukembiywekdbgslipn';
export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_CONFIG_STORAGE_KEY = 'dimkhata_supabase_config';

export interface SupabaseConfig {
  url: string;
  key: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SupabaseConfig;
        if (parsed?.url && parsed?.key) {
          return {
            url: parsed.url.trim(),
            key: parsed.key.trim(),
          };
        }
      }
    } catch {
      // Ignore parse error and fallback
    }
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  return {
    url: envUrl || DEFAULT_SUPABASE_URL,
    key: envKey,
  };
}

let activeConfig: SupabaseConfig = getStoredSupabaseConfig();

export function isConfigured(): boolean {
  return Boolean(
    activeConfig.url &&
    activeConfig.key &&
    !activeConfig.url.includes('YOUR_') &&
    activeConfig.key.length >= 20
  );
}

export let supabase: SupabaseClient | null = isConfigured()
  ? createClient(activeConfig.url, activeConfig.key, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

export function saveSupabaseConfig(url: string, key: string): boolean {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  if (!cleanUrl || !cleanKey || cleanKey.length < 20) return false;

  activeConfig = { url: cleanUrl, key: cleanKey };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(activeConfig));
  }

  supabase = createClient(cleanUrl, cleanKey, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dimkhata_supabase_reconfigured'));
  }
  return true;
}

export function clearStoredSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SUPABASE_CONFIG_STORAGE_KEY);
  }
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  activeConfig = {
    url: envUrl || DEFAULT_SUPABASE_URL,
    key: envKey,
  };

  supabase = isConfigured()
    ? createClient(activeConfig.url, activeConfig.key)
    : null;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dimkhata_supabase_reconfigured'));
  }
}

export { isConfigured as isSupabaseConfigured };
