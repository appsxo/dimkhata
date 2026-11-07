// ====================================================================
// DIMKHATA (ডিমখাতা) — Apple Store Navigation Rail & Mobile App Dock
// Desktop: Clean White/Parchment Navigation Rail with Action Blue #0066cc
// Mobile: Native App Frosted Bottom Dock + Full Feature Drawer Sheet
// ====================================================================

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Tag,
  Truck,
  Receipt,
  AlertTriangle,
  Users,
  Wallet,
  Briefcase,
  TrendingDown,
  PieChart,
  Shield,
  Menu,
  X,
  Download,
  Lock,
  Globe,
} from 'lucide-react';
import { UserRole } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { DimKhataStore } from '../../lib/storage-store';

export type NavTabId =
  | 'dashboard'
  | 'daily-pricing'
  | 'sourcing'
  | 'sales-pos'
  | 'wastage-courtesy'
  | 'parties'
  | 'cashbook'
  | 'payroll'
  | 'expenses'
  | 'profit-settlement'
  | 'audit-branches';

interface SidebarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  userRole: UserRole;
  onOpenSecurityModal?: () => void;
}

interface NavItem {
  id: NavTabId;
  labelBn: string;
  labelEn: string;
  shortLabelBn: string;
  shortLabelEn: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  section: 'DAILY' | 'ADMIN';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  onOpenSecurityModal,
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      labelBn: 'হোম ও লাইভ স্টক',
      labelEn: 'Home & Live Stock',
      shortLabelBn: 'হোম/স্টক',
      shortLabelEn: 'Home',
      icon: LayoutDashboard,
      section: 'DAILY',
    },
    {
      id: 'sales-pos',
      labelBn: 'বিক্রয় মেমো ও চালান (POS)',
      labelEn: 'Sales Memo & POS',
      shortLabelBn: 'বিক্রয় মেমো',
      shortLabelEn: 'POS Memo',
      icon: Receipt,
      section: 'DAILY',
    },
    {
      id: 'sourcing',
      labelBn: 'মহাজন থেকে ডিম কেনা',
      labelEn: 'Egg Sourcing & Buy',
      shortLabelBn: 'ডিম কেনা',
      shortLabelEn: 'Sourcing',
      icon: Truck,
      section: 'DAILY',
    },
    {
      id: 'parties',
      labelBn: 'কাস্টমার ও মহাজন খাতা',
      labelEn: 'Customers & Suppliers',
      shortLabelBn: 'বাকি খাতা',
      shortLabelEn: 'Parties',
      icon: Users,
      section: 'DAILY',
    },
    {
      id: 'daily-pricing',
      labelBn: 'আজকের বাজার দর (৫টি)',
      labelEn: "Today's Market Rates",
      shortLabelBn: 'বাজার দর',
      shortLabelEn: 'Rates',
      icon: Tag,
      section: 'DAILY',
    },
    {
      id: 'wastage-courtesy',
      labelBn: 'ভাঙা, সৌজন্য ও ট্রান্সফার',
      labelEn: 'Wastage & Transfer',
      shortLabelBn: 'ভাঙা/সৌজন্য',
      shortLabelEn: 'Wastage',
      icon: AlertTriangle,
      section: 'DAILY',
    },
    {
      id: 'expenses',
      labelBn: 'দোকান ও গাড়ির খরচ',
      labelEn: 'Shop & Vehicle Expenses',
      shortLabelBn: 'খরচ খাতা',
      shortLabelEn: 'Expenses',
      icon: TrendingDown,
      section: 'DAILY',
    },
    {
      id: 'cashbook',
      labelBn: 'ক্যাশবুক ও ব্যাংক একাউন্ট',
      labelEn: 'Cashbook & Banking',
      shortLabelBn: 'ক্যাশ ও ব্যাংক',
      shortLabelEn: 'Cashbook',
      icon: Wallet,
      adminOnly: true,
      section: 'ADMIN',
    },
    {
      id: 'payroll',
      labelBn: 'কর্মচারী ও বেতন হিসাব',
      labelEn: 'Employees & Payroll',
      shortLabelBn: 'বেতন খাতা',
      shortLabelEn: 'Payroll',
      icon: Briefcase,
      adminOnly: true,
      section: 'ADMIN',
    },
    {
      id: 'profit-settlement',
      labelBn: 'লাভ-লোকসান ও ২:১ বণ্টন',
      labelEn: 'Profit & 2:1 Split',
      shortLabelBn: 'লাভ ২:১',
      shortLabelEn: 'Profit 2:1',
      icon: PieChart,
      adminOnly: true,
      section: 'ADMIN',
    },
    {
      id: 'audit-branches',
      labelBn: 'শাখা ও ডিজিটাল অডিট লগ',
      labelEn: 'Branches & Audit Log',
      shortLabelBn: 'শাখা ও অডিট',
      shortLabelEn: 'Audit Log',
      icon: Shield,
      adminOnly: true,
      section: 'ADMIN',
    },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === 'ADMIN'
  );
  const dailyItems = visibleItems.filter((i) => i.section === 'DAILY');
  const adminItems = visibleItems.filter((i) => i.section === 'ADMIN');

  // 4 Primary Tabs for Mobile Bottom Dock + 5th "All Menu" button
  const mobilePrimaryIds: NavTabId[] = [
    'dashboard',
    'sales-pos',
    'sourcing',
    'parties',
  ];

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

  return (
    <>
      {/* DESKTOP SIDEBAR RAIL (md and up) */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-[#e0e0e0] flex-col shrink-0 no-print select-none">
        <div className="p-3 space-y-5 overflow-y-auto sticky top-[96px] max-h-[calc(100vh-96px)]">
          {/* Group 1: Daily Operations */}
          <div>
            <div className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
              {t('দৈনন্দিন হিসাব ও লেনদেন', 'Daily Operations')}
            </div>
            <div className="space-y-1">
              {dailyItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const label = lang === 'bn' ? item.labelBn : item.labelEn;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[14px] transition cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-[#0066cc] text-white font-semibold'
                        : 'text-[#1d1d1f] hover:bg-[#f5f5f7] font-normal'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-[#0066cc]'
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Admin Only */}
          {adminItems.length > 0 && (
            <div className="pt-3 border-t border-[#f0f0f0]">
              <div className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
                {t('মালিক ও মূল একাউন্ট (অ্যাডমিন)', 'Owner & Accounting (Admin)')}
              </div>
              <div className="space-y-1">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  const label = lang === 'bn' ? item.labelBn : item.labelEn;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[14px] transition cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-[#0066cc] text-white font-semibold'
                          : 'text-[#1d1d1f] hover:bg-[#f5f5f7] font-normal'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#0066cc]'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-4 border-t border-[#f0f0f0] px-3.5 text-[12px] text-[#7a7a7a]">
            <div className="flex items-center justify-between">
              <span>{t('ক্লাউড সিঙ্ক সক্রিয়', 'Supabase Cloud Sync')}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#30d158]" />
            </div>
            <p className="mt-0.5 text-[11px]">
              {t('শরিফ এন্ড ইমান এন্টারপ্রাইজ', 'Sharif & Eman Enterprise')}
            </p>
          </div>
        </div>
      </aside>

      {/* MOBILE STICKY BOTTOM DOCK ({component.floating-sticky-bar}) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 apple-floating-sticky-bar px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] no-print select-none"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {mobilePrimaryIds.map((id) => {
            const item = navItems.find((i) => i.id === id)!;
            const Icon = item.icon;
            const isActive = currentTab === item.id && !mobileMenuOpen;
            const shortLabel = lang === 'bn' ? item.shortLabelBn : item.shortLabelEn;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectTab(item.id);
                }}
                className={`flex flex-col items-center justify-center min-h-[48px] rounded-[12px] transition active:scale-95 ${
                  isActive
                    ? 'text-[#0066cc] bg-[#0066cc]/8 font-semibold'
                    : 'text-[#7a7a7a] font-normal'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10.5px] mt-0.5 truncate max-w-full px-1">
                  {shortLabel}
                </span>
              </button>
            );
          })}

          {/* 5th Button: Full Menu Sheet */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-[12px] transition active:scale-95 ${
              mobileMenuOpen || !mobilePrimaryIds.includes(currentTab)
                ? 'text-[#0066cc] bg-[#0066cc]/8 font-semibold'
                : 'text-[#7a7a7a] font-normal'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10.5px] mt-0.5">{t('সব মেনু', 'Menu')}</span>
          </button>
        </div>
      </nav>

      {/* MOBILE FULL MENU BOTTOM SHEET */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end no-print"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-[#f5f5f7] w-full rounded-t-[24px] border-t border-[#e0e0e0] p-4 sm:p-5 pb-24 max-h-[85vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[#d2d2d7] mx-auto mb-1" />
            <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e0e0]">
              <div>
                <h3 className="text-[18px] font-semibold text-[#1d1d1f]">
                  {t('সকল মেনু ও অপশন', 'All Modules & Settings')}
                </h3>
                <p className="text-[12px] text-[#7a7a7a]">
                  {t('যেকোনো ফিচারে যেতে ট্যাপ করুন', 'Tap any module to open immediately')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-icon-circle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const label = lang === 'bn' ? item.labelBn : item.labelEn;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-3 rounded-[16px] border text-left flex items-center gap-2.5 transition active:scale-95 ${
                      isActive
                        ? 'bg-[#0066cc] text-white border-[#0066cc] font-semibold'
                        : 'bg-white text-[#1d1d1f] border-[#e0e0e0] font-normal'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#f5f5f7] text-[#0066cc]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[12.5px] leading-snug">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Quick Utility Actions */}
            <div className="pt-2 border-t border-[#e0e0e0] grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                className="p-2.5 rounded-[12px] bg-white border border-[#e0e0e0] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#1d1d1f] active:scale-95"
              >
                <Globe className="w-4 h-4 text-[#0066cc]" />
                <span>{lang === 'bn' ? 'English Mode' : 'বাংলা মোড'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSecurityModal?.();
                }}
                className="p-2.5 rounded-[12px] bg-white border border-[#e0e0e0] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#1d1d1f] active:scale-95"
              >
                <Lock className="w-4 h-4 text-[#0066cc]" />
                <span>{t('নিরাপত্তা ও ক্লাউড', 'Security & Cloud')}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="p-2.5 rounded-[12px] bg-white border border-[#e0e0e0] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#1d1d1f] active:scale-95"
              >
                <Download className="w-4 h-4 text-[#0066cc]" />
                <span>{t('ব্যাকআপ ডাউনলোড', 'JSON Backup')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
