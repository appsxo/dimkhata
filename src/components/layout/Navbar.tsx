// ====================================================================
// DIMKHATA (ডিমখাতা) — Apple Two-Row Top Navigation (DESIGN.md)
// Row 1: {component.global-nav} (#000000, height 44px, 12px/400)
// Row 2: {component.sub-nav-frosted} (#f5f5f7/82% blur, height 52px)
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
} from 'lucide-react';
import { DimKhataStore } from '../../lib/storage-store';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Branch, UserProfile } from '../../types';
import { NavTabId } from './Sidebar';

interface NavbarProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  currentUser: UserProfile;
  onToggleUserRole: () => void;
  onOpenRatesModal: () => void;
  onRefresh: () => void;
  currentTab?: NavTabId;
  onSelectTab?: (tab: NavTabId) => void;
}

const TAB_TITLES: Record<NavTabId, string> = {
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

export const Navbar: React.FC<NavbarProps> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  currentUser,
  onToggleUserRole,
  onOpenRatesModal,
  onRefresh,
  currentTab = 'dashboard',
  onSelectTab,
}) => {
  const company = DimKhataStore.getCompany();
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const handleCloudSync = async () => {
    if (!isSupabaseConfigured) {
      alert('ক্লাউড সিঙ্ক ব্যবহারের জন্য GitHub Secrets-এ VITE_SUPABASE_URL এবং VITE_SUPABASE_PUBLISHABLE_KEY যুক্ত করুন। বর্তমানে লোকাল ব্রাউজার মোডে সব তথ্য সংরক্ষিত হচ্ছে।');
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
        alert('ডাটাবেজ ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!');
        onRefresh();
      } else {
        alert('ভুল ফাইল ফরম্যাট! দয়া করে সঠিক JSON ফাইল নির্বাচন করুন।');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('আপনি কি নিশ্চিত যে প্রাথমিক ডেমো ডাটা রিসেট করতে চান?')) {
      DimKhataStore.resetToDemoData();
      alert('সফলভাবে প্রাথমিক ডেমো ডাটা লোড হয়েছে!');
      onRefresh();
    }
  };

  return (
    <div className="sticky top-0 z-40 no-print">
      {/* ROW 1: {component.global-nav} — 44px Pure Black Top Bar */}
      <div className="apple-global-nav px-3 sm:px-6 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <button
            type="button"
            onClick={() => onSelectTab?.('dashboard')}
            className="flex items-center gap-2 text-white shrink-0 cursor-pointer active:scale-95 transition"
          >
            <span className="text-[15px]">🥚</span>
            <span className="font-semibold text-[13px] tracking-[-0.12px]">
              {company.company_name_bn}
            </span>
            <span className="hidden md:inline text-[#cccccc] text-[11px]">
              • ডিমখাতা ERP
            </span>
          </button>

          {/* Global Utility Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 bg-[#272729] text-white rounded-full px-2.5 py-1 text-[11px]">
              <Store className="w-3 h-3 text-[#2997ff] shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                aria-label="শাখা নির্বাচন"
                className="bg-transparent text-white focus:outline-none cursor-pointer text-[11px] max-w-[125px] sm:max-w-none truncate"
              >
                <option value="ALL" className="bg-[#1d1d1f] text-white">
                  সকল শাখা (একত্রিত)
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#1d1d1f] text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cloud Sync Status Button */}
            <button
              type="button"
              onClick={handleCloudSync}
              title={
                isSupabaseConfigured
                  ? 'Supabase ক্লাউডের সাথে লাইভ সিঙ্ক করুন'
                  : 'অফলাইন লোকাল স্টোরেজ সক্রিয়'
              }
              className="flex items-center gap-1.5 bg-[#272729] text-white rounded-full px-2.5 py-1 text-[11px] cursor-pointer active:scale-95 transition"
            >
              {syncDone ? (
                <Check className="w-3 h-3 text-[#2997ff]" />
              ) : (
                <Cloud
                  className={`w-3 h-3 ${
                    isSupabaseConfigured ? 'text-[#2997ff]' : 'text-[#cccccc]'
                  } ${syncing ? 'animate-pulse' : ''}`}
                />
              )}
              <span className="hidden sm:inline">
                {syncing
                  ? 'সিঙ্ক হচ্ছে...'
                  : syncDone
                  ? 'সিঙ্ক সম্পন্ন'
                  : isSupabaseConfigured
                  ? 'ক্লাউড অনলাইন'
                  : 'লোকাল মোড'}
              </span>
            </button>

            {/* User Role Switcher (Admin vs Staff) */}
            <button
              type="button"
              onClick={onToggleUserRole}
              title="ক্লিক করে মালিক (অ্যাডমিন) ও কর্মচারী (স্টাফ) মোড পরিবর্তন করুন"
              className="flex items-center gap-1.5 bg-[#272729] text-white rounded-full px-2.5 py-1 text-[11px] cursor-pointer active:scale-95 transition"
            >
              {currentUser.role === 'ADMIN' ? (
                <ShieldCheck className="w-3 h-3 text-[#2997ff]" />
              ) : (
                <UserCheck className="w-3 h-3 text-[#cccccc]" />
              )}
              <span className="font-semibold">
                {currentUser.role === 'ADMIN' ? 'মালিক (শরিফ)' : 'স্টাফ (কাওসার)'}
              </span>
            </button>

            {/* Backup & Restore Icons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                title="সম্পূর্ণ ডাটা ব্যাকআপ ডাউনলোড (JSON)"
                className="w-7 h-7 rounded-full bg-[#272729] text-[#cccccc] hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <label
                title="ব্যাকআপ ফাইল রিস্টোর করুন"
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
                onClick={handleResetDemo}
                title="ডেমো ডাটা রিসেট"
                className="w-7 h-7 rounded-full bg-[#272729] text-[#cccccc] hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: {component.sub-nav-frosted} — 52px Frosted Parchment Bar */}
      <div className="apple-sub-nav px-3 sm:px-6 flex items-center">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-3 py-1.5">
          {/* Active Category / Module Name in {typography.tagline} (21px / 600) */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-[17px] sm:text-[21px] font-semibold text-[#1d1d1f] tracking-[0.231px] truncate">
              {TAB_TITLES[currentTab] || 'ডিমখাতা'}
            </h1>
          </div>

          {/* Right Quick Actions: Secondary Pill + Primary Action Blue Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenRatesModal}
              className="btn-secondary-pill !min-h-[34px] !py-1.5 !px-3.5 !text-[13px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>আজকের দর</span>
            </button>

            {currentTab !== 'sales-pos' && onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('sales-pos')}
                className="btn-primary !min-h-[34px] !py-1.5 !px-3.5 !text-[13px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>বিক্রয় মেমো</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
