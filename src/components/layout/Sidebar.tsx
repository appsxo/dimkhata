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
  LogOut,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { UserRole, UserProfile } from '../../types';
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
  currentUser?: UserProfile;
  onLogout?: () => void;
  onOpenSecurityModal?: () => void;
  onRequestBackup?: () => void;
}

interface NavItem {
  id: NavTabId;
  labelBn: string;
  labelEn: string;
  shortBn: string;
  shortEn: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  section: 'DAILY' | 'ADMIN';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', labelBn: 'হোম ও লাইভ স্টক', labelEn: 'Home & Stock', shortBn: 'হোম', shortEn: 'Home', icon: LayoutDashboard, section: 'DAILY' },
  { id: 'sales-pos', labelBn: 'বিক্রয় মেমো (POS)', labelEn: 'Sales Memo (POS)', shortBn: 'মেমো', shortEn: 'POS', icon: Receipt, section: 'DAILY' },
  { id: 'sourcing', labelBn: 'ডিম কেনা (ক্রয়)', labelEn: 'Egg Sourcing', shortBn: 'ডিম কেনা', shortEn: 'Buy', icon: Truck, section: 'DAILY' },
  { id: 'parties', labelBn: 'কাস্টমার ও মহাজন', labelEn: 'Parties & Dues', shortBn: 'বাকি খাতা', shortEn: 'Parties', icon: Users, section: 'DAILY' },
  { id: 'daily-pricing', labelBn: 'আজকের বাজার দর', labelEn: "Today's Rates", shortBn: 'বাজার দর', shortEn: 'Rates', icon: Tag, section: 'DAILY' },
  { id: 'wastage-courtesy', labelBn: 'ভাঙা ও ট্রান্সফার', labelEn: 'Wastage & Transfer', shortBn: 'ভাঙা/গিফট', shortEn: 'Wastage', icon: AlertTriangle, section: 'DAILY' },
  { id: 'expenses', labelBn: 'দোকান ও গাড়ির খরচ', labelEn: 'Expenses & Assets', shortBn: 'খরচ', shortEn: 'Expenses', icon: TrendingDown, section: 'DAILY' },
  { id: 'cashbook', labelBn: 'ক্যাশবুক ও ব্যাংক', labelEn: 'Cashbook & Bank', shortBn: 'ক্যাশবুক', shortEn: 'Cashbook', icon: Wallet, adminOnly: true, section: 'ADMIN' },
  { id: 'payroll', labelBn: 'কর্মচারী ও বেতন', labelEn: 'Staff & Payroll', shortBn: 'বেতন', shortEn: 'Payroll', icon: Briefcase, adminOnly: true, section: 'ADMIN' },
  { id: 'profit-settlement', labelBn: 'লাভ-লোকসান (২:১)', labelEn: 'Profit Split (2:1)', shortBn: 'লাভ ২:১', shortEn: 'Profit', icon: PieChart, adminOnly: true, section: 'ADMIN' },
  { id: 'audit-branches', labelBn: 'শাখা ও অডিট লগ', labelEn: 'Branches & Audit', shortBn: 'অডিট', shortEn: 'Audit', icon: Shield, adminOnly: true, section: 'ADMIN' },
];

