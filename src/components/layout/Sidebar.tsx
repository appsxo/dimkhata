// ====================================================================
// DIMKHATA (ডিমখাতা) — Apple Store Navigation Rail & Mobile Sticky Dock
// Desktop: Clean White/Parchment Navigation Rail with Action Blue #0066cc
// Mobile: Sticky Frosted Bottom Dock ({component.floating-sticky-bar}) + Menu Sheet
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
} from 'lucide-react';
import { UserRole } from '../../types';

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
}

interface NavItem {
  id: NavTabId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  section: 'DAILY' | 'ADMIN';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'হোম ও লাইভ স্টক',
      shortLabel: 'হোম/স্টক',
      icon: LayoutDashboard,
      section: 'DAILY',
    },
    {
      id: 'sales-pos',
      label: 'বিক্রয় মেমো ও চালান (POS)',
      shortLabel: 'বিক্রয় মেমো',
      icon: Receipt,
      section: 'DAILY',
    },
    {
      id: 'sourcing',
      label: 'মহাজন থেকে ডিম কেনা',
      shortLabel: 'ডিম কেনা',
      icon: Truck,
      section: 'DAILY',
    },
    {
      id: 'parties',
      label: 'কাস্টমার ও মহাজন বাকি',
      shortLabel: 'বাকি খাতা',
      icon: Users,
      section: 'DAILY',
    },
    {
      id: 'daily-pricing',
      label: 'আজকের বাজার দর (৫টি)',
      shortLabel: 'বাজার দর',
      icon: Tag,
      section: 'DAILY',
    },
    {
      id: 'wastage-courtesy',
      label: 'ভাঙা, সৌজন্য ও ট্রান্সফার',
      shortLabel: 'ভাঙা/সৌজন্য',
      icon: AlertTriangle,
      section: 'DAILY',
    },
    {
      id: 'expenses',
      label: 'দোকান ও গাড়ির খরচ',
      shortLabel: 'খরচ খাতা',
      icon: TrendingDown,
      section: 'DAILY',
    },
    {
      id: 'cashbook',
      label: 'ক্যাশবুক ও ব্যাংক একাউন্ট',
      shortLabel: 'ক্যাশ ও ব্যাংক',
      icon: Wallet,
      adminOnly: true,
      section: 'ADMIN',
    },
    {
      id: 'payroll',
      label: 'কর্মচারী ও বেতন হিসাব',
      shortLabel: 'বেতন খাতা',
      icon: Briefcase,
      adminOnly: true,
      section: 'ADMIN',
    },
    {
      id: 'profit-settlement',
      label: 'লাভ-লোকসান ও ২:১ বণ্টন',
      shortLabel: 'লাভ ২:১',
      icon: PieChart,
      adminOnly: true,
      section: 'ADMIN',
    },
    {
      id: 'audit-branches',
      label: 'শাখা ও ডিজিটাল অডিট লগ',
      shortLabel: 'শাখা ও অডিট',
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

  return (
    <>
      {/* DESKTOP SIDEBAR RAIL (md and up) */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-[#e0e0e0] flex-col shrink-0 no-print">
        <div className="p-3 space-y-5 overflow-y-auto sticky top-[96px] max-h-[calc(100vh-96px)]">
          {/* Group 1: Daily Operations */}
          <div>
            <div className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
              দৈনন্দিন হিসাব ও লেনদেন
            </div>
            <div className="space-y-1">
              {dailyItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
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
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Admin Only */}
          {adminItems.length > 0 && (
            <div className="pt-3 border-t border-[#f0f0f0]">
              <div className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
                মালিক ও মূল একাউন্ট (অ্যাডমিন)
              </div>
              <div className="space-y-1">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
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
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-4 border-t border-[#f0f0f0] px-3.5 text-[12px] text-[#7a7a7a]">
            <div className="flex items-center justify-between">
              <span>Apple UI v2.0</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#0066cc]" />
            </div>
            <p className="mt-0.5 text-[11px]">শরিফ এন্ড ইমান এন্টারপ্রাইজ</p>
          </div>
        </div>
      </aside>

      {/* MOBILE STICKY BOTTOM DOCK ({component.floating-sticky-bar}) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 apple-floating-sticky-bar px-2 py-1.5 no-print">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {mobilePrimaryIds.map((id) => {
            const item = navItems.find((i) => i.id === id)!;
            const Icon = item.icon;
            const isActive = currentTab === item.id && !mobileMenuOpen;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectTab(item.id);
                }}
                className={`flex flex-col items-center justify-center min-h-[48px] rounded-[11px] transition active:scale-95 ${
                  isActive
                    ? 'text-[#0066cc] font-semibold'
                    : 'text-[#7a7a7a] font-normal'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] mt-0.5 truncate max-w-full px-1">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}

          {/* 5th Button: Full Menu Sheet */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-[11px] transition active:scale-95 ${
              mobileMenuOpen || !mobilePrimaryIds.includes(currentTab)
                ? 'text-[#0066cc] font-semibold'
                : 'text-[#7a7a7a] font-normal'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">সব মেনু</span>
          </button>
        </div>
      </nav>

      {/* MOBILE FULL MENU BOTTOM SHEET */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end no-print">
          <div className="bg-[#f5f5f7] w-full rounded-t-[22px] border-t border-[#e0e0e0] p-5 pb-24 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e0e0e0]">
              <div>
                <h3 className="text-[19px] font-semibold text-[#1d1d1f]">
                  সকল মেনু ও ফিচার
                </h3>
                <p className="text-[12px] text-[#7a7a7a]">
                  যেকোনো অপশনে ট্যাপ করে সরাসরি যান
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
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-3.5 rounded-[18px] border text-left flex items-center gap-3 transition active:scale-95 ${
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
                    <span className="text-[13px] leading-snug">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
