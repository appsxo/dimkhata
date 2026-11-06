// ====================================================================
// DIMKHATA (ডিমখাতা) — Editorial Sidebar Navigation (ElevenLabs Design System)
// Canvas: #f5f5f5 | Hairline: #e7e5e4 | Active: Ink Pill or Elevated Card
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
      badge: 'মেমো / চালান',
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
      adminOnly: true,
      badge: 'লাইভ সিঙ্ক',
    },
    {
      id: 'payroll',
      label: 'কর্মচারী ও বেতন পে-রোল',
      icon: Briefcase,
      adminOnly: true,
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
    <aside className="w-full md:w-64 bg-[#f5f5f5] border-r border-[#e7e5e4] flex flex-col shrink-0 no-print">
      <div className="px-4 py-3 border-b border-[#e7e5e4] hidden md:block">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-[#777169]">
          ম্যানেজমেন্ট ডিরেক্টরি
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-[14px] font-medium transition-all group ${
                isActive
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'text-[#4e4e4e] hover:bg-[#f0efed] hover:text-[#0c0a09]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive ? 'text-white' : 'text-[#777169] group-hover:text-[#0c0a09]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#f0efed] text-[#777169] group-hover:bg-[#e7e5e4] group-hover:text-[#0c0a09]'
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
      <div className="mt-auto p-4 bg-[#f5f5f5] border-t border-[#e7e5e4] text-[#777169] text-[12px] hidden md:block">
        <div className="flex items-center justify-between">
          <span>সংস্করণ ২.০ (Editorial)</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
        </div>
        <p className="mt-0.5 text-[#a8a29e] text-[11px]">শরিফ এন্ড ইমান এন্টারপ্রাইজ</p>
      </div>
    </aside>
  );
};
