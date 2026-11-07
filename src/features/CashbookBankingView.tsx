// ====================================================================
// DIMKHATA (ডিমখাতা) — Live Cashbook & Banking (Apple Design System)
// ====================================================================

import React, { useState } from 'react';
import { Wallet, Plus, RefreshCcw, Building, Smartphone, Settings } from 'lucide-react';
import { FinancialAccount, CashbookTransaction, Branch, CompanySettings } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { useLanguage } from '../lib/i18n';
import { AppleSectionHeader, AppleModal } from '../components/ui/AppleUI';

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
  const { t } = useLanguage();
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  const [isContraOpen, setIsContraOpen] = useState(false);
  const [fromAccount, setFromAccount] = useState(accounts[0]?.id || '');
  const [toAccount, setToAccount] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(5000);

  // Add New Account Modal State
  const [isAddAccOpen, setIsAddAccOpen] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<FinancialAccount['account_type']>('BANK');
  const [accNumber, setAccNumber] = useState('');
  const [accInitialBalance, setAccInitialBalance] = useState<number>(0);

  // Company Branding Modal State (Requirement 5)
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState<CompanySettings>(() => DimKhataStore.getCompany());

  const filteredTransactions = cashbook.filter((tx) => {
    if (filterAccount !== 'ALL' && tx.account_id !== filterAccount) return false;
    if (filterType !== 'ALL' && tx.transaction_type !== filterType) return false;
    return true;
  });

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName) return;

    const newAcc: FinancialAccount = {
      id: `acc-${Date.now()}`,
      name: accName,
      account_type: accType,
      account_number: accNumber,
      branch_id: branches[0]?.id || 'br-01',
      current_balance: accInitialBalance,
      is_default: false,
      is_active: true,
    };

    DimKhataStore.addAccount(newAcc);
    alert(t(`সফল! নতুন একাউন্ট "${accName}" যুক্ত করা হয়েছে।`, `Account "${accName}" added successfully!`));
    setIsAddAccOpen(false);
    setAccName('');
    setAccNumber('');
    setAccInitialBalance(0);
    onRefresh();
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    DimKhataStore.updateCompany(companyForm);
    alert(t('সফল! প্রতিষ্ঠানের ব্র্যান্ডিং ও মেমো তথ্য আপডেট করা হয়েছে।', 'Company branding & memo settings updated!'));
    setIsCompanyOpen(false);
    onRefresh();
  };

  const handleContraTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccount === toAccount) {
      alert(t('উৎস ও গন্তব্য একাউন্ট আলাদা হতে হবে!', 'Source and destination accounts must be different!'));
      return;
    }
    if (transferAmount <= 0) {
      alert(t('সঠিক টাকার অঙ্ক দিন!', 'Please enter a valid amount!'));
      return;
    }

    const fromAccObj = accounts.find((a) => a.id === fromAccount);
    if (!fromAccObj || fromAccObj.current_balance < transferAmount) {
      alert(t('উৎস একাউন্টে পর্যাপ্ত ব্যালেন্স নেই!', 'Insufficient balance in source account!'));
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

    alert(t('ফান্ড ট্রান্সফার সফল হয়েছে!', 'Fund transfer completed successfully!'));
    setIsContraOpen(false);
    onRefresh();
  };

  const getAccountIcon = (type: FinancialAccount['account_type']) => {
    switch (type) {
      case 'CASH':
        return <Wallet className="w-4 h-4 text-[#0066cc]" />;
      case 'MFS':
        return <Smartphone className="w-4 h-4 text-[#0066cc]" />;
      case 'BANK':
        return <Building className="w-4 h-4 text-[#0066cc]" />;
    }
  };

  return (
    <div className="space-y-6">
      <AppleSectionHeader
        eyebrow={t('প্রতিষ্ঠান ও ডিজিটাল ব্যাংকিং', 'Company & Digital Banking')}
        title={t('ক্যাশবুক ও ব্যাংক একাউন্ট (Live Cashbook)', 'Live Cashbook & Bank Accounts')}
        subtitle={t(
          'দোকানের ক্যাশ ড্রয়ার, ব্যাংক ও মোবাইল ব্যাংকিং (বিকাশ/নগদ) লাইভ সিঙ্ক ও মেমো ব্র্যান্ডিং',
          'Live synced shop cash drawer, bank accounts, mobile banking (bKash/Nagad) & invoice branding'
        )}
        actions={
          <>
            <button
              onClick={() => {
                setCompanyForm(DimKhataStore.getCompany());
                setIsCompanyOpen(true);
              }}
              className="btn-outline text-[13px] px-4"
            >
              <Settings className="w-4 h-4" />
              <span>{t('প্রতিষ্ঠান ব্র্যান্ডিং', 'Company Branding')}</span>
            </button>

            <button
              onClick={() => setIsAddAccOpen(true)}
              className="btn-outline text-[13px] px-4"
            >
              <Plus className="w-4 h-4" />
              <span>{t('নতুন একাউন্ট যোগ', '+ Add Account')}</span>
            </button>

            <button
              onClick={() => setIsContraOpen(true)}
              className="btn-primary text-[13px] px-5"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>{t('ফান্ড ট্রান্সফার', 'Fund Transfer')}</span>
            </button>
          </>
        }
      />

      {/* Account Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="card-apple p-5 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="badge-blue text-[10px] py-0 px-2">
                  {acc.account_type === 'MFS'
                    ? t('মোবাইল ব্যাংকিং', 'Mobile Banking')
                    : acc.account_type === 'BANK'
                    ? t('ব্যাংক হিসাব', 'Bank Account')
                    : t('ক্যাশ ড্রয়ার', 'Cash Drawer')}
                </span>
                <h3 className="font-semibold text-[16px] text-[#1d1d1f] mt-2">{acc.name}</h3>
                {acc.account_number && (
                  <p className="text-[11px] font-mono text-[#7a7a7a] mt-0.5">
                    {acc.account_number}
                  </p>
                )}
              </div>
              <div className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                {getAccountIcon(acc.account_type)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e0e0e0]">
              <div className="text-[11px] text-[#7a7a7a]">{t('বর্তমান লাইভ স্থিতি', 'Live Balance')}</div>
              <div className="font-semibold text-[22px] text-[#1d1d1f] mt-0.5">
                {formatTaka(acc.current_balance)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Cashbook Transactions Stream */}
      <div className="card-apple p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0e0e0] pb-3.5">
          <div>
            <h3 className="font-semibold text-[20px] text-[#1d1d1f]">
              মূল ক্যাশ বই ও লেনদেন হিস্ট্রি (Live Cashbook)
            </h3>
            <p className="text-[12px] text-[#7a7a7a]">
              প্রতিটি মেমো, কালেকশন, মহাজন পেমেন্ট ও খরচের ডিজিটাল সিঙ্ক রেকর্ড
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="input-apple text-[13px] py-1.5"
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
              className="input-apple text-[13px] py-1.5"
            >
              <option value="ALL">সকল ধরন</option>
              <option value="CASH_IN">জমা (Cash In)</option>
              <option value="CASH_OUT">খরচ/পেমেন্ট (Cash Out)</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-left bg-[#f5f5f7]">
                <th className="py-2.5 px-3 font-semibold">তারিখ</th>
                <th className="py-2.5 px-3 font-semibold">একাউন্ট</th>
                <th className="py-2.5 px-3 font-semibold">খাত / বিবরণ</th>
                <th className="py-2.5 px-3 font-semibold">রেফারেন্স</th>
                <th className="py-2.5 px-3 font-semibold text-right">টাকার অঙ্ক</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#7a7a7a]">
                    কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 25).map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.account_id);
                  const isCashIn = tx.transaction_type === 'CASH_IN';
                  return (
                    <tr key={tx.id} className="hover:bg-[#f5f5f7] transition">
                      <td className="py-2.5 px-3 text-[#7a7a7a] whitespace-nowrap">
                        {toBengaliNumber(tx.transaction_date.slice(0, 10))}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#1d1d1f]">
                        {acc?.name || 'ক্যাশ'}
                      </td>
                      <td className="py-2.5 px-3 text-[#4e4e4e]">
                        {tx.description || tx.category}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#0066cc]">
                        {tx.reference_id || '---'}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                          isCashIn ? 'text-[#15803d]' : 'text-[#1d1d1f]'
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
      <AppleModal
        isOpen={isContraOpen}
        onClose={() => setIsContraOpen(false)}
        title="ফান্ড ট্রান্সফার (Contra Transfer)"
        subtitle="ক্যাশ ড্রয়ার থেকে টাকা ব্যাংকে জমা বা বিকাশ ক্যাশ-ইন"
      >
        <form onSubmit={handleContraTransfer} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              উৎস একাউন্ট (টাকা যাবে)
            </label>
            <select
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              className="input-apple w-full text-[14px]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatTaka(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              গন্তব্য একাউন্ট (জমা হবে)
            </label>
            <select
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              className="input-apple w-full text-[14px]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatTaka(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              টাকার পরিমাণ (৳)
            </label>
            <input
              type="number"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(Number(e.target.value) || 0)}
              className="input-apple w-full text-[15px] font-semibold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsContraOpen(false)}
              className="btn-outline text-[13px] px-4"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              ট্রান্সফার সম্পন্ন করুন
            </button>
          </div>
        </form>
      </AppleModal>

      {/* ADD NEW FINANCIAL ACCOUNT MODAL */}
      <AppleModal
        isOpen={isAddAccOpen}
        onClose={() => setIsAddAccOpen(false)}
        title="নতুন ব্যাংক বা ডিজিটাল একাউন্ট যোগ"
      >
        <form onSubmit={handleAddAccount} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              একাউন্টের নাম
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: ডাচ-বাংলা ব্যাংক / রকেট মার্চেন্ট"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                একাউন্টের ধরন
              </label>
              <select
                value={accType}
                onChange={(e) => setAccType(e.target.value as any)}
                className="input-apple w-full text-[14px]"
              >
                <option value="BANK">ব্যাংক হিসাব</option>
                <option value="MFS">মোবাইল ব্যাংকিং (MFS)</option>
                <option value="CASH">ক্যাশ ড্রয়ার</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                একাউন্ট / মোবাইল নম্বর
              </label>
              <input
                type="text"
                placeholder="হিসাব নম্বর"
                value={accNumber}
                onChange={(e) => setAccNumber(e.target.value)}
                className="input-apple w-full text-[14px] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              প্রারম্ভিক ব্যালেন্স (Opening Balance ৳)
            </label>
            <input
              type="number"
              value={accInitialBalance}
              onChange={(e) => setAccInitialBalance(Number(e.target.value) || 0)}
              className="input-apple w-full text-[15px] font-semibold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddAccOpen(false)}
              className="btn-outline text-[13px] px-4"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </AppleModal>

      {/* COMPANY BRANDING PROFILE MODAL */}
      <AppleModal
        isOpen={isCompanyOpen}
        onClose={() => setIsCompanyOpen(false)}
        title="প্রতিষ্ঠানের ব্র্যান্ডিং ও মেমো প্রোফাইল"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveCompany} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                প্রতিষ্ঠানের নাম (বাংলা)
              </label>
              <input
                type="text"
                required
                value={companyForm.company_name_bn}
                onChange={(e) => setCompanyForm({ ...companyForm, company_name_bn: e.target.value })}
                className="input-apple w-full text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                প্রতিষ্ঠানের নাম (English)
              </label>
              <input
                type="text"
                required
                value={companyForm.company_name_en}
                onChange={(e) => setCompanyForm({ ...companyForm, company_name_en: e.target.value })}
                className="input-apple w-full text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              ট্যাগলাইন / স্লোগান
            </label>
            <input
              type="text"
              value={companyForm.tagline}
              onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                মোবাইল নম্বরসমূহ
              </label>
              <input
                type="text"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                className="input-apple w-full text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                প্রধান আড়ত ও ঠিকানা
              </label>
              <input
                type="text"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="input-apple w-full text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              ইনভয়েস/মেমো ফুটার নোট
            </label>
            <input
              type="text"
              value={companyForm.invoice_footer_note}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, invoice_footer_note: e.target.value })
              }
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCompanyOpen(false)}
              className="btn-outline text-[13px] px-4"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              ব্র্যান্ডিং আপডেট করুন
            </button>
          </div>
        </form>
      </AppleModal>
    </div>
  );
};
