// ====================================================================
// DIMKHATA (ডিমখাতা) — Application & Data Security Engine
// SHA-256 PIN Hashing, Role Access Verification & Input Sanitization
// ====================================================================

import { CompanySettings, UserProfile } from '../types';

// Default SHA-256 hashes:
// '1234' -> 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
// '0000' -> 9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0
export const DEFAULT_ADMIN_PIN_HASH =
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
export const DEFAULT_STAFF_PIN_HASH =
  '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0';

/**
 * Computes Web Crypto SHA-256 hex digest of a PIN or password string
 */
export async function sha256Hex(input: string): Promise<string> {
  const clean = input.trim();
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const msgBuffer = new TextEncoder().encode(clean);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic hash if SubtleCrypto is unavailable
  let h = 0;
  for (let i = 0; i < clean.length; i++) {
    h = (Math.imul(31, h) + clean.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}

/**
 * Verifies an entered PIN against an individual UserProfile
 */
export async function verifyUserPin(user: UserProfile, enteredPin: string): Promise<boolean> {
  const hash = await sha256Hex(enteredPin);
  const targetHash =
    user.pin_hash ||
    (user.role === 'ADMIN' ? DEFAULT_ADMIN_PIN_HASH : DEFAULT_STAFF_PIN_HASH);
  return hash === targetHash;
}

/**
 * Verifies an entered PIN against the stored Admin or Staff PIN hash in Supabase CompanySettings
 */
export async function verifyRolePin(
  role: 'ADMIN' | 'STAFF',
  enteredPin: string,
  company: CompanySettings
): Promise<boolean> {
  const hash = await sha256Hex(enteredPin);
  if (role === 'ADMIN') {
    const targetHash = company.admin_pin_hash || DEFAULT_ADMIN_PIN_HASH;
    return hash === targetHash;
  } else {
    const targetHash = company.staff_pin_hash || DEFAULT_STAFF_PIN_HASH;
    // Admin PIN can also unlock Staff mode
    const adminHash = company.admin_pin_hash || DEFAULT_ADMIN_PIN_HASH;
    return hash === targetHash || hash === adminHash;
  }
}

/**
 * Sanitizes text input to prevent HTML/script injection while preserving Bangla & English text
 */
export function sanitizeText(input: string | undefined | null, maxLength = 300): string {
  if (!input) return '';
  return String(input)
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes positive numeric values (prevents NaN, Infinity, or negative manipulation)
 */
export function sanitizePositiveNumber(val: unknown, maxVal = 100000000): number {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(num, maxVal);
}
