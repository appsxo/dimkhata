import React, { useState } from 'react';
import {
  UserCheck,
  Download,
  ShieldCheck,
  Store,
  Sparkles,
  Plus,
  Cloud,
  Check,
  Lock,
  Globe,
  AlertCircle,
  LogOut,
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
  onRequestBackup?: () => void;
  onOpenSecurityModal: () => void;
  onLogout: () => void;
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
  onRequestBackup,
  onOpenSecurityModal,
  onLogout,
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
    if (!isSupabaseConfigured() || cloudStatus === 'NEEDS_SQL' || cloudStatus === 'NOT_CONFIGURED') {
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
    if (onRequestBackup) {
      onRequestBackup();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full no-print select-none">
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
                  } ${syncing || cloudStatus === 'INITIALIZING' ? 'animate-pulse' : ''}`}
                />
              )}
              <span className="hidden md:inline">
                {syncing || cloudStatus === 'INITIALIZING'
                  ? t('সিঙ্ক...', 'Syncing...')
                  : cloudStatus === 'ONLINE'
                  ? t('লাইভ সিঙ্ক', 'Live Sync')
                  : cloudStatus === 'NEEDS_SQL'
                  ? t('SQL সেটআপ', 'Setup SQL')
                  : cloudStatus === 'NOT_CONFIGURED'
                  ? t('সেটআপ', 'Setup')
                  : t('ক্লাউড', 'Cloud')}
              </span>
            </button>

            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                currentUser.role === 'ADMIN' ? 'bg-[#0066cc] text-white' : 'bg-[#272729] text-white'
              }`}
            >
              {currentUser.role === 'ADMIN' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-white shrink-0" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-[#cccccc] shrink-0" />
              )}
              <span className="font-semibold truncate max-w-[85px] sm:max-w-none">
                {currentUser.full_name ? currentUser.full_name.split(' ')[0] : (currentUser.role === 'ADMIN' ? t('মালিক', 'Admin') : t('স্টাফ', 'Staff'))}
              </span>
            </div>

            {currentUser.role === 'ADMIN' && (
              <>
                <button
                  type="button"
                  onClick={onOpenSecurityModal}
                  title={t('পিন ও ক্লাউড সেটিংস', 'PIN & Cloud Settings')}
                  className="w-7 h-7 rounded-full bg-[#272729] hover:bg-[#3a3a3c] text-[#cccccc] hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  title={t('ব্যাকআপ ডাউনলোড (পিন সুরক্ষিত)', 'Download Backup (PIN Protected)')}
                  className="hidden md:flex w-7 h-7 rounded-full bg-[#272729] text-[#cccccc] hover:text-white items-center justify-center cursor-pointer active:scale-95 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onLogout}
              title={t('সিস্টেম লক ও প্রস্থান', 'Lock System & Logout')}
              className="flex items-center gap-1 bg-[#272729] hover:bg-[#ff3b30]/20 text-[#cccccc] hover:text-[#ff3b30] rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-pointer active:scale-95 transition"
            >
              <LogOut className="w-3 h-3 text-[#ff3b30] shrink-0" />
              <span className="hidden sm:inline">{t('লক', 'Lock')}</span>
            </button>
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
                className="btn-outline !min-h-[32px] !py-1 !px-2.5 sm:!px-3 !text-[12px]"
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
