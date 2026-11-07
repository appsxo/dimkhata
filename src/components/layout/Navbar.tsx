// ====================================================================
// DIMKHATA (ডিমখাতা) — Apple Two-Row Top Navigation & Mobile App Header
// Row 1: {component.global-nav} (#000000, height 44px, 12px/400)
// Row 2: {component.sub-nav-frosted} (#f5f5f7/82% blur, height 52px)
// Supports Bilingual (Bangla default + English) & PIN Security Lock
// ====================================================================

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
  onOpenRatesModal: () => void;
  onRefresh: () => void;
  currentTab?: NavTabId;
  onSelectTab?: (tab: NavTabId) => void;
}

const TAB_TITLES_BN: Record<NavTabId, string> = {
  dashboard: 'ড্যাশবোর্ড ও লাইভ স্টক',
  'sales-pos': 'বিক্রয় মেমো ও চালান (POS)',
  sourcing: 'মহাজন থেকে ডিম কেনা',
  'daily-pricing': 'আজকের বাজার দর',
  parties: 'কাস্টমার ও মহাজন খাতা (KYC)',
  'wastage-courtesy': 'ভাঙা, সৌজন্য ও শাখা ট্রান্সফার',
  expenses: 'দোকান ও গাড়ির খরচ',
  cashbook: 'ক্যাশবুক ও ব্যাংক একাউন্ট',
  payroll: 'কর্মচারী ও বেতন হিসাব',
  'profit-settlement': 'লাভ-লোকসান ও ২:১ বণ্টন',
  'audit-branches': 'শাখা ও ডিজিটাল অডিট লগ',
};

const TAB_TITLES_EN: Record<NavTabId, string> = {
  dashboard: 'Dashboard & Live Stock',
  'sales-pos': 'Sales Memo & Challan (POS)',
  sourcing: 'Sourcing & Egg Purchases',
  'daily-pricing': "Today's Market Rates",
  parties: 'Customers & Suppliers (KYC)',
  'wastage-courtesy': 'Wastage, Courtesy & Transfer',
  expenses: 'Operating & Vehicle Expenses',
  cashbook: 'Cashbook & Bank Accounts',
  payroll: 'Employees & Payroll HR',
  'profit-settlement': 'Profit & 2:1 Settlement',
  'audit-branches': 'Branches & Digital Audit Log',
};

