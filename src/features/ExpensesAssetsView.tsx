// ====================================================================
// DIMKHATA (ডিমখাতা) — Operational & Asset Expenses (Apple Design System)
// ====================================================================

import React, { useState } from 'react';
import { TrendingDown, Plus, Package, Zap, Coffee } from 'lucide-react';
import { Expense, FinancialAccount, Branch } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [category, setCategory] = useState<Expense['expense_category']>('FIXED');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [branchId] = useState(branches[0]?.id || '');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const monthlyExpenses = expenses.filter((e) => e.expense_date.startsWith(currentMonthStr));
  const fixedTotal = monthlyExpenses.filter((e) => e.expense_category === 'FIXED').reduce((s, e) => s + e.amount, 0);
  const variableTotal = monthlyExpenses.filter((e) => e.expense_category === 'VARIABLE').reduce((s, e) => s + e.amount, 0);
  const assetTotal = monthlyExpenses.filter((e) => e.expense_category === 'CAPITAL_ASSET').reduce((s, e) => s + e.amount, 0);
  const miscTotal = monthlyExpenses.filter((e) => e.expense_category === 'MISC').reduce((s, e) => s + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || amount <= 0) return;

    const code = DimKhataStore.getNextCode('EXP');
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      expense_code: code,
      branch_id: branchId,
      expense_category: category,
      title,
      amount,
      account_id: accountId,
      expense_date: expenseDate,
      is_capital_asset: category === 'CAPITAL_ASSET',
      notes,
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordExpense(newExpense);
    alert('খরচ সফলভাবে এন্ট্রি হয়েছে ও ক্যাশ বুক থেকে কর্তন হয়েছে!');
    setIsAddOpen(false);
    setTitle('');
    setAmount(1000);
    setNotes('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <AppleSectionHeader
        eyebrow="পরিচালনা ও অ্যাসেট হিসাব"
        title="দোকান খরচ ও অ্যাসেট (Expenses & Assets)"
        subtitle="স্থায়ী খরচ, চলতি আপ্যায়ন/মেরামত, ডিমের খাঁচি/ডিজিটাল স্কেল অ্যাসেট ও বিবিধ খরচ"
        actions={
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary py-2.5 px-5"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন খরচ এন্ট্রি করুন</span>
          </button>
        }
      />

      {/* 4 Expense Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <AppleStatCard
          label="স্থায়ী খরচ (Fixed)"
          value={formatTaka(fixedTotal)}
          subtext="দোকান ভাড়া, কারেন্ট বিল"
          icon={<Zap className="w-4 h-4 text-[#0066cc]" />}
        />

        <AppleStatCard
          label="চলতি খরচ (Variable)"
          value={formatTaka(variableTotal)}
          subtext="আপ্যায়ন, যাতায়াত, ভ্যান মেরামত"
          icon={<Coffee className="w-4 h-4 text-[#0066cc]" />}
        />

        <AppleStatCard
          label="অ্যাসেট কেনা (Capital Assets)"
          value={formatTaka(assetTotal)}
          subtext="ডিমের খাঁচি, স্কেল, ফার্নিচার"
          icon={<Package className="w-4 h-4 text-[#0066cc]" />}
        />

        <AppleStatCard
          label="বিবিধ খরচ (Misc)"
          value={formatTaka(miscTotal)}
          subtext="জরুরী আনঅফিশিয়াল নগদ খরচ"
          icon={<TrendingDown className="w-4 h-4 text-[#0066cc]" />}
        />
      </div>

      {/* Expenses Table */}
      <div className="card-apple p-5 sm:p-6 space-y-4">
        <h3 className="font-semibold text-[20px] text-[#1d1d1f]">
          খরচের বিবরণ ও ভাউচার তালিকা
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-left bg-[#f5f5f7]">
                <th className="py-2.5 px-3 font-semibold">ভাউচার কোড</th>
                <th className="py-2.5 px-3 font-semibold">তারিখ</th>
                <th className="py-2.5 px-3 font-semibold">খাত / ক্যাটাগরি</th>
                <th className="py-2.5 px-3 font-semibold">খরচের শিরোনাম</th>
                <th className="py-2.5 px-3 font-semibold">পেমেন্ট একাউন্ট</th>
                <th className="py-2.5 px-3 font-semibold text-right">টাকার পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#7a7a7a]">
                    কোনো খরচের রেকর্ড নেই।
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => {
                  const acc = accounts.find((a) => a.id === exp.account_id);
                  const catLabels = {
                    FIXED: 'স্থায়ী খরচ',
                    VARIABLE: 'চলতি খরচ',
                    CAPITAL_ASSET: 'অ্যাসেট কেনা',
                    MISC: 'বিবিধ খরচ',
                  };
                  return (
                    <tr key={exp.id} className="hover:bg-[#f5f5f7]">
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#0066cc]">
                        {exp.expense_code}
                      </td>
                      <td className="py-2.5 px-3 text-[#7a7a7a]">
                        {toBengaliNumber(exp.expense_date)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="badge-blue text-[10px] py-0 px-2">
                          {catLabels[exp.expense_category]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#1d1d1f]">
                        {exp.title}
                      </td>
                      <td className="py-2.5 px-3 text-[#7a7a7a]">
                        {acc?.name || 'ক্যাশ'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#1d1d1f]">
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

      {/* ADD EXPENSE MODAL */}
      <AppleModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="নতুন খরচ এন্ট্রি করুন"
        subtitle="অ্যাসেট কেনা বাদে বাকি খরচগুলো মাসিক লাভ-লোকসান থেকে বিয়োগ হবে"
      >
        <form onSubmit={handleCreateExpense} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              খরচের ক্যাটাগরি
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="input-apple w-full text-[14px]"
            >
              <option value="FIXED">স্থায়ী খরচ (দোকান ভাড়া, কারেন্ট বিল, ইন্টারনেট)</option>
              <option value="VARIABLE">চলতি খরচ (আপ্যায়ন, যাতায়াত, ভ্যান মেরামত)</option>
              <option value="CAPITAL_ASSET">অ্যাসেট কেনা (ডিমের খাঁচি, ডিজিটাল স্কেল, ফার্নিচার)</option>
              <option value="MISC">বিবিধ খরচ (জরুরী আনঅফিশিয়াল বা ক্যাশ খরচ)</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              খরচের শিরোনাম / বিবরণ
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: চলতি মাসের বিদ্যুৎ বিল / ভ্যান মেরামত"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                টাকার পরিমাণ (৳)
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="input-apple w-full text-[15px] font-semibold"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                তারিখ
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
              উৎস একাউন্ট
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
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              খরচ সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </AppleModal>
    </div>
  );
};
