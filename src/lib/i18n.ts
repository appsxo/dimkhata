// ====================================================================
// DIMKHATA (ডিমখাতা) — Bilingual Engine (বাংলা Default + English)
// ====================================================================

import { useState, useEffect } from 'react';
import { AppLanguage, EggCategory } from '../types';

let currentLanguage: AppLanguage = 'bn';

export function getActiveLanguage(): AppLanguage {
  return currentLanguage;
}

export function setActiveLanguage(lang: AppLanguage): void {
  currentLanguage = lang;
  document.documentElement.lang = lang;
  window.dispatchEvent(new Event('dimkhata_lang_change'));
  window.dispatchEvent(new Event('dimkhata_storage_change'));
}

export function toggleActiveLanguage(): AppLanguage {
  const next: AppLanguage = currentLanguage === 'bn' ? 'en' : 'bn';
  setActiveLanguage(next);
  return next;
}

/**
 * Core bilingual selector: returns Bangla by default ('bn') or English ('en')
 */
export function t(bn: string, en: string): string {
  return currentLanguage === 'en' ? en : bn;
}

/**
 * Helper to return localized category name
 */
export function getCategoryDisplayName(cat?: EggCategory | null): string {
  if (!cat) return currentLanguage === 'en' ? 'Egg' : 'ডিম';
  return currentLanguage === 'en' ? cat.name_en : cat.name_bn;
}

/**
 * React hook for reactive bilingual rendering
 */
export function useLanguage(): {
  lang: AppLanguage;
  setLang: (l: AppLanguage) => void;
  toggleLang: () => void;
  toggleLanguage: () => void;
  t: (bn: string, en: string) => string;
} {
  const [lang, setLangState] = useState<AppLanguage>(getActiveLanguage());

  useEffect(() => {
    const handler = () => setLangState(getActiveLanguage());
    window.addEventListener('dimkhata_lang_change', handler);
    return () => window.removeEventListener('dimkhata_lang_change', handler);
  }, []);

  return {
    lang,
    setLang: setActiveLanguage,
    toggleLang: toggleActiveLanguage,
    toggleLanguage: toggleActiveLanguage,
    t: (bn: string, en: string) => (lang === 'en' ? en : bn),
  };
}
