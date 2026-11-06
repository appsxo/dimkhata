// ====================================================================
// DIMKHATA (ডিমখাতা) — Editorial Top Navigation (ElevenLabs Design System)
// Canvas: #f5f5f5 | Ink: #0c0a09 | CTAs: Near-black ink pill (#292524)
// ====================================================================

import React from 'react';
import { 
  Building2, 
  UserCheck, 
  RotateCcw, 
  Download, 
  Upload, 
  ShieldCheck, 
  Store,
  Sparkles
} from 'lucide-react';
import { DimKhataStore } from '../../lib/storage-store';
import { Branch, UserProfile } from '../../types';

interface NavbarProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  currentUser: UserProfile;
  onToggleUserRole: () => void;
  onOpenRatesModal: () => void;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  currentUser,
  onToggleUserRole,
  onOpenRatesModal,
  onRefresh,
}) => {
  const company = DimKhataStore.getCompany();

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
    if (confirm('আপনি কি নিশ্চিত যে ডেমো ডাটাবেজ রিসেট করতে চান? আপনার টেস্ট ডাটা মুছে যাবে।')) {
      DimKhataStore.resetToDemoData();
      alert('সফলভাবে প্রাথমিক ডেমো ডাটা লোড হয়েছে!');
      onRefresh();
    }
  };

  return (
    <header className="bg-[#f5f5f5]/90 backdrop-blur-md border-b border-[#e7e5e4] text-[#0c0a09] sticky top-0 z-40 h-16 no-print">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 h-full flex items-center justify-between gap-3">
        {/* Brand & Wordmark (Editorial Display) */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#f0efed] border border-[#e7e5e4] flex items-center justify-center text-lg shrink-0">
            🥚
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-light text-xl tracking-tight text-[#0c0a09] leading-tight">
                {company.company_name_bn}
              </h1>
              <span className="badge-pill text-[10px] py-0.5 px-2">
                Enterprise
              </span>
            </div>
            <p className="text-[12px] text-[#777169] hidden sm:block font-normal -mt-0.5">
              {company.company_name_en} — {company.tagline}
            </p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Branch Switcher (Pill geometry) */}
          <div className="flex items-center bg-white border border-[#e7e5e4] rounded-full px-3 py-1.5 text-xs text-[#292524] shadow-xs">
            <Store className="w-3.5 h-3.5 mr-1.5 text-[#777169]" />
            <select
              value={selectedBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer pr-2 text-xs"
            >
              <option value="ALL">সকল শাখা (একত্রিত হিসাব)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.branch_code})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Rate Update Button (Primary Ink Pill) */}
          <button
            onClick={onOpenRatesModal}
            className="btn-primary text-xs h-9 px-4 hidden sm:inline-flex"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>বাজার দর আপডেট</span>
          </button>

          {/* User Role Switcher (Pill geometry) */}
          <button
            onClick={onToggleUserRole}
            title="ক্লিক করে অ্যাডমিন ও স্টাফ ভিউ পরিবর্তন করুন"
            className="btn-outline text-xs h-9 px-3.5 gap-2"
          >
            {currentUser.role === 'ADMIN' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-[#292524]" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-[#777169]" />
            )}
            <div className="flex flex-col text-left">
              <span className="leading-tight text-[12px] font-medium text-[#0c0a09]">{currentUser.full_name}</span>
              <span className="text-[9px] text-[#777169] uppercase font-semibold tracking-wider">
                {currentUser.role === 'ADMIN' ? 'অ্যাডমিন' : 'স্টাফ'}
              </span>
            </div>
          </button>

          {/* Backup & Tools Menu */}
          <div className="flex items-center gap-1 bg-white border border-[#e7e5e4] rounded-full p-1 shadow-xs">
            <button
              onClick={handleDownloadBackup}
              title="সম্পূর্ণ ব্যাকআপ JSON ডাউনলোড করুন"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#777169] hover:text-[#0c0a09] hover:bg-[#f0efed] transition"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <label
              title="ব্যাকআপ রিস্টোর করুন"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#777169] hover:text-[#0c0a09] hover:bg-[#f0efed] transition cursor-pointer"
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
              onClick={handleResetDemo}
              title="ডেমো ডাটা রিসেট করুন"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#777169] hover:text-[#dc2626] hover:bg-rose-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
