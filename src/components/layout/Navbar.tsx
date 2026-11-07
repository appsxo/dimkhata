import React, { useState } from 'react';
import {
  UserCheck,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
  Store,
  Sparkles,
  Plus,
  Cloud,
  Check,
  Lock,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { DimKhataStore } from '../../lib/storage-store';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useLanguage } from '../../lib/i18n';
import { Branch, UserProfile } from '../../types';
import { NavTabId } from './Sidebar';

interface NavbarProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  currentUser: UserProfile;
  onToggleUserRole: () => void;
  onOpenSecurityModal: () => void;
  onRefresh: () => void;
  currentTab?: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
}

const TAB_TITLES_BN: Record<NavTabId, string> = {
  dashboard: 'ড্যাশবোর্ড ও লাইভ স্টক',
  'sales-pos': 'বিক্রয় মেমো ও চালান (POS)',
  sourcing: 'মহাজন থেকে ডিম কেনা',
  'daily-pricing': 'আজকের বাজার দর',
  parties: 'কাস্টমার ও মহাজন খাতা',
  'wastage-courtesy': 'ভাঙা, সৌজন্য ও ট্রান্সফার',
  expenses: 'দোকান ও গাড়ির খরচ',
  cashbook: 'ক্যাশবুক ও ব্যাংক একাউন্ট',
  payroll: 'কর্মচারী ও বেতন হিসাব',
  'profit-settlement': 'লাভ-লোকসান ও ২:১ বণ্টন',
  'audit-branches': 'শাখা ও ডিজিটাল অডিট লগ',
};

const TAB_TITLES_EN: Record<NavTabId, string> = {
  dashboard: 'Dashboard & Live Stock',
  'sales-pos': 'Sales Memo & POS',
  sourcing: 'Egg Sourcing & Purchases',
  'daily-pricing': "Today's Market Rates",
  parties: 'Customers & Suppliers',
  'wastage-courtesy': 'Wastage & Stock Transfer',
  expenses: 'Expenses & Assets',
  cashbook: 'Cashbook & Bank Accounts',
  payroll: 'Employees & Payroll',
  'profit-settlement': 'Profit & 2:1 Settlement',
  'audit-branches': 'Branches & Audit Log',
};

