// ====================================================================
// DIMKHATA (ডিমখাতা) — Main Navigation Header
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
  ChevronDown,
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
    <header className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white shadow-md sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-300/40 flex items-center justify-center text-2xl shadow-inner">
            🥚
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg sm:text-xl tracking-tight leading-none text-white">
                {company.company_name_bn}
              </h1>
              <span className="text-[10px] bg-amber-500/40 text-amber-100 font-semibold px-2 py-0.5 rounded-full border border-amber-400/30">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-amber-200/80 font-medium hidden sm:block">
              {company.tagline}
            </p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Branch Switcher (Req 3) */}
          <div className="relative flex items-center bg-amber-950/40 border border-amber-600/40 rounded-lg px-2.5 py-1 text-xs">
            <Store className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
            <select
              value={selectedBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="bg-transparent text-amber-100 font-medium focus:outline-none cursor-pointer pr-4"
            >
              <option value="ALL" className="bg-stone-900 text-white">
                সকল শাখা (একত্রিত হিসাব)
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-stone-900 text-white">
                  {b.name} ({b.branch_code})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Rate Update Button (Req 6) */}
          <button
            onClick={onOpenRatesModal}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>বাজার দর আপডেট</span>
          </button>

          {/* User Role Switcher (Admin vs Staff) */}
          <button
            onClick={onToggleUserRole}
            title="ক্লিক করে অ্যাডমিন ও স্টাফ ভিউ পরিবর্তন করুন"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition ${
              currentUser.role === 'ADMIN'
                ? 'bg-emerald-600/30 border-emerald-400/40 text-emerald-200 hover:bg-emerald-600/40'
                : 'bg-blue-600/30 border-blue-400/40 text-blue-200 hover:bg-blue-600/40'
            }`}
          >
            {currentUser.role === 'ADMIN' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-blue-300" />
            )}
            <div className="flex flex-col text-left">
              <span className="leading-tight">{currentUser.full_name}</span>
              <span className="text-[9px] opacity-80 leading-none">
                {currentUser.role === 'ADMIN' ? '👑 অ্যাডমিন' : '👨‍💼 স্টাফ'}
              </span>
            </div>
          </button>

          {/* Backup & Tools Menu */}
          <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-600/40 rounded-lg p-0.5">
            <button
              onClick={handleDownloadBackup}
              title="সম্পূর্ণ ব্যাকআপ JSON ডাউনলোড করুন"
              className="p-1.5 hover:bg-amber-800/60 rounded text-amber-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <label
              title="ব্যাকআপ রিস্টোর করুন"
              className="p-1.5 hover:bg-amber-800/60 rounded text-amber-200 transition cursor-pointer"
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
              className="p-1.5 hover:bg-red-800/50 rounded text-rose-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
