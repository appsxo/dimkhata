import React, { useState } from 'react';
import { Plus, ShieldCheck, Share2, DollarSign, Phone, Building, CreditCard, Users } from 'lucide-react';
import { Customer, Supplier, FinancialAccount, CompanySettings, KycDocument } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { shareDueReminderWhatsApp } from '../lib/whatsapp-share';
import { useLanguage } from '../lib/i18n';
import { sanitizeText } from '../lib/security';
import { KycUploadModal } from '../components/modals/KycUploadModal';
import { AppleSectionHeader, AppleOptionChips, AppleSearchInput, AppleModal } from '../components/ui/AppleUI';

interface PartiesKycViewProps {
  customers: Customer[];
  suppliers: Supplier[];
  accounts: FinancialAccount[];
  company: CompanySettings;
  onRefresh: () => void;
}

export const PartiesKycView: React.FC<PartiesKycViewProps> = ({
  customers,
  suppliers,
  accounts,
  company,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState(50000);

  const [kycEntity, setKycEntity] = useState<{ id: string; name: string; type: 'CUSTOMER' | 'SUPPLIER' } | null>(null);

  const [collectingCust, setCollectingCust] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectAccountId, setCollectAccountId] = useState(accounts[0]?.id || '');

  const [payingSup, setPayingSup] = useState<Supplier | null>(null);
  const [paySupAmount, setPaySupAmount] = useState<number>(0);
  const [paySupAccountId, setPaySupAccountId] = useState(accounts[0]?.id || '');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.supplier_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
  );

  const resetForm = () => {
    setName('');
    setBusinessName('');
    setPhone('');
    setPresentAddress('');
    setNidNumber('');
    setCreditLimit(50000);
  };

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert(t('দয়া করে নাম ও মোবাইল নম্বর পূরণ করুন!', 'Please enter Name and Phone Number!'));
      return;
    }

    if (activeTab === 'CUSTOMERS') {
      const code = DimKhataStore.getNextCode('CUST');
      DimKhataStore.saveCustomer({
        id: `cust-${Date.now()}`,
        customer_code: code,
        name: sanitizeText(name, 100),
        business_name: sanitizeText(businessName, 120),
        phone: sanitizeText(phone, 30),
        customer_type: 'WHOLESALE',
        present_address: sanitizeText(presentAddress, 200),
        nid_number: sanitizeText(nidNumber, 40),
        kyc_docs: [],
        credit_limit: creditLimit,
        current_due: 0,
        due_alert_days: 7,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      alert(t(`কাস্টমার নিবন্ধিত হয়েছে! আইডি: ${code}`, `Customer registered! ID: ${code}`));
    } else {
      const code = DimKhataStore.getNextCode('SUP');
      DimKhataStore.saveSupplier({
        id: `sup-${Date.now()}`,
        supplier_code: code,
        name: sanitizeText(name, 100),
        farm_name: sanitizeText(businessName, 120),
        phone: sanitizeText(phone, 30),
        present_address: sanitizeText(presentAddress, 200),
        nid_number: sanitizeText(nidNumber, 40),
        kyc_docs: [],
        current_payable: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      alert(t(`মহাজন নিবন্ধিত হয়েছে! আইডি: ${code}`, `Supplier registered! ID: ${code}`));
    }

    setIsAddOpen(false);
    resetForm();
    onRefresh();
  };

  const handleKycAdded = (doc: KycDocument) => {
    if (!kycEntity) return;
    if (kycEntity.type === 'CUSTOMER') {
      const cust = customers.find((c) => c.id === kycEntity.id);
      if (cust) {
        cust.kyc_docs = [...(cust.kyc_docs || []), doc];
        DimKhataStore.saveCustomer(cust);
      }
    } else {
      const sup = suppliers.find((s) => s.id === kycEntity.id);
      if (sup) {
        sup.kyc_docs = [...(sup.kyc_docs || []), doc];
        DimKhataStore.saveSupplier(sup);
      }
    }
    onRefresh();
    alert(t('কেওয়াইসি ডকুমেন্ট যুক্ত হয়েছে!', 'KYC Document uploaded!'));
  };

  const handleSettleDue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingCust || collectAmount <= 0) return;

    const receiptCode = DimKhataStore.getNextCode('REC');
    DimKhataStore.recordCustomerDueCollection({
      id: `rec-${Date.now()}`,
      receipt_code: receiptCode,
      customer_id: collectingCust.id,
      branch_id: 'br-01',
      collection_date: new Date().toISOString().split('T')[0],
      amount: collectAmount,
      payment_account_id: collectAccountId,
      note: t('বকেয়া কালেকশন সম্পন্ন', 'Due Collection'),
      created_at: new Date().toISOString(),
    });

    alert(t(`সফল! ৳${collectAmount} বকেয়া আদায় হয়েছে। রসিদ: ${receiptCode}`, `Collected ৳${collectAmount}! Receipt: ${receiptCode}`));
    setCollectingCust(null);
    onRefresh();
  };

  const handlePaySupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSup || paySupAmount <= 0) return;

    const payCode = DimKhataStore.recordSupplierPayment(
      payingSup.id,
      paySupAmount,
      paySupAccountId,
      'br-01',
      `${t('মহাজন বকেয়া পরিশোধ', 'Supplier Payment')} (${payingSup.name})`
    );

    alert(t(`সফল! মহাজনকে ৳${paySupAmount} পরিশোধ করা হয়েছে। ভাউচার: ${payCode}`, `Paid ৳${paySupAmount} to supplier! Voucher: ${payCode}`));
    setPayingSup(null);
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <AppleSectionHeader
        title={t('কাস্টমার ও মহাজন তালিকা (KYC & Due)', 'Customers & Suppliers (KYC & Dues)')}
        subtitle={t('অটো আইডি (SE-CUST / SE-SUP), কেওয়াইসি আপলোড, বকেয়া আদায় ও WhatsApp তাগাদা', 'Auto IDs, KYC verification, 1-click due collection & WhatsApp reminders')}
        actions={
          <button onClick={() => setIsAddOpen(true)} className="btn-primary py-2 px-4 text-[13px]">
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'CUSTOMERS' ? t('+ নতুন কাস্টমার', '+ Add Customer') : t('+ নতুন মহাজন', '+ Add Supplier')}</span>
          </button>
        }
      />

      <div className="card-apple p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <AppleOptionChips
          options={[
            { value: 'CUSTOMERS', label: t(`কাস্টমার (${toBengaliNumber(customers.length)})`, `Customers (${customers.length})`) },
            { value: 'SUPPLIERS', label: t(`মহাজন (${toBengaliNumber(suppliers.length)})`, `Suppliers (${suppliers.length})`) },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        <AppleSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('নাম, আইডি বা ফোন দিয়ে খুঁজুন...', 'Search name, ID or phone...')}
        />
      </div>

      {activeTab === 'CUSTOMERS' ? (
        filteredCustomers.length === 0 ? (
          <div className="card-apple p-8 text-center space-y-2.5">
            <div className="w-11 h-11 rounded-full bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center mx-auto">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1d1d1f]">{t('কোনো কাস্টমার পাওয়া যায়নি', 'No Customers Found')}</h3>
            <button type="button" onClick={() => setIsAddOpen(true)} className="btn-primary mx-auto mt-1 text-[13px]">
              <Plus className="w-4 h-4" />
              <span>{t('+ নতুন কাস্টমার নিবন্ধন', '+ Add Customer')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((cust) => {
              const hasKyc = cust.kyc_docs && cust.kyc_docs.length > 0;
              const isDueOverLimit = cust.current_due >= cust.credit_limit;
              return (
                <div key={cust.id} className="card-apple p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="badge-blue text-[11px] py-0 px-2">{cust.customer_code}</span>
                        <h3 className="font-semibold text-[18px] text-[#1d1d1f] mt-1">{cust.name}</h3>
                        {cust.business_name && <p className="text-[12px] text-[#7a7a7a]">{cust.business_name}</p>}
                      </div>
                      <button
                        onClick={() => setKycEntity({ id: cust.id, name: cust.name, type: 'CUSTOMER' })}
                        className="btn-outline text-[11px] min-h-[32px] py-1 px-2.5 gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0066cc]" />
                        <span>{hasKyc ? `${toBengaliNumber(cust.kyc_docs.length)} KYC` : '+ KYC'}</span>
                      </button>
                    </div>

                    <div className="mt-2.5 space-y-1 text-[13px] text-[#4e4e4e]">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#0066cc]" />
                        <span>{toBengaliNumber(cust.phone)}</span>
                      </div>
                      {cust.present_address && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Building className="w-3.5 h-3.5 text-[#7a7a7a] shrink-0" />
                          <span className="truncate">{cust.present_address}</span>
                        </div>
                      )}
                      {cust.nid_number && (
                        <div className="flex items-center gap-1.5 text-[#7a7a7a] font-mono text-[11px]">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>NID: {cust.nid_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#e0e0e0] space-y-2">
                    <div className="flex justify-between items-center text-[12px] text-[#7a7a7a]">
                      <span>{t('বাকির সীমা:', 'Credit Limit:')}</span>
                      <span className="font-semibold text-[#1d1d1f]">{formatTaka(cust.credit_limit)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#f5f5f7] p-2.5 rounded-[10px] border border-[#e0e0e0]">
                      <span className="text-[12px] text-[#4e4e4e]">{t('বর্তমান বকেয়া:', 'Current Due:')}</span>
                      <span className={`font-semibold text-[18px] ${isDueOverLimit ? 'text-[#d92916]' : 'text-[#1d1d1f]'}`}>
                        {formatTaka(cust.current_due)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button onClick={() => shareDueReminderWhatsApp(cust, company)} className="btn-outline text-[12px] min-h-[38px] py-1">
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{t('তাগাদা মেসেজ', 'WhatsApp')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setCollectingCust(cust);
                          setCollectAmount(cust.current_due);
                        }}
                        disabled={cust.current_due <= 0}
                        className="btn-primary text-[12px] min-h-[38px] py-1 disabled:opacity-40"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{t('বকেয়া আদায়', 'Collect Due')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredSuppliers.length === 0 ? (
        <div className="card-apple p-8 text-center space-y-2.5">
          <div className="w-11 h-11 rounded-full bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center mx-auto">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-[16px] font-semibold text-[#1d1d1f]">{t('কোনো মহাজন পাওয়া যায়নি', 'No Suppliers Found')}</h3>
          <button type="button" onClick={() => setIsAddOpen(true)} className="btn-primary mx-auto mt-1 text-[13px]">
            <Plus className="w-4 h-4" />
            <span>{t('+ নতুন মহাজন নিবন্ধন', '+ Add Supplier')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => {
            const hasKyc = sup.kyc_docs && sup.kyc_docs.length > 0;
            return (
              <div key={sup.id} className="card-apple p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="badge-blue text-[11px] py-0 px-2">{sup.supplier_code}</span>
                      <h3 className="font-semibold text-[18px] text-[#1d1d1f] mt-1">{sup.name}</h3>
                      {sup.farm_name && <p className="text-[12px] text-[#7a7a7a]">{sup.farm_name}</p>}
                    </div>
                    <button
                      onClick={() => setKycEntity({ id: sup.id, name: sup.name, type: 'SUPPLIER' })}
                      className="btn-outline text-[11px] min-h-[32px] py-1 px-2.5 gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0066cc]" />
                      <span>{hasKyc ? `${toBengaliNumber(sup.kyc_docs.length)} KYC` : '+ KYC'}</span>
                    </button>
                  </div>

                  <div className="mt-2.5 space-y-1 text-[13px] text-[#4e4e4e]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#0066cc]" />
                      <span>{toBengaliNumber(sup.phone)}</span>
                    </div>
                    {sup.present_address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-[#7a7a7a] shrink-0" />
                        <span className="truncate">{sup.present_address}</span>
                      </div>
                    )}
                    {sup.nid_number && (
                      <div className="flex items-center gap-1.5 text-[#7a7a7a] font-mono text-[11px]">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>NID: {sup.nid_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#e0e0e0] space-y-2">
                  <div className="flex justify-between items-center bg-[#f5f5f7] p-2.5 rounded-[10px] border border-[#e0e0e0]">
                    <span className="text-[12px] text-[#7a7a7a]">{t('মহাজন পাবে:', 'Total Payable:')}</span>
                    <span className="font-semibold text-[18px] text-[#1d1d1f]">{formatTaka(sup.current_payable)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setPayingSup(sup);
                      setPaySupAmount(sup.current_payable);
                    }}
                    disabled={sup.current_payable <= 0}
                    className="btn-primary w-full text-[12px] min-h-[38px] py-1.5 disabled:opacity-40"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{t('মহাজন বকেয়া পরিশোধ', 'Pay Supplier')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AppleModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={activeTab === 'CUSTOMERS' ? t('নতুন কাস্টমার নিবন্ধন (SE-CUST)', 'Add Customer (SE-CUST)') : t('নতুন মহাজন নিবন্ধন (SE-SUP)', 'Add Supplier (SE-SUP)')}
      >
        <form onSubmit={handleCreateParty} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('নাম', 'Full Name')}</label>
            <input
              type="text"
              required
              placeholder={t('যেমন: হাজী রফিকুল ইসলাম', 'e.g., Hazi Rafiqul Islam')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('প্রতিষ্ঠান / খামারের নাম', 'Business / Farm Name')}</label>
            <input
              type="text"
              placeholder={t('যেমন: মদিনা ট্রেডার্স', 'e.g., Madina Traders')}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('মোবাইল নম্বর', 'Phone Number')}</label>
              <input
                type="tel"
                required
                placeholder="017xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-apple w-full text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('জাতীয় পরিচয়পত্র (NID)', 'NID Number')}</label>
              <input
                type="text"
                placeholder="NID"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                className="input-apple w-full text-[14px] font-mono"
              />
            </div>
          </div>
          {activeTab === 'CUSTOMERS' && (
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('সর্বোচ্চ বাকির সীমা', 'Credit Limit')}</label>
              <div className="relative flex items-center">
                <span className="input-prefix-symbol">৳</span>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                  className="input-apple input-has-prefix w-full text-[14px] font-semibold"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('ঠিকানা', 'Address')}</label>
            <input
              type="text"
              placeholder={t('দোকান বা খামারের ঠিকানা', 'Shop or farm address')}
              value={presentAddress}
              onChange={(e) => setPresentAddress(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn-outline text-[13px] px-4">
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('সংরক্ষণ করুন', 'Save')}
            </button>
          </div>
        </form>
      </AppleModal>

      <AppleModal
        isOpen={Boolean(collectingCust)}
        onClose={() => setCollectingCust(null)}
        title={t('বকেয়া জমা গ্রহণ', 'Collect Customer Due')}
        subtitle={collectingCust ? `${collectingCust.name} (${collectingCust.customer_code})` : ''}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSettleDue} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('জমা টাকার পরিমাণ (৳)', 'Collection Amount (৳)')}</label>
            <div className="relative flex items-center">
              <span className="input-prefix-symbol">৳</span>
              <input
                type="number"
                required
                value={collectAmount}
                onChange={(e) => setCollectAmount(Number(e.target.value) || 0)}
                className="input-apple input-has-prefix w-full text-[15px] font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('জমা একাউন্ট', 'Deposit Account')}</label>
            <select value={collectAccountId} onChange={(e) => setCollectAccountId(e.target.value)} className="input-apple w-full text-[14px]">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatTaka(a.current_balance)})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCollectingCust(null)} className="btn-outline text-[13px] px-4">
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('জমা সম্পন্ন করুন', 'Confirm')}
            </button>
          </div>
        </form>
      </AppleModal>

      <AppleModal
        isOpen={Boolean(payingSup)}
        onClose={() => setPayingSup(null)}
        title={t('মহাজন বকেয়া পরিশোধ', 'Pay Supplier Payable')}
        subtitle={payingSup ? `${payingSup.name} (${payingSup.supplier_code})` : ''}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handlePaySupplier} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('পরিশোধ টাকার পরিমাণ (৳)', 'Payment Amount (৳)')}</label>
            <div className="relative flex items-center">
              <span className="input-prefix-symbol">৳</span>
              <input
                type="number"
                required
                value={paySupAmount}
                onChange={(e) => setPaySupAmount(Number(e.target.value) || 0)}
                className="input-apple input-has-prefix w-full text-[15px] font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('পেমেন্ট একাউন্ট', 'Payment Account')}</label>
            <select value={paySupAccountId} onChange={(e) => setPaySupAccountId(e.target.value)} className="input-apple w-full text-[14px]">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatTaka(a.current_balance)})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPayingSup(null)} className="btn-outline text-[13px] px-4">
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('পেমেন্ট সম্পন্ন করুন', 'Confirm')}
            </button>
          </div>
        </form>
      </AppleModal>

      {kycEntity && (
        <KycUploadModal
          isOpen={Boolean(kycEntity)}
          onClose={() => setKycEntity(null)}
          entityName={kycEntity.name}
          onDocumentAdded={handleKycAdded}
        />
      )}
    </div>
  );
};
