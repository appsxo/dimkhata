// ====================================================================
// DIMKHATA (ডিমখাতা) — Sidebar Navigation
// ====================================================================

import React from 'react';
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
  HelpCircle,
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
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'ড্যাশবোর্ড ও লাইভ স্টক',
      icon: LayoutDashboard,
    },
    {
      id: 'daily-pricing',
      label: 'ডিমের দর ও ক্যাটাগরি',
      icon: Tag,
      badge: '৫ ক্যাটাগরি',
    },
    {
      id: 'sourcing',
      label: 'সোর্সিং ও কেনা (মহাজন)',
      icon: Truck,
      badge: 'ল্যান্ডেড কস্ট',
    },
    {
      id: 'sales-pos',
      label: 'বিক্রয় মেমো ও চালান (POS)',
      icon: Receipt,
      badge: 'পাইকারি/খুচরা',
    },
    {
      id: 'wastage-courtesy',
      label: 'ভাঙা/পচা ও সৌজন্য ডিম',
      icon: AlertTriangle,
    },
    {
      id: 'parties',
      label: 'কাস্টমার ও মহাজন (KYC)',
      icon: Users,
    },
    {
      id: 'cashbook',
      label: 'ক্যাশ ও ব্যাংক হিসাব',
      icon: Wallet,
      badge: 'লাইভ সিঙ্ক',
    },
    {
      id: 'payroll',
      label: 'কর্মচারী ও বেতন পে-রোল',
      icon: Briefcase,
    },
    {
      id: 'expenses',
      label: 'পরিচালনা ও বিবিধ খরচ',
      icon: TrendingDown,
    },
    {
      id: 'profit-settlement',
      label: 'লাভ-লোকসান ও ২:১ বণ্টন',
      icon: PieChart,
      adminOnly: true,
      badge: 'শরিফ:ইমান',
    },
    {
      id: 'audit-branches',
      label: 'ডিজিটাল অডিট ও শাখা',
      icon: Shield,
      adminOnly: true,
      badge: 'লগ রেকর্ড',
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 no-print">
      <div className="p-3 border-b border-slate-100 hidden md:block">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          মূল মেনু
        </div>
      </div>

      <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isRestricted = item.adminOnly && userRole !== 'ADMIN';

          if (isRestricted) return null;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition group ${
                isActive
                  ? 'bg-amber-500 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-amber-50 hover:text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-amber-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold transition ${
                    isActive
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="mt-auto p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] hidden md:block">
        <div className="flex items-center justify-between">
          <span>সংস্করণ: ২.০ (Enterprise)</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <p className="mt-0.5 text-slate-400">ক্লাউড রেডি ও অফলাইন সমর্থিত</p>
      </div>
    </aside>
  );
};
