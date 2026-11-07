// ====================================================================
// DIMKHATA (ডিমখাতা) — Parties & KYC Verification (Apple Design System)
// ====================================================================

import React, { useState } from 'react';
import {
  Plus,
  ShieldCheck,
  Share2,
  DollarSign,
  Phone,
  Building,
  CreditCard,
  Users,
} from 'lucide-react';
import { Customer, Supplier, FinancialAccount, CompanySettings, KycDocument } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { shareDueReminderWhatsApp } from '../lib/whatsapp-share';
import { useLanguage } from '../lib/i18n';
import { sanitizeText } from '../lib/security';
import { KycUploadModal } from '../components/modals/KycUploadModal';
import {
  AppleSectionHeader,
  AppleOptionChips,
  AppleSearchInput,
  AppleModal,
} from '../components/ui/AppleUI';

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
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [customerType] = useState<Customer['customer_type']>('WHOLESALE');
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

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert(t('দয়া করে নাম ও মোবাইল নম্বর পূরণ করুন!', 'Please enter Name and Phone Number!'));
      return;
    }

    const code = DimKhataStore.getNextCode('CUST');
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      customer_code: code,
      name: sanitizeText(name, 100),
      business_name: sanitizeText(businessName, 120),
      phone: sanitizeText(phone, 30),
      emergency_phone: sanitizeText(emergencyPhone, 30),
      customer_type: customerType,
      present_address: sanitizeText(presentAddress, 200),
      nid_number: sanitizeText(nidNumber, 40),
      kyc_docs: [],
      credit_limit: creditLimit,
      current_due: 0,
      due_alert_days: 7,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    DimKhataStore.saveCustomer(newCust);
    alert(t(`কাস্টমার সফলভাবে নিবন্ধিত হয়েছে! ইউনিক আইডি: ${code}`, `Customer registered! ID: ${code}`));
    setIsAddOpen(false);
    resetForm();
    onRefresh();
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert(t('দয়া করে নাম ও মোবাইল নম্বর পূরণ করুন!', 'Please enter Name and Phone Number!'));
      return;
    }

    const code = DimKhataStore.getNextCode('SUP');
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      supplier_code: code,
      name: sanitizeText(name, 100),
      farm_name: sanitizeText(businessName, 120),
      phone: sanitizeText(phone, 30),
      emergency_phone: sanitizeText(emergencyPhone, 30),
      present_address: sanitizeText(presentAddress, 200),
      nid_number: sanitizeText(nidNumber, 40),
      kyc_docs: [],
      current_payable: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    DimKhataStore.saveSupplier(newSup);
    alert(t(`মহাজন সফলভাবে নিবন্ধিত হয়েছে! ইউনিক আইডি: ${code}`, `Supplier registered! ID: ${code}`));
    setIsAddOpen(false);
    resetForm();
    onRefresh();
  };

  const resetForm = () => {
    setName('');
    setBusinessName('');
    setPhone('');
    setEmergencyPhone('');
    setPresentAddress('');
    setNidNumber('');
    setCreditLimit(50000);
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
    alert(t('কেওয়াইসি ডকুমেন্ট সফলভাবে যুক্ত হয়েছে!', 'KYC Document uploaded successfully!'));
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
      note: 'বকেয়া কালেকশন সম্পন্ন',
      created_at: new Date().toISOString(),
    });

    alert(t(`সফল! ৳${collectAmount} বকেয়া আদায় হয়েছে। রসিদ নং: ${receiptCode}`, `Collected ৳${collectAmount}! Receipt: ${receiptCode}`));
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
      `মহাজন বকেয়া পরিশোধ (${payingSup.name})`
    );

    alert(t(`সফল! মহাজনকে ৳${paySupAmount} পরিশোধ করা হয়েছে। ভাউচার নং: ${payCode}`, `Paid ৳${paySupAmount} to supplier! Voucher: ${payCode}`));
    setPayingSup(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <AppleSectionHeader
        eyebrow={t('বাকি খাতা ও কেওয়াইসি প্রোফাইল', 'Parties, KYC & Due Ledger')}
        title={t('কাস্টমার ও মহাজন তালিকা (KYC & Due Ledger)', 'Customers & Suppliers (KYC & Dues)')}
        subtitle={t(
          'অটো ইউনিক আইডি (SE-CUST / SE-SUP), NID আপলোড, ১-ক্লিকে বকেয়া আদায় এবং WhatsApp তাগাদা',
          'Auto unique IDs (SE-CUST / SE-SUP), NID verification, 1-click due collection & WhatsApp reminders'
        )}
        actions={
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary py-2.5 px-5"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'CUSTOMERS'
                ? t('+ নতুন কাস্টমার নিবন্ধন', '+ Add Customer')
                : t('+ নতুন খামারী নিবন্ধন', '+ Add Supplier')}
            </span>
          </button>
        }
      />

      {/* Tabs & Search */}
      <div className="card-apple p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <AppleOptionChips
          options={[
            {
              value: 'CUSTOMERS',
              label: t(
                `কাস্টমার ও পাইকার (${toBengaliNumber(customers.length)})`,
                `Customers (${customers.length})`
              ),
            },
            {
              value: 'SUPPLIERS',
              label: t(
                `খামারী ও মহাজন (${toBengaliNumber(suppliers.length)})`,
                `Suppliers (${suppliers.length})`
              ),
            },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        <AppleSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t(
            'নাম, আইডি বা মোবাইল নম্বর দিয়ে খুঁজুন...',
            'Search by name, ID or phone...'
          )}
        />
      </div>

      {/* CUSTOMERS LIST */}
      {activeTab === 'CUSTOMERS' && (
        filteredCustomers.length === 0 ? (
          <div className="card-apple p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#1d1d1f]">
              {t('কোনো কাস্টমার পাওয়া যায়নি', 'No Customers Found')}
            </h3>
            <p className="text-[13px] text-[#7a7a7a] max-w-md mx-auto">
              {t(
                'নতুন পাইকার বা খুচরা কাস্টমার নিবন্ধন করতে নিচের বাটনে ট্যাপ করুন (অটো আইডি: SE-CUST-001)।',
                'Register your wholesale or retail customers with auto SE-CUST-001 IDs.'
              )}
            </p>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="btn-primary mx-auto mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('+ নতুন কাস্টমার নিবন্ধন', '+ Add First Customer')}</span>
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const hasKyc = cust.kyc_docs && cust.kyc_docs.length > 0;
            const isDueOverLimit = cust.current_due >= cust.credit_limit;

            return (
              <div
                key={cust.id}
                className="card-apple p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="badge-blue text-[11px] py-0 px-2">
                        {cust.customer_code}
                      </span>
                      <h3 className="font-semibold text-[19px] text-[#1d1d1f] mt-1.5">
                        {cust.name}
                      </h3>
                      {cust.business_name && (
                        <p className="text-[12px] text-[#7a7a7a] font-normal">
                          {cust.business_name}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setKycEntity({
                          id: cust.id,
                          name: cust.name,
                          type: 'CUSTOMER',
                        })
                      }
                      title="কেওয়াইসি ডকুমেন্ট আপলোড"
                      className="btn-outline text-[11px] min-h-[34px] py-1 px-2.5 gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0066cc]" />
                      <span>{hasKyc ? `${toBengaliNumber(cust.kyc_docs.length)} KYC` : '+ KYC'}</span>
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5 text-[13px] text-[#4e4e4e]">
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

                {/* Due & Credit Limit Box */}
                <div className="pt-3 border-t border-[#e0e0e0] space-y-2.5">
                  <div className="flex justify-between items-center text-[12px] text-[#7a7a7a]">
                    <span>বাকির সীমা:</span>
                    <span className="font-semibold text-[#1d1d1f]">
                      {formatTaka(cust.credit_limit)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#f5f5f7] p-3 rounded-[12px] border border-[#e0e0e0]">
                    <span className="text-[12px] text-[#4e4e4e]">বর্তমান বকেয়া:</span>
                    <span
                      className={`font-semibold text-[20px] ${
                        isDueOverLimit ? 'text-[#d92916]' : 'text-[#1d1d1f]'
                      }`}
                    >
                      {formatTaka(cust.current_due)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => shareDueReminderWhatsApp(cust, company)}
                      className="btn-outline text-[12px] min-h-[40px] py-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>তাগাদা মেসেজ</span>
                    </button>

                    <button
                      onClick={() => {
                        setCollectingCust(cust);
                        setCollectAmount(cust.current_due);
                      }}
                      disabled={cust.current_due <= 0}
                      className="btn-primary text-[12px] min-h-[40px] py-1.5 disabled:opacity-40"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>বকেয়া আদায়</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* SUPPLIERS LIST */}
      {activeTab === 'SUPPLIERS' && (
        filteredSuppliers.length === 0 ? (
          <div className="card-apple p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#1d1d1f]">
              {t('কোনো খামারী বা মহাজন পাওয়া যায়নি', 'No Suppliers Found')}
            </h3>
            <p className="text-[13px] text-[#7a7a7a] max-w-md mx-auto">
              {t(
                'নতুন খামারী বা মহাজন নিবন্ধন করতে নিচের বাটনে ট্যাপ করুন (অটো আইডি: SE-SUP-001)।',
                'Register your egg farms or suppliers with auto SE-SUP-001 IDs.'
              )}
            </p>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="btn-primary mx-auto mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('+ নতুন খামারী নিবন্ধন', '+ Add First Supplier')}</span>
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => {
            const hasKyc = sup.kyc_docs && sup.kyc_docs.length > 0;
            return (
              <div
                key={sup.id}
                className="card-apple p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="badge-blue text-[11px] py-0 px-2">
                        {sup.supplier_code}
                      </span>
                      <h3 className="font-semibold text-[19px] text-[#1d1d1f] mt-1.5">
                        {sup.name}
                      </h3>
                      {sup.farm_name && (
                        <p className="text-[12px] text-[#7a7a7a] font-normal">
                          {sup.farm_name}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setKycEntity({
                          id: sup.id,
                          name: sup.name,
                          type: 'SUPPLIER',
                        })
                      }
                      className="btn-outline text-[11px] min-h-[34px] py-1 px-2.5 gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0066cc]" />
                      <span>{hasKyc ? `${toBengaliNumber(sup.kyc_docs.length)} KYC` : '+ KYC'}</span>
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5 text-[13px] text-[#4e4e4e]">
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

                <div className="pt-3 border-t border-[#e0e0e0] space-y-2.5">
                  <div className="flex justify-between items-center bg-[#f5f5f7] p-3 rounded-[12px] border border-[#e0e0e0]">
                    <span className="text-[12px] text-[#7a7a7a]">{t('মহাজন মোট পাবে:', 'Total Payable:')}</span>
                    <span className="font-semibold text-[20px] text-[#1d1d1f]">
                      {formatTaka(sup.current_payable)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setPayingSup(sup);
                      setPaySupAmount(sup.current_payable);
                    }}
                    disabled={sup.current_payable <= 0}
                    className="btn-primary w-full text-[13px] min-h-[42px] py-2 disabled:opacity-40"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{t('মহাজন বকেয়া পরিশোধ', 'Pay Supplier')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* ADD PARTY MODAL */}
      <AppleModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={activeTab === 'CUSTOMERS' ? 'নতুন কাস্টমার নিবন্ধন' : 'নতুন খামারী/মহাজন নিবন্ধন'}
        subtitle="সফটওয়্যার স্বয়ংক্রিয়ভাবে ইউনিক আইডি (SE-CUST / SE-SUP) তৈরি করবে"
      >
        <form
          onSubmit={activeTab === 'CUSTOMERS' ? handleCreateCustomer : handleCreateSupplier}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">নাম</label>
            <input
              type="text"
              required
              placeholder="যেমন: হাজী রফিকুল ইসলাম"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              প্রতিষ্ঠান / খামারের নাম
            </label>
            <input
              type="text"
              placeholder="যেমন: মদিনা ট্রেডার্স / শ্রীপুর পোল্ট্রি ফার্ম"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">মোবাইল নম্বর</label>
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
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">জাতীয় পরিচয়পত্র (NID)</label>
              <input
                type="text"
                placeholder="NID নম্বর"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                className="input-apple w-full text-[14px] font-mono"
              />
            </div>
          </div>

          {activeTab === 'CUSTOMERS' && (
            <div>
              <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                সর্বোচ্চ বাকির সীমা (Credit Limit ৳)
              </label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                className="input-apple w-full text-[14px] font-semibold"
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">ঠিকানা</label>
            <input
              type="text"
              placeholder="দোকান বা খামারের ঠিকানা"
              value={presentAddress}
              onChange={(e) => setPresentAddress(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
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
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </AppleModal>

      {/* DUE COLLECTION MODAL */}
      <AppleModal
        isOpen={Boolean(collectingCust)}
        onClose={() => setCollectingCust(null)}
        title="বকেয়া জমা গ্রহণ"
        subtitle={collectingCust ? `কাস্টমার: ${collectingCust.name} (${collectingCust.customer_code})` : ''}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSettleDue} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              জমা টাকার পরিমাণ (৳)
            </label>
            <input
              type="number"
              required
              value={collectAmount}
              onChange={(e) => setCollectAmount(Number(e.target.value) || 0)}
              className="input-apple w-full text-[15px] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              কোন একাউন্টে জমা হবে?
            </label>
            <select
              value={collectAccountId}
              onChange={(e) => setCollectAccountId(e.target.value)}
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
              onClick={() => setCollectingCust(null)}
              className="btn-outline text-[13px] px-4"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              জমা সম্পন্ন করুন
            </button>
          </div>
        </form>
      </AppleModal>

      {/* SUPPLIER PAYMENT MODAL */}
      <AppleModal
        isOpen={Boolean(payingSup)}
        onClose={() => setPayingSup(null)}
        title="মহাজন বকেয়া পরিশোধ"
        subtitle={payingSup ? `খামারী/মহাজন: ${payingSup.name} (${payingSup.supplier_code})` : ''}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handlePaySupplier} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              পরিশোধ টাকার পরিমাণ (৳)
            </label>
            <input
              type="number"
              required
              value={paySupAmount}
              onChange={(e) => setPaySupAmount(Number(e.target.value) || 0)}
              className="input-apple w-full text-[15px] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              কোন একাউন্ট থেকে পেমেন্ট হবে?
            </label>
            <select
              value={paySupAccountId}
              onChange={(e) => setPaySupAccountId(e.target.value)}
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
              onClick={() => setPayingSup(null)}
              className="btn-outline text-[13px] px-4"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              পেমেন্ট সম্পন্ন করুন
            </button>
          </div>
        </form>
      </AppleModal>

      {/* KYC Upload Modal */}
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
