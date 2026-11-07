import React, { useState } from 'react';
import {
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Globe,
  Database,
  ShieldAlert,
} from 'lucide-react';
import { DimKhataStore, CloudSyncStatus } from '../lib/storage-store';
import { useLanguage } from '../lib/i18n';

interface SupabaseSetupGateViewProps {
  status: CloudSyncStatus;
  onConnected: () => void;
}

export const SupabaseSetupGateView: React.FC<SupabaseSetupGateViewProps> = ({
  status,
  onConnected,
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [retrying, setRetrying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRetry = async () => {
    setRetrying(true);
    setErrorMessage('');
    try {
      const res = await DimKhataStore.syncWithSupabase();
      if (res.synced && res.status === 'ONLINE') {
        onConnected();
      } else {
        setErrorMessage(
          res.error
            ? t(`সংযোগ ত্রুটি: ${res.error}`, `Connection error: ${res.error}`)
            : t(
                'Supabase ডাটাবেসে সংযোগ করা যায়নি। ইন্টারনেট সংযোগ ও রিপোজিটরি সিক্রেট যাচাই করুন।',
                'Could not connect to Supabase database. Please check your internet connection and repository secrets.'
              )
        );
      }
    } catch {
      setErrorMessage(
        t('সংযোগ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।', 'Connection attempt failed. Please retry.')
      );
    } finally {
      setRetrying(false);
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

      {/* Main Error Card */}
      <div className="w-full max-w-md my-auto pt-6 pb-8">
        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ff3b30]/10 text-[#d70015] flex items-center justify-center">
            <CloudOff className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#ff3b30]/10 text-[#d70015]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>
                {status === 'NEEDS_SQL'
                  ? t('ডাটাবেস টেবিল অনুপস্থিত', 'Database Table Missing')
                  : t('ক্লাউড সংযোগ বিচ্ছিন্ন', 'Cloud Connection Offline')}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#1d1d1f]">
              {t('ক্লাউড সংযোগ ত্রুটি', 'Cloud Database Error')}
            </h1>

            <p className="text-[12.5px] text-[#7a7a7a] leading-relaxed max-w-sm mx-auto">
              {t(
                'ডিমখাতা শতভাগ রিয়েল-টাইম সিঙ্ক ও ডাটা লস সুরক্ষার জন্য সরাসরি Supabase ক্লাউড ডাটাবেসের সাথে সংযুক্ত। সক্রিয় ডাটাবেস সংযোগ ছাড়া সিস্টেমটি প্রদর্শন বা পরিচালনা করা সম্ভব নয়।',
                'DimKhata requires an active Supabase cloud database connection to guarantee zero data loss and multi-device synchronization. The system cannot be accessed offline.'
              )}
            </p>
          </div>

          {/* Sync Status Indicator */}
          <div className="p-3 bg-[#f5f5f7] rounded-xl border border-[#e0e0e0] flex items-center justify-between text-[12px]">
            <span className="text-[#7a7a7a] font-medium">
              {t('বর্তমান সিঙ্ক স্ট্যাটাস:', 'Current Sync Status:')}
            </span>
            <span className="font-mono font-semibold px-2 py-0.5 rounded bg-white border border-[#e0e0e0] text-[#d70015]">
              {status}
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#ff3b30]/10 border border-[#ff3b30]/30 text-[#d70015] text-[12px] text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Retry Action Button */}
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full h-12 rounded-full bg-[#0066cc] hover:bg-[#0055b3] text-white font-semibold text-[14px] transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
            <span>
              {retrying
                ? t('সংযোগ পরীক্ষা করা হচ্ছে...', 'Retrying Connection...')
                : t('পুনরায় সংযোগ চেষ্টা করুন', 'Retry Connection')}
            </span>
          </button>
        </div>
      </div>

      {/* Security Footnote */}
      <div className="w-full max-w-md text-center pb-2 text-[11px] text-[#7a7a7a] space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#0066cc]" />
          <span>{t('ক্লাউড কনফিগারেশন: GitHub Repository Secrets', 'Cloud Configuration: GitHub Repository Secrets')}</span>
        </div>
        <p>
          {t(
            'সিস্টেমের নিরাপত্তা বজায় রাখতে কোনো গোপন কোড ব্রাউজারে প্রদর্শিত হয় না',
            'No credentials or database scripts are exposed in the client UI'
          )}
        </p>
      </div>
    </div>
  );
};
