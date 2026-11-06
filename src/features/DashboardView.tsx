// ====================================================================
// DIMKHATA (ডিমখাতা) — Editorial Dashboard & Live Stock Board
// Canvas: #f5f5f5 | Display: EB Garamond 300 | Atmospheric Pastel Orbs
// ====================================================================

import React from 'react';
import {
  TrendingUp,
  Receipt,
  Truck,
  AlertTriangle,
  Wallet,
  Users,
  Sparkles,
  AlertCircle,
  PlusCircle,
  ArrowRight,
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
    <div className="space-y-8 relative">
      {/* Editorial Hero Band with Atmospheric Pastel Gradient Orbs */}
      <div className="relative overflow-hidden bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-10 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
        {/* Five Signature Pastel Gradient Orbs as Pure Atmosphere */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full orb-peach blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full orb-mint blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute top-1/2 -left-12 w-64 h-64 rounded-full orb-lavender blur-3xl opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-pill">
                শরিফ এন্ড ইমান এন্টারপ্রাইজ
              </span>
              <span className="text-[12px] text-[#777169]">• লাইভ স্টক ও ক্যাশবুক</span>
            </div>
            <h2 className="font-serif font-light text-3xl sm:text-4xl text-[#0c0a09] tracking-tight leading-tight">
              আজকের সামগ্রিক মজুদ ও ব্যবসায়িক লেনদেন
            </h2>
            <p className="text-[15px] text-[#4e4e4e] mt-2 font-normal">
              বর্তমানে দোকান ও গোডাউনে মোট মজুদ <strong className="text-[#0c0a09] font-medium">{stockBreakdown.crateBreakdown}</strong> ({stockBreakdown.totalPcsBn} পিস ডিম)।
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onNavigate('sales-pos')}
              className="btn-primary"
            >
              <PlusCircle className="w-4 h-4" />
              <span>বিক্রয় মেমো (POS)</span>
            </button>
            <button
              onClick={() => onNavigate('sourcing')}
              className="btn-outline"
            >
              <Truck className="w-4 h-4 text-[#777169]" />
              <span>ডিম কেনা (মহাজন)</span>
            </button>
            <button
              onClick={onOpenRateModal}
              className="btn-outline"
            >
              <Sparkles className="w-4 h-4 text-[#777169]" />
              <span>দর আপডেট</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards (Surface Card: #ffffff, 16px radius, hairline #e7e5e4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="card-editorial flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777169]">
            <span className="text-[13px] font-medium tracking-wide">আজকের মোট বিক্রয়</span>
            <div className="w-8 h-8 rounded-full bg-[#f0efed] text-[#292524] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-serif font-light text-2xl sm:text-3xl text-[#0c0a09] tracking-tight">
              {formatTaka(todaySalesRevenue)}
            </div>
            <div className="text-[12px] text-[#777169] font-normal mt-1">
              নগদ জমা: <span className="text-[#16a34a] font-medium">{formatTaka(todayCashCollected)}</span>
            </div>
          </div>
        </div>

        {/* Live Stock */}
        <div className="card-editorial flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777169]">
            <span className="text-[13px] font-medium tracking-wide">গোডাউনে লাইভ মজুদ</span>
            <div className="w-8 h-8 rounded-full bg-[#f0efed] text-[#292524] flex items-center justify-center text-sm">
              🥚
            </div>
          </div>
          <div className="mt-4">
            <div className="font-serif font-light text-2xl sm:text-3xl text-[#0c0a09] tracking-tight">
              {stockBreakdown.totalPcsBn} <span className="text-base text-[#777169] font-sans">পিস</span>
            </div>
            <div className="text-[12px] text-[#4e4e4e] font-normal mt-1">
              {stockBreakdown.crateBreakdown}
            </div>
          </div>
        </div>

        {/* Cash & Bank Balances */}
        <div className="card-editorial flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777169]">
            <span className="text-[13px] font-medium tracking-wide">
              {userRole === 'ADMIN' ? 'ক্যাশ ও ব্যাংক তহবিল' : 'দোকান ক্যাশ ড্রয়ার'}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#f0efed] text-[#292524] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-serif font-light text-2xl sm:text-3xl text-[#0c0a09] tracking-tight">
              {formatTaka(userRole === 'ADMIN' ? totalLiquidCash : shopCashDrawerBalance)}
            </div>
            <div className="text-[12px] text-[#777169] font-normal mt-1">
              {userRole === 'ADMIN'
                ? `${toBengaliNumber(accounts.length)} টি একাউন্টে লাইভ সিঙ্ক`
                : 'মূল ব্যাংক হিসাব সংরক্ষিত (অ্যাডমিন)'}
            </div>
          </div>
        </div>

        {/* Customer Dues */}
        <div className="card-editorial flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777169]">
            <span className="text-[13px] font-medium tracking-wide">বাজারে কাস্টমার বকেয়া</span>
            <div className="w-8 h-8 rounded-full bg-[#f0efed] text-[#dc2626] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-serif font-light text-2xl sm:text-3xl text-[#0c0a09] tracking-tight">
              {formatTaka(totalCustomerDues)}
            </div>
            <div className="text-[12px] text-[#777169] font-normal mt-1">
              {highRiskCustomers.length} জন লিমিট অতিক্রমকারী
            </div>
          </div>
        </div>
      </div>

      {/* 5 Egg Categories (Editorial Cards) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-light text-2xl text-[#0c0a09] tracking-tight">
              ডিমের ৫টি ক্যাটাগরি ও আজকের বাজার দর
            </h3>
            <span className="badge-pill">
              লাইভ স্টক
            </span>
          </div>
          <button
            onClick={() => onNavigate('daily-pricing')}
            className="text-[14px] text-[#292524] hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>সকল দর</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((cat, idx) => {
            const stock = stocks.find((s) => s.category_id === cat.id);
            const rate = rates.find((r) => r.category_id === cat.id);
            const pcs = stock?.qty_pcs || 0;
            const bdown = formatQuantityPcs(pcs, cat.pcs_per_crate);

            return (
              <div
                key={cat.id}
                className="bg-white rounded-xl p-5 border border-[#e7e5e4] shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:border-[#d6d3d1] transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[15px] text-[#0c0a09]">
                    {cat.name_bn}
                  </span>
                  <span className="text-[10px] font-mono text-[#777169] uppercase">
                    {cat.code}
                  </span>
                </div>

                <div className="bg-[#fafafa] p-3 rounded-lg border border-[#f0efed] text-center">
                  <div className="text-[11px] text-[#777169]">বর্তমান স্টক</div>
                  <div className="font-serif font-light text-xl text-[#0c0a09] mt-0.5">
                    {bdown.totalPcsBn} <span className="text-xs text-[#777169] font-sans">পিস</span>
                  </div>
                  <div className="text-[11px] text-[#4e4e4e] font-medium mt-0.5">
                    {bdown.crateBreakdown}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs pt-1 border-t border-[#f0efed]">
                  <div className="flex justify-between text-[#777169]">
                    <span>কেনা দর:</span>
                    <span className="font-medium text-[#0c0a09]">
                      {formatTaka(rate?.buying_rate_pc || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#0c0a09] bg-[#f0efed] px-2 py-0.5 rounded">
                    <span>পাইকারি দর:</span>
                    <span className="font-semibold">
                      {formatTaka(rate?.wholesale_rate_pc || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#4e4e4e]">
                    <span>খুচরা দর:</span>
                    <span className="font-medium text-[#0c0a09]">
                      {formatTaka(rate?.retail_rate_pc || 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Due Alerts & Recent Memos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Limit & Due Alerts */}
        <div className="card-editorial space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0efed] pb-3">
            <h3 className="font-serif font-light text-xl text-[#0c0a09] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#dc2626]" />
              <span>বকেয়া অ্যালার্ট ও ক্রেডিট সীমা</span>
            </h3>
            <button
              onClick={() => onNavigate('parties')}
              className="text-xs text-[#292524] hover:underline font-medium"
            >
              কাস্টমার ডিরেক্টরি ➔
            </button>
          </div>

          <div className="space-y-2.5">
            {highRiskCustomers.length === 0 ? (
              <div className="text-xs text-[#777169] py-8 text-center bg-[#fafafa] rounded-xl border border-[#f0efed]">
                সকল কাস্টমারের বকেয়া নির্ধারিত ক্রেডিট সীমার মধ্যে রয়েছে।
              </div>
            ) : (
              highRiskCustomers.map((cust) => {
                const ratio = Math.round((cust.current_due / cust.credit_limit) * 100);
                return (
                  <div
                    key={cust.id}
                    className="p-3.5 rounded-xl border border-[#e7e5e4] bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#0c0a09] flex items-center gap-2">
                        <span>{cust.name}</span>
                        <span className="badge-pill text-[10px] py-0 px-2">
                          {cust.customer_code}
                        </span>
                      </div>
                      <div className="text-[#777169] text-[11px] mt-0.5">
                        মোবাইল: {toBengaliNumber(cust.phone)} | বাকির সীমা: {formatTaka(cust.credit_limit)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif font-light text-base text-[#0c0a09]">
                        {formatTaka(cust.current_due)}
                      </div>
                      <span className="text-[10px] text-[#dc2626] font-semibold">
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
        <div className="card-editorial space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0efed] pb-3">
            <h3 className="font-serif font-light text-xl text-[#0c0a09] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#777169]" />
              <span>সাম্প্রতিক বিক্রয় মেমো</span>
            </h3>
            <button
              onClick={() => onNavigate('sales-pos')}
              className="text-xs text-[#292524] hover:underline font-medium"
            >
              মেমো তালিকা ➔
            </button>
          </div>

          <div className="space-y-2">
            {sales.length === 0 ? (
              <div className="text-xs text-[#777169] py-8 text-center bg-[#fafafa] rounded-xl border border-[#f0efed]">
                এখনো কোনো বিক্রয় মেমো তৈরি করা হয়নি।
              </div>
            ) : (
              sales.slice(0, 4).map((inv) => {
                const cust = customers.find((c) => c.id === inv.customer_id);
                return (
                  <div
                    key={inv.id}
                    onClick={() => onSelectInvoiceForPrint(inv)}
                    className="p-3 rounded-xl border border-[#e7e5e4] hover:border-[#0c0a09] bg-white transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#0c0a09] flex items-center gap-2">
                        <span className="font-mono text-[#292524]">{inv.invoice_code}</span>
                        <span className="text-[#a8a29e]">•</span>
                        <span>{cust?.name || 'কাস্টমার'}</span>
                      </div>
                      <div className="text-[#777169] text-[11px] mt-0.5">
                        {toBengaliNumber(inv.invoice_date)} | {inv.sale_type === 'WHOLESALE' ? 'পাইকারি' : 'খুচরা'} | {toBengaliNumber(inv.items.reduce((s, i) => s + i.qty_pcs, 0))} পিস ডিম
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif font-light text-base text-[#0c0a09]">
                        {formatTaka(inv.net_total)}
                      </div>
                      <div className="text-[10px]">
                        {inv.due_amount > 0 ? (
                          <span className="text-[#777169] font-medium">বকেয়া: {formatTaka(inv.due_amount)}</span>
                        ) : (
                          <span className="text-[#16a34a] font-medium">পরিশোধিত</span>
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
