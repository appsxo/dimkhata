// ====================================================================
// DIMKHATA (ডিমখাতা) — Apple Design System Dashboard & Live Stock Board
// Canvas: #f5f5f7 | Card: #ffffff (18px, 1px #e0e0e0, 0 shadow) | Accent: #0066cc
// ====================================================================

import React from 'react';
import {
  TrendingUp,
  Receipt,
  Truck,
  AlertTriangle,
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
    <div className="space-y-6 sm:space-y-8">
      {/* Apple Store Hero Banner (No decorative gradients, clean #ffffff store-utility-card) */}
      <div className="card-apple p-5 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge-blue">শরিফ এন্ড ইমান এন্টারপ্রাইজ</span>
            <span className="text-[12px] text-[#7a7a7a]">• সহজ মোবাইল ডিমখাতা ও লাইভ স্টক</span>
          </div>
          <h2 className="font-semibold text-[24px] sm:text-[32px] text-[#1d1d1f] tracking-[-0.02em] leading-[1.12]">
            আজকের মজুদ ও লেনদেন এক নজরে
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#4e4e4e] mt-1.5 leading-[1.47]">
            গোডাউনে বর্তমানে মোট <strong className="text-[#1d1d1f] font-semibold">{stockBreakdown.crateBreakdown}</strong> ({stockBreakdown.totalPcsBn} পিস ডিম) মজুদ আছে। নিচে এক ক্লিকে বিক্রি বা কেনা এন্ট্রি দিন:
          </p>
        </div>

        {/* 1-Tap Mobile-First Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => onNavigate('sales-pos')}
            className="btn-primary col-span-2 sm:col-span-1 py-3 px-5 text-[15px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ নতুন বিক্রয় মেমো</span>
          </button>
          <button
            onClick={() => onNavigate('sourcing')}
            className="btn-outline py-2.5 px-4 text-[14px]"
          >
            <Truck className="w-4 h-4 text-[#0066cc]" />
            <span>ডিম কেনা</span>
          </button>
          <button
            onClick={onOpenRateModal}
            className="btn-outline py-2.5 px-4 text-[14px]"
          >
            <Sparkles className="w-4 h-4 text-[#0066cc]" />
            <span>আজকের দর</span>
          </button>
        </div>
      </div>

      {/* 4 Key Apple Stat Cards ({component.store-utility-card}) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AppleStatCard
          label="আজকের মোট বিক্রয়"
          value={formatTaka(todaySalesRevenue)}
          subtext={
            <span>
              নগদ জমা: <strong className="text-[#15803d] font-semibold">{formatTaka(todayCashCollected)}</strong>
            </span>
          }
          icon={<TrendingUp className="w-4 h-4 text-[#0066cc]" />}
          onClick={() => onNavigate('sales-pos')}
        />

        <AppleStatCard
          label="গোডাউনে লাইভ মজুদ"
          value={
            <span>
              {stockBreakdown.totalPcsBn} <span className="text-[14px] text-[#7a7a7a] font-normal">পিস</span>
            </span>
          }
          subtext={stockBreakdown.crateBreakdown}
          icon={<span className="text-sm">🥚</span>}
          onClick={() => onNavigate('daily-pricing')}
        />

        <AppleStatCard
          label={userRole === 'ADMIN' ? 'ক্যাশ ও ব্যাংক তহবিল' : 'দোকান ক্যাশ ড্রয়ার'}
          value={formatTaka(userRole === 'ADMIN' ? totalLiquidCash : shopCashDrawerBalance)}
          subtext={
            userRole === 'ADMIN'
              ? `${toBengaliNumber(accounts.length)} টি একাউন্টে লাইভ সিঙ্ক`
              : 'মূল ব্যাংক হিসাব সংরক্ষিত (অ্যাডমিন)'
          }
          icon={<Wallet className="w-4 h-4 text-[#0066cc]" />}
          onClick={userRole === 'ADMIN' ? () => onNavigate('cashbook') : undefined}
        />

        <AppleStatCard
          label="বাজারে কাস্টমার বকেয়া"
          value={formatTaka(totalCustomerDues)}
          subtext={
            highRiskCustomers.length > 0 ? (
              <span className="text-[#d92916] font-semibold">
                {toBengaliNumber(highRiskCustomers.length)} জন ক্রেডিট সীমা অতিক্রমকারী
              </span>
            ) : (
              'সকল কাস্টমার সীমার মধ্যে'
            )
          }
          icon={<Users className="w-4 h-4 text-[#d92916]" />}
          onClick={() => onNavigate('parties')}
        />
      </div>

      {/* 5 Egg Categories (Apple Store Utility Cards: #ffffff, 18px radius, 1px #e0e0e0) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-[20px] sm:text-[22px] text-[#1d1d1f] tracking-[-0.015em]">
              ডিমের ৫টি ক্যাটাগরি ও আজকের বাজার দর
            </h3>
            <span className="badge-blue hidden sm:inline-flex">লাইভ স্টক</span>
          </div>
          <button
            onClick={() => onNavigate('daily-pricing')}
            className="text-[14px] text-[#0066cc] hover:underline font-normal inline-flex items-center gap-1"
          >
            <span>দর পরিবর্তন করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {categories.map((cat) => {
            const stock = stocks.find((s) => s.category_id === cat.id);
            const rate = rates.find((r) => r.category_id === cat.id);
            const pcs = stock?.qty_pcs || 0;
            const bdown = formatQuantityPcs(pcs, cat.pcs_per_crate);

            return (
              <div
                key={cat.id}
                onClick={() => onNavigate('sales-pos')}
                className="card-apple p-4 sm:p-5 hover:border-[#0066cc] transition cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[16px] text-[#1d1d1f]">
                    {cat.name_bn}
                  </span>
                  <span className="text-[11px] font-mono text-[#7a7a7a] uppercase">
                    {cat.code}
                  </span>
                </div>

                <div className="bg-[#f5f5f7] p-3 rounded-[12px] text-center">
                  <div className="text-[11px] text-[#7a7a7a]">বর্তমান মজুদ</div>
                  <div className="font-semibold text-[22px] text-[#1d1d1f] tracking-[-0.02em] mt-0.5">
                    {bdown.totalPcsBn} <span className="text-[12px] text-[#7a7a7a] font-normal">পিস</span>
                  </div>
                  <div className="text-[12px] text-[#4e4e4e] font-normal mt-0.5">
                    {bdown.crateBreakdown}
                  </div>
                </div>

                <div className="space-y-1.5 text-[12px] pt-1 border-t border-[#e0e0e0]">
                  <div className="flex justify-between text-[#7a7a7a]">
                    <span>কেনা দর:</span>
                    <span className="font-semibold text-[#1d1d1f]">
                      {formatTaka(rate?.buying_rate_pc || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#0066cc] bg-[#0066cc]/8 px-2 py-1 rounded-[8px]">
                    <span className="font-semibold">পাইকারি দর:</span>
                    <span className="font-bold">
                      {formatTaka(rate?.wholesale_rate_pc || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#4e4e4e]">
                    <span>খুচরা দর:</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Credit Limit & Due Alerts */}
        <div className="card-apple p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3">
            <h3 className="font-semibold text-[18px] text-[#1d1d1f] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#d92916]" />
              <span>বকেয়া অ্যালার্ট ও ক্রেডিট সীমা</span>
            </h3>
            <button
              onClick={() => onNavigate('parties')}
              className="text-[13px] text-[#0066cc] hover:underline"
            >
              বাকি আদায় করুন ➔
            </button>
          </div>

          <div className="space-y-2.5">
            {highRiskCustomers.length === 0 ? (
              <div className="text-[13px] text-[#7a7a7a] py-8 text-center bg-[#f5f5f7] rounded-[12px]">
                সকল কাস্টমারের বকেয়া নির্ধারিত ক্রেডিট সীমার মধ্যে রয়েছে।
              </div>
            ) : (
              highRiskCustomers.map((cust) => {
                const ratio = Math.round((cust.current_due / cust.credit_limit) * 100);
                return (
                  <div
                    key={cust.id}
                    onClick={() => onNavigate('parties')}
                    className="p-3.5 rounded-[12px] border border-[#e0e0e0] hover:border-[#0066cc] bg-white transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[14px] text-[#1d1d1f] flex items-center gap-2">
                        <span>{cust.name}</span>
                        <span className="badge-pill text-[10px] py-0 px-2">
                          {cust.customer_code}
                        </span>
                      </div>
                      <div className="text-[#7a7a7a] text-[12px] mt-0.5">
                        মোবাইল: {toBengaliNumber(cust.phone)} | সীমা: {formatTaka(cust.credit_limit)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[16px] text-[#1d1d1f]">
                        {formatTaka(cust.current_due)}
                      </div>
                      <span className="text-[11px] text-[#d92916] font-semibold">
                        সীমার {toBengaliNumber(ratio)}% বকেয়া
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Sales Memos */}
        <div className="card-apple p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3">
            <h3 className="font-semibold text-[18px] text-[#1d1d1f] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0066cc]" />
              <span>সাম্প্রতিক বিক্রয় মেমো (ট্যাপ করে প্রিন্ট করুন)</span>
            </h3>
            <button
              onClick={() => onNavigate('sales-pos')}
              className="text-[13px] text-[#0066cc] hover:underline"
            >
              নতুন মেমো ➔
            </button>
          </div>

          <div className="space-y-2.5">
            {sales.length === 0 ? (
              <div className="text-[13px] text-[#7a7a7a] py-8 text-center bg-[#f5f5f7] rounded-[12px]">
                এখনো কোনো বিক্রয় মেমো তৈরি করা হয়নি।
              </div>
            ) : (
              sales.slice(0, 4).map((inv) => {
                const cust = customers.find((c) => c.id === inv.customer_id);
                return (
                  <div
                    key={inv.id}
                    onClick={() => onSelectInvoiceForPrint(inv)}
                    className="p-3.5 rounded-[12px] border border-[#e0e0e0] hover:border-[#0066cc] bg-white transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[14px] text-[#1d1d1f] flex items-center gap-2">
                        <span className="font-mono text-[#0066cc]">{inv.invoice_code}</span>
                        <span className="text-[#7a7a7a]">•</span>
                        <span>{cust?.name || 'কাস্টমার'}</span>
                      </div>
                      <div className="text-[#7a7a7a] text-[12px] mt-0.5">
                        {toBengaliNumber(inv.invoice_date)} | {inv.sale_type === 'WHOLESALE' ? 'পাইকারি' : 'খুচরা'} | {toBengaliNumber(inv.items.reduce((s, i) => s + i.qty_pcs, 0))} পিস ডিম
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[16px] text-[#1d1d1f]">
                        {formatTaka(inv.net_total)}
                      </div>
                      <div className="text-[11px]">
                        {inv.due_amount > 0 ? (
                          <span className="text-[#d92916] font-semibold">বাকি: {formatTaka(inv.due_amount)}</span>
                        ) : (
                          <span className="text-[#15803d] font-semibold">পরিশোধিত</span>
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
