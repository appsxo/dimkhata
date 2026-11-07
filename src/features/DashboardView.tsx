// ====================================================================
// DIMKHATA (ডিমখাতা) — Apple Design System Dashboard & Live Stock Board
// Canvas: #f5f5f7 | Card: #ffffff (18px, 1px #e0e0e0, 0 shadow) | Accent: #0066cc
// Supports Bilingual (Bangla default + English) & Mobile/Desktop Modes
// ====================================================================

import React from 'react';
import {
  TrendingUp,
  Receipt,
  Truck,
  Wallet,
  Sparkles,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Users,
} from 'lucide-react';
import {
  EggCategory,
  InventoryStock,
  DailyMarketRate,
  Customer,
  SalesInvoice,
  FinancialAccount,
  UserRole,
} from '../types';
import { formatQuantityPcs, formatTaka, toBengaliNumber } from '../lib/egg-units';
import { useLanguage, getCategoryDisplayName } from '../lib/i18n';
import { AppleStatCard } from '../components/ui/AppleUI';

interface DashboardViewProps {
  categories: EggCategory[];
  stocks: InventoryStock[];
  rates: DailyMarketRate[];
  customers: Customer[];
  sales: SalesInvoice[];
  accounts: FinancialAccount[];
  userRole?: UserRole;
  onNavigate: (tab: any) => void;
  onOpenRateModal: () => void;
  onSelectInvoiceForPrint: (inv: SalesInvoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  categories,
  stocks,
  rates,
  customers,
  sales,
  accounts,
  userRole = 'ADMIN',
  onNavigate,
  onOpenRateModal,
  onSelectInvoiceForPrint,
}) => {
  const { t } = useLanguage();

  // Aggregate stock across categories
  const totalStockPcs = stocks.reduce((sum, s) => sum + s.qty_pcs, 0);
  const stockBreakdown = formatQuantityPcs(totalStockPcs, 30);

  // Total cash & bank balances (Admin sees all; Staff sees only Cash Drawer per Req 4)
  const totalLiquidCash = accounts.reduce((sum, a) => sum + a.current_balance, 0);
  const shopCashDrawerBalance = accounts
    .filter((a) => a.account_type === 'CASH')
    .reduce((sum, a) => sum + a.current_balance, 0);

  // Total customer dues
  const totalCustomerDues = customers.reduce((sum, c) => sum + c.current_due, 0);

  // Today's Sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.invoice_date === todayStr);
  const todaySalesRevenue = todaySales.reduce((sum, s) => sum + s.net_total, 0);
  const todayCashCollected = todaySales.reduce((sum, s) => sum + s.paid_amount, 0);

  // High risk due customers
  const highRiskCustomers = customers.filter(
    (c) => c.current_due > 0 && c.current_due >= c.credit_limit * 0.9
  );

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Apple Store Hero Banner (No decorative gradients, clean #ffffff store-utility-card) */}
      <div className="card-apple p-4 sm:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="badge-blue">
              {t('শরিফ এন্ড ইমান এন্টারপ্রাইজ', 'Sharif & Eman Enterprise')}
            </span>
            <span className="text-[12px] text-[#7a7a7a]">
              • {t('সহজ মোবাইল ডিমখাতা ও লাইভ স্টক', 'Cloud Egg ERP & Live Inventory')}
            </span>
          </div>
          <h2 className="font-semibold text-[21px] sm:text-[30px] text-[#1d1d1f] tracking-[-0.02em] leading-[1.15]">
            {t('আজকের মজুদ ও লেনদেন এক নজরে', "Today's Stock & Sales Overview")}
          </h2>
          <p className="text-[14px] sm:text-[16px] text-[#4e4e4e] mt-1 leading-[1.47]">
            {t(
              `গোডাউনে বর্তমানে মোট ${stockBreakdown.crateBreakdown} (${stockBreakdown.totalPcsBn} পিস ডিম) মজুদ আছে। নিচে এক ক্লিকে বিক্রি বা কেনা এন্ট্রি দিন:`,
              `Total live stock in godown: ${stockBreakdown.crateBreakdown} (${stockBreakdown.totalPcsBn} pcs). Record sales or purchases in 1 tap:`
            )}
          </p>
        </div>

        {/* 1-Tap Mobile-First Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => onNavigate('sales-pos')}
            className="btn-primary col-span-2 sm:col-span-1 py-2.5 sm:py-3 px-4 sm:px-5 text-[14px] sm:text-[15px]"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>{t('+ নতুন বিক্রয় মেমো', '+ New Sales Memo')}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('sourcing')}
            className="btn-outline py-2.5 px-3.5 text-[13px] sm:text-[14px]"
          >
            <Truck className="w-4 h-4 text-[#0066cc] shrink-0" />
            <span>{t('ডিম কেনা', 'Buy Eggs')}</span>
          </button>
          <button
            type="button"
            onClick={onOpenRateModal}
            className="btn-outline py-2.5 px-3.5 text-[13px] sm:text-[14px]"
          >
            <Sparkles className="w-4 h-4 text-[#0066cc] shrink-0" />
            <span>{t('আজকের দর', "Today's Rate")}</span>
          </button>
        </div>
      </div>

      {/* 4 Key Apple Stat Cards ({component.store-utility-card}) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AppleStatCard
          label={t('আজকের মোট বিক্রয়', "Today's Total Sales")}
          value={formatTaka(todaySalesRevenue)}
          subtext={
            <span>
              {t('নগদ জমা:', 'Cash In:')}{' '}
              <strong className="text-[#15803d] font-semibold">
                {formatTaka(todayCashCollected)}
              </strong>
            </span>
          }
          icon={<TrendingUp className="w-4 h-4 text-[#0066cc]" />}
          onClick={() => onNavigate('sales-pos')}
        />

        <AppleStatCard
          label={t('গোডাউনে লাইভ মজুদ', 'Live Godown Stock')}
          value={
            <span>
              {stockBreakdown.totalPcsBn}{' '}
              <span className="text-[13px] text-[#7a7a7a] font-normal">
                {t('পিস', 'pcs')}
              </span>
            </span>
          }
          subtext={stockBreakdown.crateBreakdown}
          icon={<span className="text-sm">🥚</span>}
          onClick={() => onNavigate('daily-pricing')}
        />

        <AppleStatCard
          label={
            userRole === 'ADMIN'
              ? t('ক্যাশ ও ব্যাংক তহবিল', 'Cash & Bank Balance')
              : t('দোকান ক্যাশ ড্রয়ার', 'Shop Cash Drawer')
          }
          value={formatTaka(userRole === 'ADMIN' ? totalLiquidCash : shopCashDrawerBalance)}
          subtext={
            userRole === 'ADMIN'
              ? t(
                  `${toBengaliNumber(accounts.length)} টি একাউন্টে লাইভ সিঙ্ক`,
                  `${accounts.length} accounts synced live`
                )
              : t('মূল ব্যাংক হিসাব সংরক্ষিত', 'Bank accounts Admin-only')
          }
          icon={<Wallet className="w-4 h-4 text-[#0066cc]" />}
          onClick={userRole === 'ADMIN' ? () => onNavigate('cashbook') : undefined}
        />

        <AppleStatCard
          label={t('বাজারে কাস্টমার বকেয়া', 'Customer Market Dues')}
          value={formatTaka(totalCustomerDues)}
          subtext={
            highRiskCustomers.length > 0 ? (
              <span className="text-[#d92916] font-semibold">
                {t(
                  `${toBengaliNumber(highRiskCustomers.length)} জন ক্রেডিট সীমা অতিক্রমকারী`,
                  `${highRiskCustomers.length} near credit limit`
                )}
              </span>
            ) : (
              t('সকল কাস্টমার সীমার মধ্যে', 'All customers within limit')
            )
          }
          icon={<Users className="w-4 h-4 text-[#d92916]" />}
          onClick={() => onNavigate('parties')}
        />
      </div>

      {/* 5 Egg Categories (Apple Store Utility Cards: #ffffff, 18px radius, 1px #e0e0e0) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[18px] sm:text-[21px] text-[#1d1d1f] tracking-[-0.015em]">
              {t('ডিমের ৫টি ক্যাটাগরি ও আজকের বাজার দর', "5 Egg Categories & Today's Market Rates")}
            </h3>
            <span className="badge-blue hidden sm:inline-flex">
              {t('লাইভ স্টক', 'Live Stock')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('daily-pricing')}
            className="text-[13px] sm:text-[14px] text-[#0066cc] hover:underline font-normal inline-flex items-center gap-1 shrink-0"
          >
            <span>{t('দর পরিবর্তন', 'Edit Rates')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const stock = stocks.find((s) => s.category_id === cat.id);
            const rate = rates.find((r) => r.category_id === cat.id);
            const pcs = stock?.qty_pcs || 0;
            const bdown = formatQuantityPcs(pcs, cat.pcs_per_crate);

            return (
              <div
                key={cat.id}
                onClick={() => onNavigate('sales-pos')}
                className="card-apple p-4 hover:border-[#0066cc] transition cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[15px] text-[#1d1d1f] truncate">
                    {getCategoryDisplayName(cat)}
                  </span>
                  <span className="text-[10px] font-mono text-[#7a7a7a] uppercase shrink-0">
                    {cat.code}
                  </span>
                </div>

                <div className="bg-[#f5f5f7] p-3 rounded-[12px] text-center">
                  <div className="text-[11px] text-[#7a7a7a]">
                    {t('বর্তমান মজুদ', 'Current Stock')}
                  </div>
                  <div className="font-semibold text-[21px] text-[#1d1d1f] tracking-[-0.02em] mt-0.5">
                    {bdown.totalPcsBn}{' '}
                    <span className="text-[12px] text-[#7a7a7a] font-normal">
                      {t('পিস', 'pcs')}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-[#4e4e4e] font-normal mt-0.5">
                    {bdown.crateBreakdown}
                  </div>
                </div>

                <div className="space-y-1.5 text-[12px] pt-1 border-t border-[#e0e0e0]">
                  <div className="flex justify-between text-[#7a7a7a]">
                    <span>{t('কেনা দর:', 'Buying:')}</span>
                    <span className="font-semibold text-[#1d1d1f]">
                      {formatTaka(rate?.buying_rate_pc || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#0066cc] bg-[#0066cc]/8 px-2 py-1 rounded-[8px]">
                    <span className="font-semibold">{t('পাইকারি দর:', 'Wholesale:')}</span>
                    <span className="font-bold">
                      {formatTaka(rate?.wholesale_rate_pc || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#4e4e4e]">
                    <span>{t('খুচরা দর:', 'Retail:')}</span>
                    <span className="font-semibold text-[#1d1d1f]">
                      {formatTaka(rate?.retail_rate_pc || 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Due Alerts & Recent Sales Memos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Credit Limit & Due Alerts */}
        <div className="card-apple p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3">
            <h3 className="font-semibold text-[16px] sm:text-[18px] text-[#1d1d1f] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#d92916] shrink-0" />
              <span>{t('বকেয়া অ্যালার্ট ও ক্রেডিট সীমা', 'Due Alerts & Credit Limit')}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('parties')}
              className="text-[13px] text-[#0066cc] hover:underline shrink-0"
            >
              {t('বাকি আদায় ➔', 'Collect Due ➔')}
            </button>
          </div>

          <div className="space-y-2.5">
            {highRiskCustomers.length === 0 ? (
              <div className="text-[13px] text-[#7a7a7a] py-7 text-center bg-[#f5f5f7] rounded-[12px]">
                {t(
                  'সকল কাস্টমারের বকেয়া নির্ধারিত ক্রেডিট সীমার মধ্যে রয়েছে।',
                  'All customer balances are safely within their credit limits.'
                )}
              </div>
            ) : (
              highRiskCustomers.map((cust) => {
                const ratio = Math.round((cust.current_due / cust.credit_limit) * 100);
                return (
                  <div
                    key={cust.id}
                    onClick={() => onNavigate('parties')}
                    className="p-3.5 rounded-[12px] border border-[#e0e0e0] hover:border-[#0066cc] bg-white transition cursor-pointer flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[14px] text-[#1d1d1f] flex items-center gap-2 flex-wrap">
                        <span className="truncate">{cust.name}</span>
                        <span className="badge-pill text-[10px] py-0 px-2">
                          {cust.customer_code}
                        </span>
                      </div>
                      <div className="text-[#7a7a7a] text-[12px] mt-0.5">
                        {t('মোবাইল:', 'Phone:')} {toBengaliNumber(cust.phone)} | {t('সীমা:', 'Limit:')} {formatTaka(cust.credit_limit)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-[15px] text-[#1d1d1f]">
                        {formatTaka(cust.current_due)}
                      </div>
                      <span className="text-[11px] text-[#d92916] font-semibold">
                        {t(`সীমার ${toBengaliNumber(ratio)}% বকেয়া`, `${ratio}% of limit`)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Sales Memos */}
        <div className="card-apple p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3">
            <h3 className="font-semibold text-[16px] sm:text-[18px] text-[#1d1d1f] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0066cc] shrink-0" />
              <span>{t('সাম্প্রতিক বিক্রয় মেমো (ট্যাপ করে প্রিন্ট)', 'Recent Sales Memos (Tap to Print)')}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('sales-pos')}
              className="text-[13px] text-[#0066cc] hover:underline shrink-0"
            >
              {t('নতুন মেমো ➔', 'New Memo ➔')}
            </button>
          </div>

          <div className="space-y-2.5">
            {sales.length === 0 ? (
              <div className="text-[13px] text-[#7a7a7a] py-7 text-center bg-[#f5f5f7] rounded-[12px]">
                {t(
                  'এখনো কোনো বিক্রয় মেমো তৈরি করা হয়নি। "+ নতুন বিক্রয় মেমো" বাটনে ট্যাপ করে শুরু করুন।',
                  'No sales memos created yet. Tap "+ New Sales Memo" to create your first invoice.'
                )}
              </div>
            ) : (
              sales.slice(0, 5).map((inv) => {
                const cust = customers.find((c) => c.id === inv.customer_id);
                return (
                  <div
                    key={inv.id}
                    onClick={() => onSelectInvoiceForPrint(inv)}
                    className="p-3.5 rounded-[12px] border border-[#e0e0e0] hover:border-[#0066cc] bg-white transition cursor-pointer flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[14px] text-[#1d1d1f] flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[#0066cc]">{inv.invoice_code}</span>
                        <span className="text-[#7a7a7a]">•</span>
                        <span className="truncate">{cust?.name || t('খুচরা কাস্টমার', 'Walk-in Customer')}</span>
                      </div>
                      <div className="text-[#7a7a7a] text-[12px] mt-0.5">
                        {toBengaliNumber(inv.invoice_date)} |{' '}
                        {inv.sale_type === 'WHOLESALE'
                          ? t('পাইকারি', 'Wholesale')
                          : t('খুচরা', 'Retail')}{' '}
                        | {toBengaliNumber(inv.items.reduce((s, i) => s + i.qty_pcs, 0))}{' '}
                        {t('পিস ডিম', 'pcs')}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-[15px] text-[#1d1d1f]">
                        {formatTaka(inv.net_total)}
                      </div>
                      <div className="text-[11px]">
                        {inv.due_amount > 0 ? (
                          <span className="text-[#d92916] font-semibold">
                            {t('বাকি:', 'Due:')} {formatTaka(inv.due_amount)}
                          </span>
                        ) : (
                          <span className="text-[#15803d] font-semibold">
                            {t('পরিশোধিত', 'Paid')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
