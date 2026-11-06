// ====================================================================
// DIMKHATA (ডিমখাতা) — Executive Dashboard & Live Stock Board
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
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import {
  EggCategory,
  InventoryStock,
  DailyMarketRate,
  Customer,
  SalesInvoice,
  FinancialAccount,
} from '../types';
import { formatQuantityPcs, formatTaka, toBengaliNumber } from '../lib/egg-units';

interface DashboardViewProps {
  categories: EggCategory[];
  stocks: InventoryStock[];
  rates: DailyMarketRate[];
  customers: Customer[];
  sales: SalesInvoice[];
  accounts: FinancialAccount[];
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
  onNavigate,
  onOpenRateModal,
  onSelectInvoiceForPrint,
}) => {
  // Aggregate stock across categories
  const totalStockPcs = stocks.reduce((sum, s) => sum + s.qty_pcs, 0);
  const stockBreakdown = formatQuantityPcs(totalStockPcs, 30);

  // Total cash & bank balances
  const totalLiquidCash = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  // Total customer dues
  const totalCustomerDues = customers.reduce((sum, c) => sum + c.current_due, 0);

  // Today's Sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.invoice_date === todayStr);
  const todaySalesRevenue = todaySales.reduce((sum, s) => sum + s.net_total, 0);
  const todayCashCollected = todaySales.reduce((sum, s) => sum + s.paid_amount, 0);

  // Customers exceeding credit limit or due
  const highRiskCustomers = customers.filter(
    (c) => c.current_due > 0 && c.current_due >= c.credit_limit * 0.9
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-2xl p-4 sm:p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥚</span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              আজকের ব্যবসার সারসংক্ষেপ
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-1">
            মোট লাইভ স্টক: <strong className="text-white text-base">{stockBreakdown.crateBreakdown}</strong> ({stockBreakdown.totalPcsBn} পিস)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('sales-pos')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-amber-900 hover:bg-amber-50 font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-amber-700" />
            <span>নতুন বিক্রয় মেমো (POS)</span>
          </button>
          <button
            onClick={() => onNavigate('sourcing')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
          >
            <Truck className="w-4 h-4" />
            <span>ডিম কেনা (মহাজন)</span>
          </button>
          <button
            onClick={onOpenRateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-950/60 hover:bg-amber-950/80 text-amber-100 font-semibold rounded-xl text-xs sm:text-sm transition border border-amber-500/40"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>দর আপডেট</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">আজকের মোট বিক্রয়</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatTaka(todaySalesRevenue)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <span>নগদ জমা: {formatTaka(todayCashCollected)}</span>
            </div>
          </div>
        </div>

        {/* Live Egg Stock */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">দোকান ও গোডাউনে স্টক</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl text-base">
              🥚
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-amber-900">
              {stockBreakdown.totalPcsBn} <span className="text-xs font-normal text-slate-500">পিস</span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
              {stockBreakdown.crateBreakdown}
            </div>
          </div>
        </div>

        {/* Liquid Cash & Bank */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">ক্যাশ ও ব্যাংক তহবিল</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-blue-900">
              {formatTaka(totalLiquidCash)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {accounts.length} টি একাউন্টে লাইভ সিঙ্ক
            </div>
          </div>
        </div>

        {/* Customer Dues */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">বাজারে মোট কাস্টমার বকেয়া</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-rose-700">
              {formatTaka(totalCustomerDues)}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
              {highRiskCustomers.length} জন কাস্টমার লিমিটের কাছাকাছি
            </div>
          </div>
        </div>
      </div>

      {/* 5 Egg Categories Live Cards (Req 6) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <span>🥚 ডিমের ৫টি ক্যাটাগরি ও লাইভ মজুদ</span>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
              লাইভ স্টক
            </span>
          </h3>
          <button
            onClick={() => onNavigate('daily-pricing')}
            className="text-xs text-amber-800 hover:text-amber-900 font-semibold hover:underline"
          >
            বিস্তারিত বাজার দর দেখুন ➔
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
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 transition space-y-3 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: cat.color_hex }}
                />

                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">
                    {cat.name_bn}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {cat.code}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <div className="text-xs text-slate-500 font-medium">বর্তমান স্টক</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {bdown.totalPcsBn} <span className="text-xs font-normal">পিস</span>
                  </div>
                  <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                    {bdown.crateBreakdown}
                  </div>
                </div>

                {/* Rates Grid */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>কেনা দর:</span>
                    <span className="font-bold text-slate-800">
                      {formatTaka(rate?.buying_rate_pc || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-900 bg-amber-50/70 px-1.5 py-0.5 rounded">
                    <span>পাইকারি দর:</span>
                    <span className="font-bold">
                      {formatTaka(rate?.wholesale_rate_pc || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-900 bg-emerald-50/70 px-1.5 py-0.5 rounded">
                    <span>খুচরা দর:</span>
                    <span className="font-bold">
                      {formatTaka(rate?.retail_rate_pc || 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lower Row: Due Alerts & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Limit & Due Alerts (Req 10) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>বকেয়া অ্যালার্ট ও বাকির সীমা অতিক্রম</span>
            </h3>
            <button
              onClick={() => onNavigate('parties')}
              className="text-xs text-amber-800 hover:underline font-semibold"
            >
              সকল কাস্টমার ➔
            </button>
          </div>

          <div className="space-y-2">
            {highRiskCustomers.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded-xl">
                সকল কাস্টমারের বকেয়া সীমার মধ্যে রয়েছে। কোনো ঝুঁকি নেই।
              </div>
            ) : (
              highRiskCustomers.map((cust) => {
                const ratio = Math.round((cust.current_due / cust.credit_limit) * 100);
                return (
                  <div
                    key={cust.id}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{cust.name}</span>
                        <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded font-mono font-semibold">
                          {cust.customer_code}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        মোবাইল: {toBengaliNumber(cust.phone)} | বাকির সীমা: {formatTaka(cust.credit_limit)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-rose-700 text-sm">
                        {formatTaka(cust.current_due)}
                      </div>
                      <span className="text-[10px] text-rose-600 font-bold">
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
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-700" />
              <span>সাম্প্রতিক বিক্রয় মেমো (Recent Memos)</span>
            </h3>
            <button
              onClick={() => onNavigate('sales-pos')}
              className="text-xs text-amber-800 hover:underline font-semibold"
            >
              মেমো তালিকা ➔
            </button>
          </div>

          <div className="space-y-2">
            {sales.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded-xl">
                এখনো কোনো বিক্রয় মেমো তৈরি করা হয়নি।
              </div>
            ) : (
              sales.slice(0, 4).map((inv) => {
                const cust = customers.find((c) => c.id === inv.customer_id);
                return (
                  <div
                    key={inv.id}
                    onClick={() => onSelectInvoiceForPrint(inv)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/30 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-amber-800 font-mono">{inv.invoice_code}</span>
                        <span className="text-slate-400">•</span>
                        <span>{cust?.name || 'কাস্টমার'}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {toBengaliNumber(inv.invoice_date)} | {inv.sale_type === 'WHOLESALE' ? 'পাইকারি' : 'খুচরা'} | {toBengaliNumber(inv.items.reduce((s, i) => s + i.qty_pcs, 0))} পিস ডিম
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">
                        {formatTaka(inv.net_total)}
                      </div>
                      <div className="text-[10px]">
                        {inv.due_amount > 0 ? (
                          <span className="text-rose-600 font-bold">বকেয়া: {formatTaka(inv.due_amount)}</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">পরিশোধিত</span>
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