export const Navbar: React.FC<NavbarProps> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  currentUser,
  onToggleUserRole,
  onOpenSecurityModal,
  onRefresh,
  currentTab = 'dashboard',
  onSelectTab,
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const company = DimKhataStore.getCompany();
  const cloudStatus = DimKhataStore.getCloudStatus();
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const handleCloudSync = async () => {
    if (!isSupabaseConfigured || cloudStatus === 'NEEDS_SQL') {
      onOpenSecurityModal();
      return;
    }
    setSyncing(true);
    const res = await DimKhataStore.syncWithSupabase();
    setSyncing(false);
    if (res.synced) {
      setSyncDone(true);
      onRefresh();
      setTimeout(() => setSyncDone(false), 2000);
    }
  };

  const handleDownloadBackup = () => {
    const json = DimKhataStore.exportFullBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DimKhata_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (DimKhataStore.importFullBackupJson(content)) {
        alert(t('ব্যাকআপ রিস্টোর সফল হয়েছে!', 'Backup restored successfully!'));
        onRefresh();
      } else {
        alert(t('ভুল ফাইল ফরম্যাট!', 'Invalid JSON backup file!'));
      }
    };
    reader.readAsText(file);
  };

  const handleResetClean = () => {
    if (currentUser.role !== 'ADMIN') {
      onToggleUserRole();
      return;
    }
    if (
      confirm(
        t(
          'সকল লেনদেন মুছে নতুন ফ্রেশ ডাটাবেস শুরু করতে চান?',
          'Reset all transactions to a clean production state?'
        )
      )
    ) {
      DimKhataStore.resetToCleanProduction();
      onRefresh();
    }
  };

  return (
    <header className="sticky top-0 z-40 no-print select-none">
      <div className="apple-global-nav px-3 sm:px-6 flex items-center justify-between">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-1.5 text-white min-w-0 cursor-pointer active:scale-95 transition"
          >
            <span className="text-[14px] shrink-0">🥚</span>
            <span className="font-semibold text-[12px] sm:text-[13px] truncate max-w-[140px] sm:max-w-none">
              {lang === 'bn' ? company.company_name_bn : company.company_name_en}
            </span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#272729] text-white rounded-full px-2.5 py-1 text-[11px]">
              <Store className="w-3 h-3 text-[#2997ff] shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                aria-label={t('শাখা', 'Branch')}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-[11px] max-w-[130px] truncate"
              >
                <option value="ALL" className="bg-[#1d1d1f] text-white">
                  {t('সকল শাখা', 'All Branches')}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#1d1d1f] text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1 bg-[#272729] hover:bg-[#3a3a3c] text-white rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-pointer active:scale-95 transition"
            >
              <Globe className="w-3 h-3 text-[#2997ff]" />
              <span>{lang === 'bn' ? 'EN' : 'বাংলা'}</span>
            </button>

            <button
              type="button"
              onClick={handleCloudSync}
              className="flex items-center gap-1.5 bg-[#272729] hover:bg-[#3a3a3c] text-white rounded-full px-2.5 py-1 text-[11px] cursor-pointer active:scale-95 transition"
            >
              {syncDone ? (
                <Check className="w-3 h-3 text-[#30d158]" />
              ) : cloudStatus === 'NEEDS_SQL' ? (
                <AlertCircle className="w-3 h-3 text-[#ff9f0a]" />
              ) : (
                <Cloud
                  className={`w-3 h-3 ${
                    cloudStatus === 'ONLINE' ? 'text-[#30d158]' : 'text-[#2997ff]'
                  } ${syncing || cloudStatus === 'SYNCING' ? 'animate-pulse' : ''}`}
                />
              )}
              <span className="hidden md:inline">
                {syncing || cloudStatus === 'SYNCING'
                  ? t('সিঙ্ক...', 'Syncing...')
                  : cloudStatus === 'ONLINE'
                  ? t('লাইভ সিঙ্ক', 'Live Sync')
                  : cloudStatus === 'NEEDS_SQL'
                  ? t('SQL সেটআপ', 'Setup SQL')
                  : t('ক্লাউড', 'Cloud')}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleUserRole}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] cursor-pointer active:scale-95 transition ${
                currentUser.role === 'ADMIN' ? 'bg-[#0066cc] text-white' : 'bg-[#272729] text-white'
              }`}
            >
              {currentUser.role === 'ADMIN' ? (
                <ShieldCheck className="w-3 h-3 text-white" />
              ) : (
                <UserCheck className="w-3 h-3 text-[#cccccc]" />
              )}
              <span className="font-semibold">
                {currentUser.role === 'ADMIN' ? t('মালিক', 'Admin') : t('স্টাফ', 'Staff')}
              </span>
            </button>

            {currentUser.role === 'ADMIN' && (
              <button
                type="button"
                onClick={onOpenSecurityModal}
                title={t('পিন ও ক্লাউড সেটিংস', 'PIN & Cloud Settings')}
                className="w-7 h-7 rounded-full bg-[#272729] hover:bg-[#3a3a3c] text-[#cccccc] hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                title={t('ব্যাকআপ ডাউনলোড (JSON)', 'Download Backup (JSON)')}
                className="w-7 h-7 rounded-full bg-[#272729] text-[#cccccc] hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {currentUser.role === 'ADMIN' && (
                <>
                  <label
                    title={t('ব্যাকআপ রিস্টোর', 'Restore Backup')}
                    className="w-7 h-7 rounded-full bg-[#272729] text-[#cccccc] hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleUploadBackup}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleResetClean}
                    title={t('রিসেট', 'Reset')}
                    className="w-7 h-7 rounded-full bg-[#272729] text-[#cccccc] hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="apple-sub-nav px-3 sm:px-6 flex items-center">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-2 py-1">
          <h1 className="text-[15px] sm:text-[18px] font-semibold text-[#1d1d1f] truncate">
            {lang === 'bn' ? TAB_TITLES_BN[currentTab] : TAB_TITLES_EN[currentTab]}
          </h1>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex sm:hidden items-center gap-1 bg-white border border-[#e0e0e0] rounded-full px-2 py-1 text-[11px] text-[#1d1d1f]">
              <Store className="w-3 h-3 text-[#0066cc] shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                aria-label={t('শাখা', 'Branch')}
                className="bg-transparent text-[#1d1d1f] font-medium focus:outline-none text-[11px] max-w-[75px] truncate"
              >
                <option value="ALL">{t('সব শাখা', 'All')}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {currentTab !== 'daily-pricing' && (
              <button
                type="button"
                onClick={() => onSelectTab('daily-pricing')}
                className="btn-secondary-pill !min-h-[32px] !py-1 !px-2.5 sm:!px-3 !text-[12px]"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{t('আজকের দর', 'Rates')}</span>
              </button>
            )}

            {currentTab !== 'sales-pos' && (
              <button
                type="button"
                onClick={() => onSelectTab('sales-pos')}
                className="btn-primary !min-h-[32px] !py-1 !px-2.5 sm:!px-3.5 !text-[12px]"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>{t('মেমো', 'POS')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
