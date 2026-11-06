// ====================================================================
// DIMKHATA (ডিমখাতা) — Operational & Asset Expenses (ElevenLabs Design)
// ====================================================================

import React, { useState } from 'react';
import { TrendingDown, Plus, Package, Zap, Coffee } from 'lucide-react';
import { Expense, FinancialAccount, Branch } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';

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
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-light text-3xl text-[#0c0a09] tracking-tight">
            পরিচালনা ও অন্যান্য খরচ (Operational Expenses)
          </h2>
          <p className="text-xs text-[#777169] mt-0.5">
            স্থায়ী খরচ, চলতি আপ্যায়ন/মেরামত, ডিমের খাঁচি/ডিজিটাল স্কেল অ্যাসেট ও বিবিধ খরচ
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন খরচ এন্ট্রি করুন</span>
        </button>
      </div>

      {/* 4 Expense Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fixed Expenses */}
        <div className="card-editorial flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777169] text-xs">
            <span className="font-medium tracking-wide">স্থায়ী খরচ (Fixed)</span>
            <div className="w-8 h-8 rounded-full bg-[#f0efed] text-[#292524] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-light text-2xl sm:text-3xl text-[#0c0a09] mt-3">
            {formatTaka(fixedTotal)}
          </div>
          <p className="text-[11px] text-[#777169] mt-1">দোকান ভাড়া, কারেন্ট বিল</p>
        </div>

        {/* Variable Expenses */}
        <div className="card-editorial flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777169] text-xs">
            <span className="font-medium tracking-wide">চলতি খরচ (Variable)</span>
            <div className="w-8 h-8 rounded-full bg-[#f0efed] text-[#292524] flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-light text-2xl sm:text-3xl text-[#0c0a09] mt-3">
            {formatTaka(variableTotal)}
          </div>
          <p className="text-[11px] text-[#777169] mt-1">আপ্যায়ন, যাতায়াত, ভ্যান মেরামত</p>
        </div>

        {/* Capital Assets */}
        <div className="card-editorial flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777169] text-xs">
            <span className="font-medium tracking-wide">অ্যাসেট কেনা (Capital Assets)</span>
            <div className="w-8 h-8 rounded-full bg-[#f0efed] text-[#292524] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-light text-2xl sm:text-3xl text-[#0c0a09] mt-3">
            {formatTaka(assetTotal)}
          </div>
          <p className="text-[11px] text-[#777169] mt-1">ডিমের খাঁচি, স্কেল, ফার্নিচার</p>
        </div>

        {/* Misc Expenses */}
        <div className="card-editorial flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#777169] text-xs">
            <span className="font-medium tracking-wide">বিবিধ খরচ (Misc)</span>
            <div className="w-8 h-8 rounded-full bg-[#f0efed] text-[#292524] flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-light text-2xl sm:text-3xl text-[#0c0a09] mt-3">
            {formatTaka(miscTotal)}
          </div>
          <p className="text-[11px] text-[#777169] mt-1">জরুরী আনঅফিশিয়াল নগদ খরচ</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card-editorial space-y-4">
        <h3 className="font-serif font-light text-2xl text-[#0c0a09]">
          খরচের বিবরণ ও ভাউচার তালিকা
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e7e5e4] text-[#777169] text-left bg-[#fafafa]">
                <th className="py-2.5 px-3">ভাউচার কোড</th>
                <th className="py-2.5 px-3">তারিখ</th>
                <th className="py-2.5 px-3">খাত / ক্যাটাগরি</th>
                <th className="py-2.5 px-3">খরচের শিরোনাম</th>
                <th className="py-2.5 px-3">পেমেন্ট একাউন্ট</th>
                <th className="py-2.5 px-3 text-right">টাকার পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0efed]">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#a8a29e]">
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
                    <tr key={exp.id} className="hover:bg-[#fafafa]">
                      <td className="py-2.5 px-3 font-mono text-[#0c0a09]">
                        {exp.expense_code}
                      </td>
                      <td className="py-2.5 px-3 text-[#777169]">
                        {toBengaliNumber(exp.expense_date)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="badge-pill text-[10px] py-0 px-2">
                          {catLabels[exp.expense_category]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#0c0a09]">
                        {exp.title}
                      </td>
                      <td className="py-2.5 px-3 text-[#777169]">
                        {acc?.name || 'ক্যাশ'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#0c0a09]">
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
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#e7e5e4]">
            <h3 className="font-serif font-light text-2xl text-[#0c0a09]">
              নতুন খরচ এন্ট্রি করুন
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  খরচের ক্যাটাগরি
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="input-editorial w-full text-xs"
                >
                  <option value="FIXED">স্থায়ী খরচ (দোকান ভাড়া, কারেন্ট বিল, ইন্টারনেট)</option>
                  <option value="VARIABLE">চলতি খরচ (আপ্যায়ন, যাতায়াত, ভ্যান মেরামত)</option>
                  <option value="CAPITAL_ASSET">অ্যাসেট কেনা (ডিমের খাঁচি, ডিজিটাল স্কেল, ফার্নিচার)</option>
                  <option value="MISC">বিবিধ খরচ (জরুরী আনঅফিশিয়াল বা ক্যাশ খরচ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  খরচের শিরোনাম / বিবরণ
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: চলতি মাসের বিদ্যুৎ বিল / ভ্যান মেরামত"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-[#292524] mb-1">
                    টাকার পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="input-editorial w-full text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#292524] mb-1">
                    তারিখ
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="input-editorial w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  উৎস একাউন্ট
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="input-editorial w-full text-xs"
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
                  className="btn-outline text-xs h-9 px-4"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs h-9 px-5"
                >
                  খরচ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
