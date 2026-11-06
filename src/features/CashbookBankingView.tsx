// ====================================================================
// DIMKHATA (ডিমখাতা) — Cashbook & Banking Hub (Req 5)
// ====================================================================

import React, { useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, RefreshCcw, Building, CreditCard, Smartphone } from 'lucide-react';
import { FinancialAccount, CashbookTransaction, Branch } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';

interface CashbookBankingViewProps {
  accounts: FinancialAccount[];
  cashbook: CashbookTransaction[];
  branches: Branch[];
  onRefresh: () => void;
}

export const CashbookBankingView: React.FC<CashbookBankingViewProps> = ({
  accounts,
  cashbook,
  branches,
  onRefresh,
}) => {
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Quick Contra Transfer Modal (ক্যাশ থেকে ব্যাংক / বিকাশ)
  const [isContraOpen, setIsContraOpen] = useState(false);
  const [fromAccount, setFromAccount] = useState(accounts[0]?.id || '');
  const [toAccount, setToAccount] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(5000);
  const [transferNote, setTransferNote] = useState('');

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  const filteredTransactions = cashbook.filter((tx) => {
    if (filterAccount !== 'ALL' && tx.account_id !== filterAccount) return false;
    if (filterType !== 'ALL' && tx.transaction_type !== filterType) return false;
    return true;
  });

  const handleContraTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccount === toAccount) {
      alert('উৎস ও গন্তব্য একাউন্ট আলাদা হতে হবে!');
      return;
    }
    if (transferAmount <= 0) {
      alert('সঠিক টাকার অঙ্ক দিন!');
      return;
    }

    const fromAccObj = accounts.find((a) => a.id === fromAccount);
    if (!fromAccObj || fromAccObj.current_balance < transferAmount) {
      alert('উৎস একাউন্টে পর্যাপ্ত ব্যালেন্স নেই!');
      return;
    }

    // Cash Out from source
    DimKhataStore.postCashbook(
      fromAccount,
      'br-01',
      'CASH_OUT',
      'CONTRA_TRANSFER' as any,
      transferAmount,
      `TRF-${Date.now()}`,
      `আন্তঃএকাউন্ট ফান্ড ট্রান্সফার (প্রাপক: ${accounts.find((a) => a.id === toAccount)?.name})`
    );

    // Cash In to target
    DimKhataStore.postCashbook(
      toAccount,
      'br-01',
      'CASH_IN',
      'CONTRA_TRANSFER' as any,
      transferAmount,
      `TRF-${Date.now()}`,
      `আন্তঃএকাউন্ট ফান্ড রিসিভ (প্রেরক: ${fromAccObj.name})`
    );

    alert('ফান্ড ট্রান্সফার সফল হয়েছে!');
    setIsContraOpen(false);
    onRefresh();
  };

  const getAccountIcon = (type: FinancialAccount['account_type']) => {
    switch (type) {
      case 'CASH':
        return <Wallet className="w-5 h-5 text-amber-600" />;
      case 'MFS':
        return <Smartphone className="w-5 h-5 text-rose-600" />;
      case 'BANK':
        return <Building className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-700" />
            <span>প্রতিষ্ঠান ও ব্যাংক একাউন্ট (Live Cashbook & Banking)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            দোকানের ক্যাশ ড্রয়ার, ব্যাংক ও মোবাইল ব্যাংকিং (বিকাশ/নগদ) লাইভ সিঙ্ক
          </p>
        </div>

        <button
          onClick={() => setIsContraOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>ফান্ড ট্রান্সফার (ক্যাশ ⇄ ব্যাংক/বিকাশ)</span>
        </button>
      </div>

      {/* Account Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 transition flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {acc.account_type === 'MFS' ? 'মোবাইল ব্যাংকিং' : acc.account_type === 'BANK' ? 'ব্যাংক হিসাব' : 'ক্যাশ তহবিল'}
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-0.5">{acc.name}</h3>
                {acc.account_number && (
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {acc.account_number}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                {getAccountIcon(acc.account_type)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">বর্তমান লাইভ স্থিতি</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {formatTaka(acc.current_balance)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Cashbook Transactions Stream */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              মূল ক্যাশ বই ও লেনদেন হিস্ট্রি (Live Cashbook)
            </h3>
            <p className="text-xs text-slate-400">
              প্রতিটি মেমো, কালেকশন, মহাজন পেমেন্ট ও খরচের ডিজিটাল সিঙ্ক রেকর্ড
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="ALL">সকল একাউন্ট</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="ALL">সকল ধরন</option>
              <option value="CASH_IN">জমা (Cash In)</option>
              <option value="CASH_OUT">খরচ/পেমেন্ট (Cash Out)</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50">
                <th className="py-2.5 px-3 font-semibold">তারিখ ও সময়</th>
                <th className="py-2.5 px-3 font-semibold">একাউন্ট</th>
                <th className="py-2.5 px-3 font-semibold">খাত / বিবরণ</th>
                <th className="py-2.5 px-3 font-semibold">রেফারেন্স</th>
                <th className="py-2.5 px-3 font-semibold text-right">টাকার অঙ্ক</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 25).map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.account_id);
                  const isCashIn = tx.transaction_type === 'CASH_IN';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {toBengaliNumber(tx.transaction_date.slice(0, 10))}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {acc?.name || 'ক্যাশ'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {tx.description || tx.category}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {tx.reference_id || '---'}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-black whitespace-nowrap ${
                          isCashIn ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isCashIn ? '+' : '-'} {formatTaka(tx.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONTRA TRANSFER MODAL */}
      {isContraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              আন্তঃএকাউন্ট ফান্ড ট্রান্সফার (Contra Transfer)
            </h3>
            <p className="text-xs text-slate-500">
              যেমন: ক্যাশ ড্রয়ার থেকে টাকা ব্যাংকে জমা বা বিকাশ ক্যাশ-ইন
            </p>

            <form onSubmit={handleContraTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টাকা কোথা থেকে যাবে (Source Account)
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatTaka(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কোথায় জমা হবে (Destination Account)
                </label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatTaka(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContraOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs"
                >
                  ট্রান্সফার সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