export const Navbar: React.FC<NavbarProps> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  currentUser,
  onToggleUserRole,
  onOpenSecurityModal,
  onOpenRatesModal,
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
    if (!isSupabaseConfigured) {
      onOpenSecurityModal();
      return;
    }
    if (cloudStatus === 'NEEDS_SQL') {
      onOpenSecurityModal();
      return;
    }
    setSyncing(true);
    const res = await DimKhataStore.syncWithSupabase();
    setSyncing(false);
    if (res.synced) {
      setSyncDone(true);
      onRefresh();
      setTimeout(() => setSyncDone(false), 2500);
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
        alert(t('ডাটাবেজ ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!', 'Database backup restored successfully!'));
        onRefresh();
      } else {
        alert(t('ভুল ফাইল ফরম্যাট! সঠিক JSON ফাইল নির্বাচন করুন।', 'Invalid file format! Please select a valid JSON backup file.'));
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
          'আপনি কি নিশ্চিত যে সকল লেনদেন মুছে নতুন ফ্রেশ প্রোডাকশন ডাটাবেস শুরু করতে চান?',
          'Are you sure you want to wipe all transactions and reset to a clean production state in Supabase?'
        )
      )
    ) {
      DimKhataStore.resetToCleanProduction();
      onRefresh();
    }
  };

  return (
    <header className="sticky top-0 z-40 no-print select-none">
      {/* ROW 1: {component.global-nav} — 44px Pure Black Top Bar */}
      <div className="apple-global-nav px-3 sm:px-6 flex items-center justify-between">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-2">
          {/* Brand Identity */}
          <button
            type="button"
            onClick={() => onSelectTab?.('dashboard')}
            className="flex items-center gap-1.5 sm:gap-2 text-white min-w-0 cursor-pointer active:scale-95 transition"
          >
            <span className="text-[15px] shrink-0">🥚</span>
            <span className="font-semibold text-[12px] sm:text-[13px] tracking-[-0.12px] truncate max-w-[135px] sm:max-w-none">
              {lang === 'bn' ? company.company_name_bn : company.company_name_en}
            </span>
            <span className="hidden lg:inline text-[#cccccc] text-[11px] shrink-0">
              • {t('ডিমখাতা ERP', 'DimKhata ERP')}
            </span>
          </button>

          {/* Global Utility Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Branch Selector (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#272729] text-white rounded-full px-2.5 py-1 text-[11px]">
              <Store className="w-3 h-3 text-[#2997ff] shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                aria-label={t('শাখা নির্বাচন', 'Select Branch')}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-[11px] max-w-[140px] truncate"
              >
                <option value="ALL" className="bg-[#1d1d1f] text-white">
                  {t('সকল শাখা (একত্রিত)', 'All Branches (Combined)')}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#1d1d1f] text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 1-Tap Bilingual Toggle (বাংলা | EN) */}
            <button
              type="button"
              onClick={toggleLanguage}
              title={t('ইংরেজি ভাষায় পরিবর্তন করুন (Switch to English)', 'বাংলা ভাষায় পরিবর্তন করুন (Switch to Bangla)')}
              className="flex items-center gap-1 bg-[#272729] hover:bg-[#3a3a3c] text-white rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-pointer active:scale-95 transition"
            >
              <Globe className="w-3 h-3 text-[#2997ff]" />
              <span>{lang === 'bn' ? 'EN' : 'বাংলা'}</span>
            </button>

            {/* Supabase Live Sync Status Pill */}
            <button
              type="button"
              onClick={handleCloudSync}
              title={
                cloudStatus === 'ONLINE'
                  ? t('Supabase ক্লাউড ডাটাবেস লাইভ সংযুক্ত', 'Supabase Cloud Database Live Connected')
                  : cloudStatus === 'NEEDS_SQL'
                  ? t('Supabase টেবিল সেটআপ করতে ক্লিক করুন', 'Click to view 1-time Supabase SQL setup')
                  : t('Supabase সিঙ্ক স্ট্যাটাস', 'Supabase Sync Status')
              }
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
                  ? t('সিঙ্ক হচ্ছে...', 'Syncing...')
                  : syncDone
                  ? t('সিঙ্ক সম্পন্ন', 'Synced')
                  : cloudStatus === 'ONLINE'
                  ? t('Supabase লাইভ', 'Supabase Live')
                  : cloudStatus === 'NEEDS_SQL'
                  ? t('SQL সেটআপ', 'Setup SQL')
                  : t('ক্লাউড', 'Cloud')}
              </span>
            </button>

            {/* User Role Switcher (Protected by Admin PIN) */}
            <button
              type="button"
              onClick={onToggleUserRole}
              title={
                currentUser.role === 'ADMIN'
                  ? t('স্টাফ মোডে লক করতে ট্যাপ করুন', 'Tap to lock into Staff Mode')
                  : t('মালিক (অ্যাডমিন) মোডে আনলক করতে পিন দিন', 'Tap to unlock Admin Mode with PIN')
              }
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] cursor-pointer active:scale-95 transition ${
                currentUser.role === 'ADMIN'
                  ? 'bg-[#0066cc] text-white'
                  : 'bg-[#272729] text-white'
              }`}
            >
              {currentUser.role === 'ADMIN' ? (
                <ShieldCheck className="w-3 h-3 text-white" />
              ) : (
                <UserCheck className="w-3 h-3 text-[#cccccc]" />
              )}
              <span className="font-semibold">
                {currentUser.role === 'ADMIN'
                  ? t('মালিক', 'Admin')
                  : t('স্টাফ', 'Staff')}
              </span>
            </button>

            {/* Security & PIN Settings Button */}
            {currentUser.role === 'ADMIN' && (
              <button
                type="button"
                onClick={onOpenSecurityModal}
                title={t('নিরাপত্তা পিন ও ক্লাউড সেটিংস', 'Security PIN & Cloud Settings')}
                className="w-7 h-7 rounded-full bg-[#272729] hover:bg-[#3a3a3c] text-[#cccccc] hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Desktop Backup & Restore Icons (Admin Only for Restore/Reset) */}
            <div className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                title={t('সম্পূর্ণ ডাটা ব্যাকআপ ডাউনলোড (JSON)', 'Download Full JSON Backup')}
                className="w-7 h-7 rounded-full bg-[#272729] text-[#cccccc] hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {currentUser.role === 'ADMIN' && (
                <>
                  <label
                    title={t('ব্যাকআপ ফাইল রিস্টোর করুন', 'Restore JSON Backup')}
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
                    title={t('ফ্রেশ প্রোডাকশন ডাটাবেস রিসেট', 'Reset to Clean Production State')}
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

      {/* ROW 2: {component.sub-nav-frosted} — 52px Frosted Parchment Bar */}
      <div className="apple-sub-nav px-3 sm:px-6 flex items-center">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-2 py-1.5">
          {/* Active Category / Module Name */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] sm:text-[20px] font-semibold text-[#1d1d1f] tracking-[0.2px] truncate">
              {lang === 'bn'
                ? TAB_TITLES_BN[currentTab] || 'ডিমখাতা'
                : TAB_TITLES_EN[currentTab] || 'DimKhata'}
            </h1>
          </div>

          {/* Right Quick Actions: Mobile Branch Selector + Today's Rate + POS CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Compact Mobile Branch Selector */}
            <div className="flex sm:hidden items-center gap-1 bg-white border border-[#e0e0e0] rounded-full px-2 py-1 text-[11px] text-[#1d1d1f]">
              <Store className="w-3 h-3 text-[#0066cc] shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                aria-label={t('শাখা', 'Branch')}
                className="bg-transparent text-[#1d1d1f] font-medium focus:outline-none text-[11px] max-w-[78px] truncate"
              >
                <option value="ALL">{t('সব শাখা', 'All')}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenRatesModal}
              className="btn-secondary-pill !min-h-[32px] sm:!min-h-[34px] !py-1 !px-2.5 sm:!px-3.5 !text-[12px] sm:!text-[13px]"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{t('আজকের দর', 'Rates')}</span>
            </button>

            {currentTab !== 'sales-pos' && onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('sales-pos')}
                className="btn-primary !min-h-[32px] sm:!min-h-[34px] !py-1 !px-2.5 sm:!px-3.5 !text-[12px] sm:!text-[13px]"
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
