// ====================================================================
// DIMKHATA (ডিমখাতা) — Live Cashbook & Banking (ElevenLabs Design)
// ====================================================================

import React, { useState } from 'react';
import { Wallet, Plus, RefreshCcw, Building, Smartphone } from 'lucide-react';
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

  const [isContraOpen, setIsContraOpen] = useState(false);
  const [fromAccount, setFromAccount] = useState(accounts[0]?.id || '');
  const [toAccount, setToAccount] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(5000);

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

    DimKhataStore.postCashbook(
      fromAccount,
      'br-01',
      'CASH_OUT',
      'CONTRA_TRANSFER' as any,
      transferAmount,
      `TRF-${Date.now()}`,
      `আন্তঃএকাউন্ট ফান্ড ট্রান্সফার (প্রাপক: ${accounts.find((a) => a.id === toAccount)?.name})`
    );

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
        return <Wallet className="w-4 h-4 text-[#292524]" />;
      case 'MFS':
        return <Smartphone className="w-4 h-4 text-[#292524]" />;
      case 'BANK':
        return <Building className="w-4 h-4 text-[#292524]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-light text-3xl text-[#0c0a09] tracking-tight">
            প্রতিষ্ঠান ও ব্যাংক একাউন্ট (Live Cashbook)
          </h2>
          <p className="text-xs text-[#777169] mt-0.5">
            দোকানের ক্যাশ ড্রয়ার, ব্যাংক ও মোবাইল ব্যাংকিং (বিকাশ/নগদ) লাইভ সিঙ্ক
          </p>
        </div>

        <button
          onClick={() => setIsContraOpen(true)}
          className="btn-primary"
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
            className="card-editorial flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="badge-pill text-[10px] py-0 px-2">
                  {acc.account_type === 'MFS' ? 'মোবাইল ব্যাংকিং' : acc.account_type === 'BANK' ? 'ব্যাংক হিসাব' : 'ক্যাশ ড্রয়ার'}
                </span>
                <h3 className="font-medium text-sm text-[#0c0a09] mt-2">{acc.name}</h3>
                {acc.account_number && (
                  <p className="text-[11px] font-mono text-[#777169] mt-0.5">
                    {acc.account_number}
                  </p>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-[#f0efed] border border-[#e7e5e4] flex items-center justify-center">
                {getAccountIcon(acc.account_type)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f0efed]">
              <div className="text-[11px] text-[#777169]">বর্তমান লাইভ স্থিতি</div>
              <div className="font-serif font-light text-2xl text-[#0c0a09] mt-0.5">
                {formatTaka(acc.current_balance)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Cashbook Transactions Stream */}
      <div className="card-editorial space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0efed] pb-3">
          <div>
            <h3 className="font-serif font-light text-2xl text-[#0c0a09]">
              মূল ক্যাশ বই ও লেনদেন হিস্ট্রি (Live Cashbook)
            </h3>
            <p className="text-xs text-[#777169]">
              প্রতিটি মেমো, কালেকশন, মহাজন পেমেন্ট ও খরচের ডিজিটাল সিঙ্ক রেকর্ড
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="input-editorial text-xs h-9 py-1"
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
              className="input-editorial text-xs h-9 py-1"
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
              <tr className="border-b border-[#e7e5e4] text-[#777169] text-left bg-[#fafafa]">
                <th className="py-2.5 px-3 font-medium">তারিখ ও সময়</th>
                <th className="py-2.5 px-3 font-medium">একাউন্ট</th>
                <th className="py-2.5 px-3 font-medium">খাত / বিবরণ</th>
                <th className="py-2.5 px-3 font-medium">রেফারেন্স</th>
                <th className="py-2.5 px-3 font-medium text-right">টাকার অঙ্ক</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0efed]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#a8a29e]">
                    কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 25).map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.account_id);
                  const isCashIn = tx.transaction_type === 'CASH_IN';
                  return (
                    <tr key={tx.id} className="hover:bg-[#fafafa] transition">
                      <td className="py-2.5 px-3 text-[#777169] whitespace-nowrap">
                        {toBengaliNumber(tx.transaction_date.slice(0, 10))}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#0c0a09]">
                        {acc?.name || 'ক্যাশ'}
                      </td>
                      <td className="py-2.5 px-3 text-[#4e4e4e]">
                        {tx.description || tx.category}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#777169]">
                        {tx.reference_id || '---'}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-medium whitespace-nowrap ${
                          isCashIn ? 'text-[#16a34a]' : 'text-[#0c0a09]'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#e7e5e4]">
            <h3 className="font-serif font-light text-2xl text-[#0c0a09]">
              ফান্ড ট্রান্সফার (Contra Transfer)
            </h3>
            <p className="text-xs text-[#777169]">
              যেমন: ক্যাশ ড্রয়ার থেকে টাকা ব্যাংকে জমা বা বিকাশ ক্যাশ-ইন
            </p>

            <form onSubmit={handleContraTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  উৎস একাউন্ট (টাকা যাবে)
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="input-editorial w-full text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatTaka(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  গন্তব্য একাউন্ট (জমা হবে)
                </label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="input-editorial w-full text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatTaka(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value) || 0)}
                  className="input-editorial w-full text-sm font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContraOpen(false)}
                  className="btn-outline text-xs h-9 px-4"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs h-9 px-5"
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
