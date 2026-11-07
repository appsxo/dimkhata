import React, { useState } from 'react';
import { TrendingDown, Plus, Package, Zap, Coffee } from 'lucide-react';
import { Expense, FinancialAccount, Branch } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { useLanguage } from '../lib/i18n';
import { sanitizeText } from '../lib/security';
import { AppleSectionHeader, AppleStatCard, AppleModal } from '../components/ui/AppleUI';

interface ExpensesAssetsViewProps {
  expenses: Expense[];
  accounts: FinancialAccount[];
  branches: Branch[];
  onRefresh: () => void;
}

export const ExpensesAssetsView: React.FC<ExpensesAssetsViewProps> = ({
  expenses,
  accounts,
  branches,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [category, setCategory] = useState<Expense['expense_category']>('FIXED');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [branchId] = useState(branches[0]?.id || 'br-01');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = expenses.filter((e) => e.expense_date.startsWith(currentMonthStr));
  const sumByCat = (cat: Expense['expense_category']) =>
    monthlyExpenses.filter((e) => e.expense_category === cat).reduce((s, e) => s + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || amount <= 0) return;

    DimKhataStore.recordExpense({
      id: `exp-${Date.now()}`,
      expense_code: DimKhataStore.getNextCode('EXP'),
      branch_id: branchId,
      expense_category: category,
      title: sanitizeText(title, 150),
      amount,
      account_id: accountId || accounts[0]?.id || 'acc-01',
      expense_date: expenseDate,
      is_capital_asset: category === 'CAPITAL_ASSET',
      notes: sanitizeText(notes, 200),
      created_at: new Date().toISOString(),
    });

    setIsAddOpen(false);
    setTitle('');
    setAmount(1000);
    setNotes('');
    onRefresh();
  };

  const catLabels: Record<Expense['expense_category'], string> = {
    FIXED: t('স্থায়ী খরচ', 'Fixed'),
    VARIABLE: t('চলতি খরচ', 'Variable'),
    CAPITAL_ASSET: t('অ্যাসেট কেনা', 'Capital Asset'),
    MISC: t('বিবিধ খরচ', 'Misc'),
  };

  return (
    <div className="space-y-4">
      <AppleSectionHeader
        title={t('দোকান খরচ ও অ্যাসেট', 'Shop Expenses & Capital Assets')}
        actions={
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="btn-primary py-2 px-4 text-[13.5px]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('+ নতুন খরচ', '+ Add Expense')}</span>
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AppleStatCard
          label={t('স্থায়ী খরচ', 'Fixed Expenses')}
          value={formatTaka(sumByCat('FIXED'))}
          subtext={t('ভাড়া, বিদ্যুৎ, ইন্টারনেট', 'Rent, utilities')}
          icon={<Zap className="w-4 h-4 text-[#0066cc]" />}
        />
        <AppleStatCard
          label={t('চলতি খরচ', 'Variable Expenses')}
          value={formatTaka(sumByCat('VARIABLE'))}
          subtext={t('আপ্যায়ন, যাতায়াত, মেরামত', 'Transport, repair')}
          icon={<Coffee className="w-4 h-4 text-[#0066cc]" />}
        />
        <AppleStatCard
          label={t('অ্যাসেট কেনা', 'Capital Assets')}
          value={formatTaka(sumByCat('CAPITAL_ASSET'))}
          subtext={t('খাঁচি, স্কেল, ফার্নিচার', 'Crates, scales')}
          icon={<Package className="w-4 h-4 text-[#0066cc]" />}
        />
        <AppleStatCard
          label={t('বিবিধ খরচ', 'Misc Expenses')}
          value={formatTaka(sumByCat('MISC'))}
          subtext={t('জরুরী নগদ খরচ', 'Misc cash costs')}
          icon={<TrendingDown className="w-4 h-4 text-[#0066cc]" />}
        />
      </div>

      <div className="card-apple p-4 sm:p-5 space-y-3">
        <h3 className="font-semibold text-[17px] text-[#1d1d1f]">
          {t('খরচের ভাউচার তালিকা', 'Expense Vouchers')}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-left bg-[#f5f5f7]">
                <th className="py-2 px-3 font-semibold">{t('কোড', 'Code')}</th>
                <th className="py-2 px-3 font-semibold">{t('তারিখ', 'Date')}</th>
                <th className="py-2 px-3 font-semibold">{t('খাত', 'Category')}</th>
                <th className="py-2 px-3 font-semibold">{t('বিবরণ', 'Title')}</th>
                <th className="py-2 px-3 font-semibold">{t('একাউন্ট', 'Account')}</th>
                <th className="py-2 px-3 font-semibold text-right">{t('পরিমাণ', 'Amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-7 text-center text-[#7a7a7a]">
                    {t('কোনো খরচের রেকর্ড নেই।', 'No expenses recorded yet.')}
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  const acc = accounts.find((a) => a.id === exp.account_id);
                  return (
                    <tr key={exp.id} className="hover:bg-[#f5f5f7]">
                      <td className="py-2 px-3 font-mono font-semibold text-[#0066cc]">
                        {exp.expense_code}
                      </td>
                      <td className="py-2 px-3 text-[#7a7a7a]">
                        {toBengaliNumber(exp.expense_date)}
                      </td>
                      <td className="py-2 px-3">
                        <span className="badge-blue text-[10px] py-0 px-2">
                          {catLabels[exp.expense_category]}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-[#1d1d1f]">{exp.title}</td>
                      <td className="py-2 px-3 text-[#7a7a7a]">{acc?.name || '---'}</td>
                      <td className="py-2 px-3 text-right font-semibold text-[#1d1d1f]">
                        {formatTaka(exp.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AppleModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t('নতুন খরচ এন্ট্রি', 'Add New Expense')}
      >
        <form onSubmit={handleCreateExpense} className="space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('খরচের খাত', 'Category')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Expense['expense_category'])}
              className="input-apple w-full text-[14px]"
            >
              <option value="FIXED">{t('স্থায়ী খরচ (ভাড়া, বিল)', 'Fixed (Rent, Utilities)')}</option>
              <option value="VARIABLE">{t('চলতি খরচ (আপ্যায়ন, মেরামত)', 'Variable (Transport, Repair)')}</option>
              <option value="CAPITAL_ASSET">{t('অ্যাসেট কেনা (খাঁচি, স্কেল)', 'Capital Asset (Crates, Scale)')}</option>
              <option value="MISC">{t('বিবিধ খরচ', 'Miscellaneous')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('খরচের বিবরণ *', 'Expense Title *')}
            </label>
            <input
              type="text"
              required
              placeholder={t('যেমন: বিদ্যুৎ বিল / ভ্যান মেরামত', 'e.g. Electricity bill / Van repair')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                {t('টাকার পরিমাণ (৳)', 'Amount (৳)')}
              </label>
              <div className="relative flex items-center">
                <span className="input-prefix-symbol">৳</span>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="input-apple input-has-prefix w-full text-[15px] font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                {t('তারিখ', 'Date')}
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="input-apple w-full text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('পেমেন্ট একাউন্ট', 'Payment Account')}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input-apple w-full text-[14px]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatTaka(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="btn-outline text-[13px] px-4"
            >
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('সংরক্ষণ করুন', 'Save Expense')}
            </button>
          </div>
        </form>
      </AppleModal>
    </div>
  );
};