const MOBILE_PRIMARY_IDS: NavTabId[] = ['dashboard', 'sales-pos', 'sourcing', 'parties'];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  currentUser,
  onLogout,
  onOpenSecurityModal,
  onRequestBackup,
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || userRole === 'ADMIN');
  const dailyItems = visibleItems.filter((i) => i.section === 'DAILY');
  const adminItems = visibleItems.filter((i) => i.section === 'ADMIN');

  const handleDownloadBackup = () => {
    if (onRequestBackup) {
      onRequestBackup();
    }
  };

  return (
    <>
      <aside className="hidden md:flex md:w-60 bg-white border-r border-[#e0e0e0] flex-col shrink-0 no-print select-none">
        <div className="p-3 space-y-4 overflow-y-auto sticky top-[92px] max-h-[calc(100vh-92px)] flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div>
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
                {t('দৈনন্দিন লেনদেন', 'Daily Operations')}
              </div>
              <div className="space-y-0.5">
                {dailyItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-[13.5px] transition cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-[#0066cc] text-white font-semibold'
                          : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#0066cc]'}`} />
                      <span className="truncate">{lang === 'bn' ? item.labelBn : item.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {adminItems.length > 0 && (
              <div className="pt-2.5 border-t border-[#f0f0f0]">
                <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7a7a7a]">
                  {t('মালিক ও একাউন্টস', 'Owner & Accounts')}
                </div>
                <div className="space-y-0.5">
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-[13.5px] transition cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-[#0066cc] text-white font-semibold'
                            : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#0066cc]'}`} />
                        <span className="truncate">{lang === 'bn' ? item.labelBn : item.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {currentUser && (
            <div className="pt-3 border-t border-[#f0f0f0]">
              <div className="p-2.5 rounded-xl bg-[#f5f5f7] border border-[#e0e0e0] flex items-center justify-between">
                <div className="min-w-0 pr-1">
                  <div className="text-[12px] font-semibold text-[#1d1d1f] truncate">
                    {currentUser.full_name}
                  </div>
                  <div className="text-[10px] text-[#7a7a7a] font-medium flex items-center gap-1">
                    {currentUser.role === 'ADMIN' ? (
                      <span className="text-[#0066cc] font-semibold">● {t('মালিক', 'Admin')}</span>
                    ) : (
                      <span>● {t('স্টাফ', 'Staff')}</span>
                    )}
                  </div>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title={t('লক ও প্রস্থান', 'Lock & Exit')}
                    className="w-8 h-8 rounded-full bg-white border border-[#e0e0e0] hover:bg-[#ff3b30]/10 text-[#7a7a7a] hover:text-[#ff3b30] flex items-center justify-center cursor-pointer active:scale-95 transition shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 apple-floating-sticky-bar px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] no-print select-none"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {MOBILE_PRIMARY_IDS.map((id) => {
            const item = NAV_ITEMS.find((i) => i.id === id)!;
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
                className={`flex flex-col items-center justify-center min-h-[46px] rounded-[12px] transition active:scale-95 ${
                  isActive ? 'text-[#0066cc] bg-[#0066cc]/8 font-semibold' : 'text-[#7a7a7a]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10.5px] mt-0.5 truncate max-w-full px-1">
                  {lang === 'bn' ? item.shortBn : item.shortEn}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center min-h-[46px] rounded-[12px] transition active:scale-95 ${
              mobileMenuOpen || !MOBILE_PRIMARY_IDS.includes(currentTab)
                ? 'text-[#0066cc] bg-[#0066cc]/8 font-semibold'
                : 'text-[#7a7a7a]'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10.5px] mt-0.5">{t('সব মেনু', 'Menu')}</span>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end no-print"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-[#f5f5f7] w-full rounded-t-[24px] border-t border-[#e0e0e0] p-4 pb-24 max-h-[82vh] overflow-y-auto space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[#d2d2d7] mx-auto" />
            <div className="flex items-center justify-between pb-2 border-b border-[#e0e0e0]">
              <h3 className="text-[17px] font-semibold text-[#1d1d1f]">
                {t('সকল মেনু', 'All Modules')}
              </h3>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-icon-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                    className={`p-3 rounded-[14px] border text-left flex items-center gap-2.5 transition active:scale-95 ${
                      isActive
                        ? 'bg-[#0066cc] text-white border-[#0066cc] font-semibold'
                        : 'bg-white text-[#1d1d1f] border-[#e0e0e0]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#f5f5f7] text-[#0066cc]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[12.5px] leading-snug">
                      {lang === 'bn' ? item.labelBn : item.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`pt-2 border-t border-[#e0e0e0] grid ${userRole === 'ADMIN' ? 'grid-cols-4' : 'grid-cols-2'} gap-1.5`}>
              <button
                type="button"
                onClick={toggleLanguage}
                className="p-2 rounded-[12px] bg-white border border-[#e0e0e0] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#1d1d1f] active:scale-95"
              >
                <Globe className="w-4 h-4 text-[#0066cc]" />
                <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
              </button>
              {userRole === 'ADMIN' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSecurityModal?.();
                    }}
                    className="p-2 rounded-[12px] bg-white border border-[#e0e0e0] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#1d1d1f] active:scale-95"
                  >
                    <Lock className="w-4 h-4 text-[#0066cc]" />
                    <span>{t('নিরাপত্তা', 'Security')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleDownloadBackup();
                    }}
                    className="p-2 rounded-[12px] bg-white border border-[#e0e0e0] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#1d1d1f] active:scale-95"
                  >
                    <Download className="w-4 h-4 text-[#0066cc]" />
                    <span>{t('ব্যাকআপ', 'Backup')}</span>
                  </button>
                </>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="p-2 rounded-[12px] bg-[#fff2f4] border border-[#ffd1d9] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#bf0013] active:scale-95"
                >
                  <LogOut className="w-4 h-4 text-[#bf0013]" />
                  <span>{t('লক', 'Lock')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
