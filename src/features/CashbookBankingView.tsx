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

  const [isAddAccOpen, setIsAddAccOpen] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<FinancialAccount['account_type']>('BANK');
  const [accNumber, setAccNumber] = useState('');
  const [accInitialBalance, setAccInitialBalance] = useState<number>(0);

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

    DimKhataStore.addAccount({
      name: accName,
      account_type: accType,
      account_number: accNumber,
      branch_id: branches[0]?.id || 'br-01',
      current_balance: accInitialBalance,
      is_default: false,
      is_active: true,
    });

    setIsAddAccOpen(false);
    setAccName('');
    setAccNumber('');
    setAccInitialBalance(0);
    onRefresh();
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    DimKhataStore.updateCompany(companyForm);
    setIsCompanyOpen(false);
    onRefresh();
  };

  const handleContraTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccount === toAccount) {
      alert(t('উৎস ও গন্তব্য একাউন্ট আলাদা হতে হবে!', 'Source and destination accounts must differ!'));
      return;
    }
    if (transferAmount <= 0) return;

    const fromAccObj = accounts.find((a) => a.id === fromAccount);
    if (!fromAccObj || fromAccObj.current_balance < transferAmount) {
      alert(t('উৎস একাউন্টে পর্যাপ্ত ব্যালেন্স নেই!', 'Insufficient balance in source account!'));
      return;
    }

    const ref = `TRF-${Date.now()}`;
    DimKhataStore.postCashbook(
      fromAccount,
      'br-01',
      'CASH_OUT',
      'CONTRA_TRANSFER',
      transferAmount,
      ref,
      `${t('ফান্ড ট্রান্সফার (প্রাপক:', 'Transfer to:')} ${accounts.find((a) => a.id === toAccount)?.name})`
    );
    DimKhataStore.postCashbook(
      toAccount,
      'br-01',
      'CASH_IN',
      'CONTRA_TRANSFER',
      transferAmount,
      ref,
      `${t('ফান্ড রিসিভ (প্রেরক:', 'Received from:')} ${fromAccObj.name})`
    );

    setIsContraOpen(false);
    onRefresh();
  };

  const getAccountIcon = (type: FinancialAccount['account_type']) => {
    if (type === 'CASH') return <Wallet className="w-4 h-4 text-[#0066cc]" />;
    if (type === 'MFS') return <Smartphone className="w-4 h-4 text-[#0066cc]" />;
    return <Building className="w-4 h-4 text-[#0066cc]" />;
  };

  return (
    <div className="space-y-4">
      <AppleSectionHeader
        title={t('ক্যাশবুক ও ব্যাংক একাউন্ট', 'Cashbook & Bank Accounts')}
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setCompanyForm(DimKhataStore.getCompany());
                setIsCompanyOpen(true);
              }}
              className="btn-outline text-[13px] px-3.5"
            >
              <Settings className="w-4 h-4" />
              <span>{t('ব্র্যান্ডিং', 'Branding')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddAccOpen(true)}
              className="btn-outline text-[13px] px-3.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('+ নতুন একাউন্ট', '+ Account')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsContraOpen(true)}
              className="btn-primary text-[13px] px-4"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>{t('ফান্ড ট্রান্সফার', 'Transfer')}</span>
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {accounts.map((acc) => (
          <div key={acc.id} className="card-apple p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge-blue text-[10px] py-0 px-2">
                  {acc.account_type === 'MFS'
                    ? t('মোবাইল ব্যাংকিং', 'MFS')
                    : acc.account_type === 'BANK'
                    ? t('ব্যাংক হিসাব', 'Bank')
                    : t('ক্যাশ ড্রয়ার', 'Cash')}
                </span>
                <h3 className="font-semibold text-[15.5px] text-[#1d1d1f] mt-1.5">{acc.name}</h3>
                {acc.account_number && (
                  <p className="text-[11px] font-mono text-[#7a7a7a] mt-0.5">{acc.account_number}</p>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                {getAccountIcon(acc.account_type)}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#e0e0e0]">
              <div className="text-[11px] text-[#7a7a7a]">{t('বর্তমান ব্যালেন্স', 'Current Balance')}</div>
              <div className="font-semibold text-[21px] text-[#1d1d1f] mt-0.5">
                {formatTaka(acc.current_balance)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-apple p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#e0e0e0] pb-3">
          <h3 className="font-semibold text-[17px] text-[#1d1d1f]">
            {t('লেনদেন হিস্ট্রি (Cashbook)', 'Cashbook Transactions')}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="input-apple text-[13px] py-1.5"
            >
              <option value="ALL">{t('সকল একাউন্ট', 'All Accounts')}</option>
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
              <option value="ALL">{t('সকল ধরন', 'All Types')}</option>
              <option value="CASH_IN">{t('জমা (Cash In)', 'Cash In')}</option>
              <option value="CASH_OUT">{t('খরচ (Cash Out)', 'Cash Out')}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-left bg-[#f5f5f7]">
                <th className="py-2 px-3 font-semibold">{t('তারিখ', 'Date')}</th>
                <th className="py-2 px-3 font-semibold">{t('রেফারেন্স', 'Reference')}</th>
                <th className="py-2 px-3 font-semibold">{t('একাউন্ট', 'Account')}</th>
                <th className="py-2 px-3 font-semibold">{t('বিবরণ', 'Description')}</th>
                <th className="py-2 px-3 font-semibold">{t('ধরন', 'Type')}</th>
                <th className="py-2 px-3 font-semibold text-right">{t('পরিমাণ', 'Amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-7 text-center text-[#7a7a7a]">
                    {t('কোনো লেনদেন পাওয়া যায়নি।', 'No transactions found.')}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.account_id);
                  const isCashIn = tx.transaction_type === 'CASH_IN';
                  return (
                    <tr key={tx.id} className="hover:bg-[#f5f5f7]">
                      <td className="py-2 px-3 text-[#7a7a7a] whitespace-nowrap">
                        {toBengaliNumber(tx.transaction_date.split('T')[0])}
                      </td>
                      <td className="py-2 px-3 font-mono text-[12px] font-semibold text-[#0066cc]">
                        {tx.reference_id}
                      </td>
                      <td className="py-2 px-3 font-medium text-[#1d1d1f]">{acc?.name || '---'}</td>
                      <td className="py-2 px-3 text-[#4e4e4e]">{tx.description}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`badge-pill text-[10px] py-0 px-2 ${
                            isCashIn ? 'text-[#15803d]' : 'text-[#d92916]'
                          }`}
                        >
                          {isCashIn ? t('জমা', 'In') : t('খরচ', 'Out')}
                        </span>
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-semibold ${
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

      {/* Contra Transfer Modal */}
      <AppleModal
        isOpen={isContraOpen}
        onClose={() => setIsContraOpen(false)}
        title={t('আন্তঃএকাউন্ট ফান্ড ট্রান্সফার', 'Inter-Account Fund Transfer')}
      >
        <form onSubmit={handleContraTransfer} className="space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('উৎস একাউন্ট (From)', 'From Account')}
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
              {t('গন্তব্য একাউন্ট (To)', 'To Account')}
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
              {t('টাকার পরিমাণ (৳)', 'Transfer Amount (৳)')}
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
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('ট্রান্সফার করুন', 'Transfer Now')}
            </button>
          </div>
        </form>
      </AppleModal>

      {/* Add Account Modal */}
      <AppleModal
        isOpen={isAddAccOpen}
        onClose={() => setIsAddAccOpen(false)}
        title={t('নতুন ব্যাংক বা মোবাইল একাউন্ট যোগ', 'Add Bank or Mobile Account')}
      >
        <form onSubmit={handleAddAccount} className="space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('একাউন্টের নাম *', 'Account Name *')}
            </label>
            <input
              type="text"
              required
              placeholder={t('যেমন: ডাচ-বাংলা ব্যাংক / রকেট', 'e.g. DBBL / Rocket')}
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                {t('ধরন', 'Account Type')}
              </label>
              <select
                value={accType}
                onChange={(e) => setAccType(e.target.value as FinancialAccount['account_type'])}
                className="input-apple w-full text-[14px]"
              >
                <option value="BANK">{t('ব্যাংক হিসাব', 'Bank Account')}</option>
                <option value="MFS">{t('মোবাইল ব্যাংকিং (বিকাশ/নগদ)', 'Mobile Banking')}</option>
                <option value="CASH">{t('ক্যাশ ড্রয়ার', 'Cash Drawer')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                {t('হিসাব বা মোবাইল নম্বর', 'Account / Mobile No.')}
              </label>
              <input
                type="text"
                placeholder="017XX-XXXXXX"
                value={accNumber}
                onChange={(e) => setAccNumber(e.target.value)}
                className="input-apple w-full text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('প্রারম্ভিক ব্যালেন্স (৳)', 'Opening Balance (৳)')}
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
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('সংরক্ষণ করুন', 'Save Account')}
            </button>
          </div>
        </form>
      </AppleModal>

      {/* Company Branding Modal */}
      <AppleModal
        isOpen={isCompanyOpen}
        onClose={() => setIsCompanyOpen(false)}
        title={t('প্রতিষ্ঠান ব্র্যান্ডিং ও মেমো সেটিংস', 'Company Branding & Memo Settings')}
      >
        <form onSubmit={handleSaveCompany} className="space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('প্রতিষ্ঠানের নাম (বাংলা)', 'Company Name (Bangla)')}
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
              {t('প্রতিষ্ঠানের নাম (ইংরেজি)', 'Company Name (English)')}
            </label>
            <input
              type="text"
              required
              value={companyForm.company_name_en}
              onChange={(e) => setCompanyForm({ ...companyForm, company_name_en: e.target.value })}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                {t('মোবাইল নম্বর', 'Phone Number')}
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
                {t('ট্যাগলাইন', 'Tagline')}
              </label>
              <input
                type="text"
                value={companyForm.tagline}
                onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
                className="input-apple w-full text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('ঠিকানা', 'Address')}
            </label>
            <input
              type="text"
              value={companyForm.address}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              {t('মেমো ফুটার নোট', 'Invoice Footer Note')}
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
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('সংরক্ষণ করুন', 'Save Branding')}
            </button>
          </div>
        </form>
      </AppleModal>
    </div>
  );
};
