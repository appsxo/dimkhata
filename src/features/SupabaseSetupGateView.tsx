import React, { useState } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Globe,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CloudOff,
} from 'lucide-react';
import {
  saveSupabaseConfig,
  getStoredSupabaseConfig,
} from '../lib/supabase';
import { DimKhataStore, CloudSyncStatus } from '../lib/storage-store';
import { useLanguage } from '../lib/i18n';

interface SupabaseSetupGateViewProps {
  status: CloudSyncStatus;
  onConnected: () => void;
}

const SCHEMA_SQL = `-- DimKhata (ডিমখাতা) — Production Supabase KV Store Table
CREATE TABLE IF NOT EXISTS public.dimkhata_kv_store (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dimkhata_kv_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow publishable key sync on dimkhata_kv_store" ON public.dimkhata_kv_store;
CREATE POLICY "Allow publishable key sync on dimkhata_kv_store"
    ON public.dimkhata_kv_store
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'dimkhata_kv_store'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.dimkhata_kv_store;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;`;

export const SupabaseSetupGateView: React.FC<SupabaseSetupGateViewProps> = ({
  status,
  onConnected,
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const currentConfig = getStoredSupabaseConfig();

  const [urlInput, setUrlInput] = useState(currentConfig.url || '');
  const [keyInput, setKeyInput] = useState(currentConfig.key || '');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  const projectRef = urlInput.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1];

  const handleCopySql = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveAndVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!urlInput.trim() || !keyInput.trim()) {
      setErrorMessage(t('Supabase URL এবং API Key উভয়ই পূরণ করুন!', 'Please enter both Supabase URL and API Key!'));
      return;
    }

    if (keyInput.trim().length < 20) {
      setErrorMessage(t('সঠিক Supabase Publishable / Anon Key দিন!', 'Please enter a valid Supabase Publishable or Anon Key!'));
      return;
    }

    setTesting(true);
    const saved = saveSupabaseConfig(urlInput.trim(), keyInput.trim());
    if (!saved) {
      setTesting(false);
      setErrorMessage(t('কনফিগারেশন সংরক্ষণ ব্যর্থ হয়েছে', 'Failed to save configuration'));
      return;
    }

    const res = await DimKhataStore.syncWithSupabase();
    setTesting(false);

    if (res.synced && res.status === 'ONLINE') {
      onConnected();
    } else if (res.status === 'NEEDS_SQL') {
      // Status will automatically switch to NEEDS_SQL
    } else {
      setErrorMessage(
        res.error
          ? t(`কানেকশন ত্রুটি: ${res.error}`, `Connection error: ${res.error}`)
          : t('Supabase ক্লাউড কানেক্ট করা যায়নি! কি (Key) সঠিক কিনা যাচাই করুন।', 'Could not connect to Supabase! Please verify your key.')
      );
    }
  };

  const handleVerifyTable = async () => {
    setTesting(true);
    setErrorMessage('');
    const res = await DimKhataStore.syncWithSupabase();
    setTesting(false);

    if (res.synced && res.status === 'ONLINE') {
      onConnected();
    } else if (res.status === 'NEEDS_SQL') {
      setErrorMessage(t('টেবিল এখনো তৈরি হয়নি! অনুগ্রহ করে Supabase SQL Editor-এ কোডটি রান করুন।', 'Table not found yet! Please run the SQL in your Supabase SQL editor.'));
    } else {
      setErrorMessage(res.error || t('যাচাই ব্যর্থ হয়েছে', 'Verification failed'));
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-between items-center p-4 sm:p-6 font-sans select-none">
      {/* Top Header */}
      <div className="w-full max-w-lg flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 flex items-center justify-center text-lg">
            🥚
          </div>
          <div className="text-[13px] font-semibold text-[#1d1d1f]">
            {lang === 'bn' ? 'শরিফ এন্ড ইমান এন্টারপ্রাইজ' : 'Sharif & Eman Enterprise'}
          </div>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 bg-white border border-[#e0e0e0] hover:bg-[#f0f0f2] text-[#1d1d1f] rounded-full px-3 py-1.5 text-[12px] font-medium transition cursor-pointer active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-[#0066cc]" />
          <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg my-auto pt-4 pb-6">
        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-5 sm:p-7 space-y-6">
          {/* Badge & Icon Header */}
          <div className="text-center space-y-2">
            <div
              className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${
                status === 'NEEDS_SQL'
                  ? 'bg-[#ff9f0a]/10 text-[#ff9f0a]'
                  : status === 'OFFLINE'
                  ? 'bg-[#ff3b30]/10 text-[#ff3b30]'
                  : 'bg-[#0066cc]/10 text-[#0066cc]'
              }`}
            >
              {status === 'NEEDS_SQL' ? (
                <Database className="w-7 h-7" />
              ) : status === 'OFFLINE' ? (
                <CloudOff className="w-7 h-7" />
              ) : (
                <Cloud className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1 bg-[#0066cc]/10 text-[#0066cc]">
                {status === 'NEEDS_SQL'
                  ? t('SQL সেটআপ প্রয়োজন', 'SQL Setup Required')
                  : status === 'OFFLINE'
                  ? t('ক্লাউড সংযোগ বিচ্ছিন্ন', 'Cloud Connection Lost')
                  : t('Supabase ক্লাউড কানেকশন বাধ্যতামূলক', 'Supabase Cloud Required')}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1d1d1f]">
                {status === 'NEEDS_SQL'
                  ? t('ডাটাবেস টেবিল তৈরি করুন', 'Create Database Table')
                  : status === 'OFFLINE'
                  ? t('ক্লাউড সংযোগ স্থাপন করুন', 'Restore Cloud Connection')
                  : t('Supabase ক্লাউড সেটআপ', 'Supabase Cloud Connection')}
              </h1>
              <p className="text-[12.5px] text-[#7a7a7a] mt-1 max-w-md mx-auto leading-relaxed">
                {status === 'NEEDS_SQL'
                  ? t(
                      'Supabase প্রজেক্ট কানেক্ট হয়েছে। ডিমখাতা চালু করতে ১ বার নিচের SQL কোডটি আপনার Supabase SQL Editor-এ রান করুন।',
                      'Connected to Supabase! To activate DimKhata, run the SQL script below once in your Supabase SQL Editor.'
                    )
                  : t(
                      'ডিমখাতা শতভাগ সিঙ্ক ও ডাটা লস মুক্ত রাখতে সরাসরি Supabase ডাটাবেসের সাথে সংযুক্ত থাকে। কানেকশন ছাড়া সিস্টেমে কোনো তথ্য যোগ করা যাবে না।',
                      'DimKhata strictly requires a live Supabase connection to guarantee zero data loss and real-time multi-device sync.'
                    )}
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#ff3b30]/10 border border-[#ff3b30]/30 text-[#d70015] text-[12.5px]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode 1: NEEDS_SQL */}
          {status === 'NEEDS_SQL' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#1d1d1f]">
                    {t('১. এই SQL কোডটি কপি করুন:', '1. Copy this SQL Code:')}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0066cc] hover:underline cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#30d158]" />
                        <span>{t('কপি হয়েছে!', 'Copied!')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t('কোড কপি করুন', 'Copy SQL')}</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-[#1d1d1f] text-[#f5f5f7] text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed select-all">
                  {SCHEMA_SQL}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] flex items-center justify-between text-[12px]">
                <span className="text-[#1d1d1f] font-medium">
                  {t('২. Supabase SQL Editor খুলুন:', '2. Open Supabase SQL Editor:')}
                </span>
                <a
                  href={
                    projectRef
                      ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
                      : 'https://supabase.com/dashboard'
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#0066cc] hover:underline"
                >
                  <span>{t('SQL Editor খুলুন', 'Open SQL Editor')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <button
                type="button"
                onClick={handleVerifyTable}
                disabled={testing}
                className="w-full h-12 rounded-full bg-[#0066cc] hover:bg-[#0055b3] text-white font-semibold text-[14.5px] transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('যাচাই করা হচ্ছে...', 'Verifying Database...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('রান সম্পন্ন হয়েছে — ডাটাবেস সক্রিয় করুন', 'I Ran the SQL — Activate System')}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Mode 2: NOT_CONFIGURED or OFFLINE */
            <form onSubmit={handleSaveAndVerify} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-[#7a7a7a] mb-1.5">
                  {t('Supabase প্রজেক্ট URL', 'Supabase Project URL')}
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://xxxx.supabase.co"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-[#e0e0e0] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] text-[13.5px] font-mono focus:outline-none bg-[#fbfbfd]"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11.5px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
                    {t('Supabase Publishable / Anon Key', 'Supabase Publishable / Anon Key')}
                  </label>
                  <a
                    href={
                      projectRef
                        ? `https://supabase.com/dashboard/project/${projectRef}/settings/api-keys`
                        : 'https://supabase.com/dashboard'
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066cc] hover:underline"
                  >
                    <span>{t('API Key দেখুন ↗', 'Get API Key ↗')}</span>
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full py-2.5 pl-3.5 pr-10 rounded-xl border border-[#e0e0e0] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] text-[13px] font-mono focus:outline-none bg-[#fbfbfd]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7a7a] hover:text-[#1d1d1f] p-1 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#f5f5f7] rounded-xl text-[11.5px] text-[#7a7a7a] space-y-1">
                <div className="font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#0066cc]" />
                  <span>{t('সেটআপ নির্দেশিকা (Supabase Setup):', 'Setup Instructions:')}</span>
                </div>
                <p>
                  {t(
                    'আপনার Supabase ড্যাশবোর্ডের Settings → API Keys থেকে Project URL এবং Publishable (বা Anon) কী কপি করে এখানে পেস্ট করুন।',
                    'Copy your Project URL and Publishable or Anon key from Supabase Settings → API Keys and paste them here.'
                  )}
                </p>
              </div>

              <button
                type="submit"
                disabled={testing || !urlInput || !keyInput}
                className="w-full h-12 rounded-full bg-[#0066cc] hover:bg-[#0055b3] text-white font-semibold text-[14.5px] transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('কানেকশন যাচাই করা হচ্ছে...', 'Verifying Connection...')}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('ক্লাউড কানেক্ট ও সক্রিয় করুন', 'Connect & Activate Cloud')}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-lg text-center pb-2 text-[11px] text-[#7a7a7a] space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#0066cc]" />
          <span>{t('একক সত্য উৎস (Single Source of Truth) • Supabase Realtime', 'Single Source of Truth • Supabase Realtime')}</span>
        </div>
        <p>
          {t(
            'সকল শাখা ও ডিভাইসে লাইভ সিঙ্ক নিশ্চিত করতে ক্লাউড কানেকশন বাধ্যতামূলক',
            'Cloud connection is required to guarantee zero data inconsistency'
          )}
        </p>
      </div>
    </div>
  );
};
