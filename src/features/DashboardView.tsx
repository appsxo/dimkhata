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
  onSelectInvoiceForPrint,
}) => {
  const { t } = useLanguage();

  const totalStockPcs = stocks.reduce((sum, s) => sum + s.qty_pcs, 0);
  const stockBreakdown = formatQuantityPcs(totalStockPcs, 30);

  const totalLiquidCash = accounts.reduce((sum, a) => sum + a.current_balance, 0);
  const shopCashDrawerBalance = accounts
    .filter((a) => a.account_type === 'CASH')
    .reduce((sum, a) => sum + a.current_balance, 0);

  const totalCustomerDues = customers.reduce((sum, c) => sum + c.current_due, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.invoice_date === todayStr);
  const todaySalesRevenue = todaySales.reduce((sum, s) => sum + s.net_total, 0);
  const todayCashCollected = todaySales.reduce((sum, s) => sum + s.paid_amount, 0);

  const highRiskCustomers = customers.filter(
    (c) => c.current_due > 0 && c.current_due >= c.credit_limit * 0.9
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Compact Quick Action Bar */}
      <div className="card-apple p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[18px] sm:text-[22px] text-[#1d1d1f] tracking-[-0.02em]">
            {t('আজকের মজুদ ও লেনদেন', "Today's Stock & Operations")}
          </h2>
          <p className="text-[13px] text-[#7a7a7a]">
            {t(
              `মোট মজুদ: ${stockBreakdown.crateBreakdown} (${stockBreakdown.totalPcsBn} পিস)`,
              `Total Stock: ${stockBreakdown.crateBreakdown} (${stockBreakdown.totalPcsBn} pcs)`
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onNavigate('sales-pos')}
            className="btn-primary col-span-2 sm:col-span-1 py-2.5 px-4 text-[13.5px]"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>{t('নতুন বিক্রয় মেমো', 'New Sales Memo')}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('sourcing')}
            className="btn-outline py-2 px-3.5 text-[13px]"
          >
            <Truck className="w-4 h-4 text-[#0066cc] shrink-0" />
            <span>{t('ডিম কেনা', 'Buy Eggs')}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('daily-pricing')}
            className="btn-outline py-2 px-3.5 text-[13px]"
          >
            <Sparkles className="w-4 h-4 text-[#0066cc] shrink-0" />
            <span>{t('আজকের দর', 'Rates')}</span>
          </button>
        </div>
      </div>

      {/* 4 Key KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AppleStatCard
          label={t('আজকের বিক্রয়', "Today's Sales")}
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
          label={t('লাইভ মজুদ', 'Live Stock')}
          value={
            <span>
              {stockBreakdown.totalPcsBn}{' '}
              <span className="text-[12px] text-[#7a7a7a] font-normal">{t('পিস', 'pcs')}</span>
            </span>
          }
          subtext={stockBreakdown.crateBreakdown}
          icon={<span className="text-sm">🥚</span>}
          onClick={() => onNavigate('daily-pricing')}
        />

        <AppleStatCard
          label={
            userRole === 'ADMIN'
              ? t('ক্যাশ ও ব্যাংক', 'Cash & Bank')
              : t('ক্যাশ ড্রয়ার', 'Cash Drawer')
          }
          value={formatTaka(userRole === 'ADMIN' ? totalLiquidCash : shopCashDrawerBalance)}
          subtext={
            userRole === 'ADMIN'
              ? t(`${toBengaliNumber(accounts.length)} টি একাউন্ট`, `${accounts.length} accounts`)
              : t('দোকান ক্যাশ', 'Shop Cash')
          }
          icon={<Wallet className="w-4 h-4 text-[#0066cc]" />}
          onClick={userRole === 'ADMIN' ? () => onNavigate('cashbook') : undefined}
        />

        <AppleStatCard
          label={t('কাস্টমার বকেয়া', 'Customer Dues')}
          value={formatTaka(totalCustomerDues)}
          subtext={
            highRiskCustomers.length > 0 ? (
              <span className="text-[#d92916] font-semibold">
                {t(
                  `${toBengaliNumber(highRiskCustomers.length)} জন সীমা অতিক্রম`,
                  `${highRiskCustomers.length} near limit`
                )}
              </span>
            ) : (
              t('সীমার মধ্যে', 'Within limit')
            )
          }
          icon={<Users className="w-4 h-4 text-[#d92916]" />}
          onClick={() => onNavigate('parties')}
        />
      </div>

      {/* 5 Egg Categories */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-semibold text-[16px] sm:text-[18px] text-[#1d1d1f]">
            {t('ডিমের ৫টি ক্যাটাগরি ও বাজার দর', '5 Egg Categories & Market Rates')}
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('daily-pricing')}
            className="text-[13px] text-[#0066cc] hover:underline inline-flex items-center gap-1"
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
                className="card-apple p-3.5 hover:border-[#0066cc] transition cursor-pointer flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[14.5px] text-[#1d1d1f] truncate">
                    {getCategoryDisplayName(cat)}
                  </span>
                  <span className="text-[10px] font-mono text-[#7a7a7a] shrink-0">{cat.code}</span>
                </div>

                <div className="bg-[#f5f5f7] p-2.5 rounded-[10px] text-center">
                  <div className="font-semibold text-[20px] text-[#1d1d1f] leading-tight">
                    {bdown.totalPcsBn}{' '}
                    <span className="text-[11px] text-[#7a7a7a] font-normal">
                      {t('পিস', 'pcs')}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#4e4e4e] mt-0.5">{bdown.crateBreakdown}</div>
                </div>

                <div className="space-y-1 text-[12px] pt-1 border-t border-[#e0e0e0]">
                  <div className="flex justify-between text-[#7a7a7a]">
                    <span>{t('কেনা:', 'Buy:')}</span>
                    <span className="font-semibold text-[#1d1d1f]">
                      {formatTaka(rate?.buying_rate_pc || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#0066cc] bg-[#0066cc]/8 px-2 py-0.5 rounded-[6px]">
                    <span className="font-semibold">{t('পাইকারি:', 'Wholesale:')}</span>
                    <span className="font-bold">{formatTaka(rate?.wholesale_rate_pc || 0)}</span>
                  </div>
                  <div className="flex justify-between text-[#4e4e4e]">
                    <span>{t('খুচরা:', 'Retail:')}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-apple p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2.5">
            <h3 className="font-semibold text-[15px] sm:text-[17px] text-[#1d1d1f] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#d92916] shrink-0" />
              <span>{t('বকেয়া অ্যালার্ট', 'Due Alerts')}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('parties')}
              className="text-[12.5px] text-[#0066cc] hover:underline"
            >
              {t('বাকি আদায় ➔', 'Collect Due ➔')}
            </button>
          </div>

          <div className="space-y-2">
            {highRiskCustomers.length === 0 ? (
              <div className="text-[12.5px] text-[#7a7a7a] py-6 text-center bg-[#f5f5f7] rounded-[12px]">
                {t('সকল কাস্টমার ক্রেডিট সীমার মধ্যে রয়েছে।', 'All customers are within credit limits.')}
              </div>
            ) : (
              highRiskCustomers.map((cust) => {
                const ratio = Math.round((cust.current_due / cust.credit_limit) * 100);
                return (
                  <div
                    key={cust.id}
                    onClick={() => onNavigate('parties')}
                    className="p-3 rounded-[12px] border border-[#e0e0e0] hover:border-[#0066cc] bg-white transition cursor-pointer flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[13.5px] text-[#1d1d1f] truncate">
                        {cust.name}
                      </div>
                      <div className="text-[#7a7a7a] text-[11.5px]">
                        {toBengaliNumber(cust.phone)} • {t('সীমা:', 'Limit:')} {formatTaka(cust.credit_limit)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-[14px] text-[#1d1d1f]">
                        {formatTaka(cust.current_due)}
                      </div>
                      <span className="text-[11px] text-[#d92916] font-semibold">
                        {toBengaliNumber(ratio)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card-apple p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2.5">
            <h3 className="font-semibold text-[15px] sm:text-[17px] text-[#1d1d1f] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0066cc] shrink-0" />
              <span>{t('সাম্প্রতিক বিক্রয় মেমো', 'Recent Sales Memos')}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('sales-pos')}
              className="text-[12.5px] text-[#0066cc] hover:underline"
            >
              {t('নতুন মেমো ➔', 'New Memo ➔')}
            </button>
          </div>

          <div className="space-y-2">
            {sales.length === 0 ? (
              <div className="text-[12.5px] text-[#7a7a7a] py-6 text-center bg-[#f5f5f7] rounded-[12px]">
                {t('এখনো কোনো বিক্রয় মেমো তৈরি হয়নি।', 'No sales memos created yet.')}
              </div>
            ) : (
              sales.slice(0, 5).map((inv) => {
                const cust = customers.find((c) => c.id === inv.customer_id);
                return (
                  <div
                    key={inv.id}
                    onClick={() => onSelectInvoiceForPrint(inv)}
                    className="p-3 rounded-[12px] border border-[#e0e0e0] hover:border-[#0066cc] bg-white transition cursor-pointer flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[13.5px] text-[#1d1d1f] flex items-center gap-1.5 truncate">
                        <span className="font-mono text-[#0066cc]">{inv.invoice_code}</span>
                        <span className="text-[#7a7a7a]">•</span>
                        <span className="truncate">
                          {cust?.name || t('নগদ ক্রেতা', 'Walk-in Customer')}
                        </span>
                      </div>
                      <div className="text-[#7a7a7a] text-[11.5px]">
                        {toBengaliNumber(inv.invoice_date)} •{' '}
                        {toBengaliNumber(inv.items.reduce((s, i) => s + i.qty_pcs, 0))}{' '}
                        {t('পিস', 'pcs')}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-[14px] text-[#1d1d1f]">
                        {formatTaka(inv.net_total)}
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          inv.due_amount > 0 ? 'text-[#d92916]' : 'text-[#15803d]'
                        }`}
                      >
                        {inv.due_amount > 0
                          ? `${t('বাকি:', 'Due:')} ${formatTaka(inv.due_amount)}`
                          : t('পরিশোধিত', 'Paid')}
                      </span>
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
