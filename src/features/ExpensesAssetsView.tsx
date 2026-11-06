// ====================================================================
// DIMKHATA (ডিমখাতা) — Operational & Capital Asset Expenses (Req 12)
// ====================================================================

import React, { useState } from 'react';
import { TrendingDown, Plus, Package, Zap, Coffee, ShieldAlert, History } from 'lucide-react';
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

  // Categorized monthly summaries
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-700" />
            <span>পরিচালনা ও অন্যান্য খরচ (Operational & Asset Expenses - Req 12)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            স্থায়ী খরচ, চলতি আপ্যায়ন/মেরামত, ডিমের খাঁচি/ডিজিটাল স্কেল অ্যাসেট ও বিবিধ খরচ
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন খরচ এন্ট্রি করুন</span>
        </button>
      </div>

      {/* 4 Expense Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Fixed Expenses */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>স্থায়ী খরচ (Fixed)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatTaka(fixedTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">দোকান ভাড়া, কারেন্ট বিল</p>
        </div>

        {/* Variable Expenses */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>চলতি খরচ (Variable)</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatTaka(variableTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">আপ্যায়ন, যাতায়াত, ভ্যান মেরামত</p>
        </div>

        {/* Capital Assets */}
        <div className="bg-white rounded-2xl p-4 border border-purple-200 bg-purple-50/20 shadow-xs">
          <div className="flex items-center justify-between text-purple-900 text-xs font-semibold">
            <span>অ্যাসেট কেনা (Assets)</span>
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-900 mt-2">
            {formatTaka(assetTotal)}
          </div>
          <p className="text-[11px] text-purple-600 mt-0.5">ডিমের খাঁচি, স্কেল, ফার্নিচার</p>
        </div>

        {/* Misc Expenses */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>বিবিধ খরচ (Misc)</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatTaka(miscTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">জরুরী আনঅফিশিয়াল নগদ খরচ</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-base text-slate-900">
          খরচের বিবরণ ও ভাউচার তালিকা
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50">
                <th className="py-2.5 px-3">ভাউচার কোড</th>
                <th className="py-2.5 px-3">তারিখ</th>
                <th className="py-2.5 px-3">খাত / ক্যাটাগরি</th>
                <th className="py-2.5 px-3">খরচের শিরোনাম</th>
                <th className="py-2.5 px-3">পেমেন্ট একাউন্ট</th>
                <th className="py-2.5 px-3 text-right">টাকার পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
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
                    <tr key={exp.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {exp.expense_code}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {toBengaliNumber(exp.expense_date)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            exp.is_capital_asset
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {catLabels[exp.expense_category]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {exp.title}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {acc?.name || 'ক্যাশ'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-700">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              নতুন খরচ এন্ট্রি করুন
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  খরচের ক্যাটাগরি
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  <option value="FIXED">স্থায়ী খরচ (দোকান ভাড়া, কারেন্ট বিল, ইন্টারনেট)</option>
                  <option value="VARIABLE">চলতি খরচ (আপ্যায়ন, যাতায়াত, ভ্যান মেরামত)</option>
                  <option value="CAPITAL_ASSET">অ্যাসেট কেনা (ডিমের খাঁচি, ডিজিটাল স্কেল, ফার্নিচার)</option>
                  <option value="MISC">বিবিধ খরচ (স্থানীয় আনঅফিশিয়াল বা ক্যাশ খরচ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  খরচের শিরোনাম / বিবরণ
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: চলতি মাসের বিদ্যুৎ বিল / ভ্যান মেরামত"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    টাকার পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-rose-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    তারিখ
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কোন একাউন্ট থেকে পরিশোধ করা হলো?
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs"
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
