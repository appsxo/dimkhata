// ====================================================================
// DIMKHATA (ডিমখাতা) — Parties & KYC Verification (ElevenLabs Design)
// ====================================================================

import React, { useState } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Share2,
  DollarSign,
  Search,
  Phone,
  Building,
  CreditCard,
} from 'lucide-react';
import { Customer, Supplier, FinancialAccount, CompanySettings, KycDocument } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { shareDueReminderWhatsApp } from '../lib/whatsapp-share';
import { KycUploadModal } from '../components/modals/KycUploadModal';

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
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [customerType, setCustomerType] = useState<Customer['customer_type']>('WHOLESALE');
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
      alert('দয়া করে নাম ও মোবাইল নম্বর পূরণ করুন!');
      return;
    }

    const code = DimKhataStore.getNextCode('CUST');
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      customer_code: code,
      name,
      business_name: businessName,
      phone,
      emergency_phone: emergencyPhone,
      customer_type: customerType,
      present_address: presentAddress,
      nid_number: nidNumber,
      kyc_docs: [],
      credit_limit: creditLimit,
      current_due: 0,
      due_alert_days: 7,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    DimKhataStore.saveCustomer(newCust);
    alert(`কাস্টমার সফলভাবে নিবন্ধিত হয়েছে! ইউনিক আইডি: ${code}`);
    setIsAddOpen(false);
    resetForm();
    onRefresh();
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('দয়া করে নাম ও মোবাইল নম্বর পূরণ করুন!');
      return;
    }

    const code = DimKhataStore.getNextCode('SUP');
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      supplier_code: code,
      name,
      farm_name: businessName,
      phone,
      emergency_phone: emergencyPhone,
      present_address: presentAddress,
      nid_number: nidNumber,
      kyc_docs: [],
      current_payable: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    DimKhataStore.saveSupplier(newSup);
    alert(`মহাজন সফলভাবে নিবন্ধিত হয়েছে! ইউনিক আইডি: ${code}`);
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
    alert('কেওয়াইসি ডকুমেন্ট সফলভাবে যুক্ত হয়েছে!');
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

    alert(`সফল! ৳${collectAmount} বকেয়া আদায় হয়েছে। রসিদ নং: ${receiptCode}`);
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

    alert(`সফল! মহাজনকে ৳${paySupAmount} পরিশোধ করা হয়েছে। ভাউচার নং: ${payCode}`);
    setPayingSup(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-light text-3xl text-[#0c0a09] tracking-tight">
            কাস্টমার ও মহাজন প্রোফাইল (KYC Verification)
          </h2>
          <p className="text-xs text-[#777169] mt-0.5">
            অটো ইউনিক আইডি (SE-CUST / SE-SUP), NID ও পাসপোর্ট আপলোড এবং বকেয়া কালেকশন
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === 'CUSTOMERS' ? 'নতুন কাস্টমার নিবন্ধন' : 'নতুন খামারী নিবন্ধন'}
          </span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e7e5e4] shadow-xs">
        <div className="flex bg-[#f0efed] p-1 rounded-full text-xs font-medium">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-5 py-2 rounded-full transition ${
              activeTab === 'CUSTOMERS'
                ? 'bg-[#292524] text-white shadow-xs'
                : 'text-[#4e4e4e] hover:text-[#0c0a09]'
            }`}
          >
            কাস্টমার ও পাইকার ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-5 py-2 rounded-full transition ${
              activeTab === 'SUPPLIERS'
                ? 'bg-[#292524] text-white shadow-xs'
                : 'text-[#4e4e4e] hover:text-[#0c0a09]'
            }`}
          >
            খামারী ও মহাজন ({suppliers.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#777169] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="নাম, আইডি বা ফোন দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-editorial w-full sm:w-64 pl-9 text-xs h-10"
          />
        </div>
      </div>

      {/* CUSTOMERS LIST */}
      {activeTab === 'CUSTOMERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const hasKyc = cust.kyc_docs && cust.kyc_docs.length > 0;
            const isDueOverLimit = cust.current_due >= cust.credit_limit;

            return (
              <div
                key={cust.id}
                className="card-editorial flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="badge-pill text-[10px] py-0 px-2">
                        {cust.customer_code}
                      </span>
                      <h3 className="font-serif font-light text-xl text-[#0c0a09] mt-1.5">
                        {cust.name}
                      </h3>
                      {cust.business_name && (
                        <p className="text-xs text-[#777169] font-normal">
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
                      className="btn-outline text-[11px] h-7 px-2.5 gap-1"
                    >
                      <ShieldCheck className="w-3 h-3 text-[#777169]" />
                      <span>{hasKyc ? `${cust.kyc_docs.length} KYC` : '+ KYC'}</span>
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-[#4e4e4e]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#777169]" />
                      <span>{toBengaliNumber(cust.phone)}</span>
                    </div>
                    {cust.present_address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-[#777169] shrink-0" />
                        <span className="truncate">{cust.present_address}</span>
                      </div>
                    )}
                    {cust.nid_number && (
                      <div className="flex items-center gap-1.5 text-[#777169] font-mono text-[11px]">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>NID: {cust.nid_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Due & Credit Limit Box */}
                <div className="pt-3 border-t border-[#f0efed] space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#777169]">
                    <span>বাকির সীমা:</span>
                    <span className="font-medium text-[#0c0a09]">
                      {formatTaka(cust.credit_limit)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#fafafa] p-2.5 rounded-xl border border-[#e7e5e4]">
                    <span className="text-xs text-[#4e4e4e]">বর্তমান বকেয়া:</span>
                    <span
                      className={`font-serif font-light text-xl ${
                        isDueOverLimit ? 'text-[#dc2626]' : 'text-[#0c0a09]'
                      }`}
                    >
                      {formatTaka(cust.current_due)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => shareDueReminderWhatsApp(cust, company)}
                      className="btn-outline text-xs h-9"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#777169]" />
                      <span>তাগাদা SMS</span>
                    </button>

                    <button
                      onClick={() => {
                        setCollectingCust(cust);
                        setCollectAmount(cust.current_due);
                      }}
                      disabled={cust.current_due <= 0}
                      className="btn-primary text-xs h-9 disabled:opacity-40"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>বকেয়া জমা</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUPPLIERS LIST */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => {
            const hasKyc = sup.kyc_docs && sup.kyc_docs.length > 0;
            return (
              <div
                key={sup.id}
                className="card-editorial flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="badge-pill text-[10px] py-0 px-2">
                        {sup.supplier_code}
                      </span>
                      <h3 className="font-serif font-light text-xl text-[#0c0a09] mt-1.5">
                        {sup.name}
                      </h3>
                      {sup.farm_name && (
                        <p className="text-xs text-[#777169] font-normal">
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
                      className="btn-outline text-[11px] h-7 px-2.5 gap-1"
                    >
                      <ShieldCheck className="w-3 h-3 text-[#777169]" />
                      <span>{hasKyc ? `${sup.kyc_docs.length} KYC` : '+ KYC'}</span>
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-[#4e4e4e]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#777169]" />
                      <span>{toBengaliNumber(sup.phone)}</span>
                    </div>
                    {sup.present_address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-[#777169] shrink-0" />
                        <span className="truncate">{sup.present_address}</span>
                      </div>
                    )}
                    {sup.nid_number && (
                      <div className="flex items-center gap-1.5 text-[#777169] font-mono text-[11px]">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>NID: {sup.nid_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#f0efed] space-y-2">
                  <div className="flex justify-between items-center bg-[#fafafa] p-2.5 rounded-xl border border-[#e7e5e4]">
                    <span className="text-xs text-[#777169]">মহাজন মোট পাবে:</span>
                    <span className="font-serif font-light text-xl text-[#0c0a09]">
                      {formatTaka(sup.current_payable)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setPayingSup(sup);
                      setPaySupAmount(sup.current_payable);
                    }}
                    disabled={sup.current_payable <= 0}
                    className="btn-primary w-full text-xs h-9 disabled:opacity-40"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>মহাজন বকেয়া পরিশোধ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD PARTY MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#e7e5e4]">
            <h3 className="font-serif font-light text-2xl text-[#0c0a09]">
              {activeTab === 'CUSTOMERS' ? 'নতুন কাস্টমার নিবন্ধন' : 'নতুন খামারী/মহাজন নিবন্ধন'}
            </h3>

            <form
              onSubmit={activeTab === 'CUSTOMERS' ? handleCreateCustomer : handleCreateSupplier}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হাজী রফিকুল ইসলাম"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  প্রতিষ্ঠান / খামারের নাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মদিনা ট্রেডার্স / শ্রীপুর পোল্ট্রি ফার্ম"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-[#292524] mb-1">মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-editorial w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#292524] mb-1">জাতীয় পরিচয়পত্র (NID)</label>
                  <input
                    type="text"
                    placeholder="NID নম্বর"
                    value={nidNumber}
                    onChange={(e) => setNidNumber(e.target.value)}
                    className="input-editorial w-full text-xs font-mono"
                  />
                </div>
              </div>

              {activeTab === 'CUSTOMERS' && (
                <div>
                  <label className="block text-xs font-medium text-[#292524] mb-1">
                    সর্বোচ্চ বাকির সীমা (Credit Limit ৳)
                  </label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                    className="input-editorial w-full text-xs font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">ঠিকানা</label>
                <input
                  type="text"
                  placeholder="দোকান বা খামারের ঠিকানা"
                  value={presentAddress}
                  onChange={(e) => setPresentAddress(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
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
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUE COLLECTION MODAL */}
      {collectingCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-[#e7e5e4]">
            <h3 className="font-serif font-light text-2xl text-[#0c0a09]">
              বকেয়া জমা গ্রহণ
            </h3>
            <p className="text-xs text-[#777169]">
              কাস্টমার: <strong>{collectingCust.name}</strong> ({collectingCust.customer_code})
            </p>

            <form onSubmit={handleSettleDue} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  জমা টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value) || 0)}
                  className="input-editorial w-full text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  কোন একাউন্টে জমা হবে?
                </label>
                <select
                  value={collectAccountId}
                  onChange={(e) => setCollectAccountId(e.target.value)}
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
                  onClick={() => setCollectingCust(null)}
                  className="btn-outline text-xs h-9 px-4"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs h-9 px-5"
                >
                  জমা সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER PAYMENT MODAL */}
      {payingSup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-[#e7e5e4]">
            <h3 className="font-serif font-light text-2xl text-[#0c0a09]">
              মহাজন বকেয়া পরিশোধ
            </h3>
            <p className="text-xs text-[#777169]">
              খামারী/মহাজন: <strong>{payingSup.name}</strong> ({payingSup.supplier_code})
            </p>

            <form onSubmit={handlePaySupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  পরিশোধ টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  required
                  value={paySupAmount}
                  onChange={(e) => setPaySupAmount(Number(e.target.value) || 0)}
                  className="input-editorial w-full text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  কোন একাউন্ট থেকে পেমেন্ট হবে?
                </label>
                <select
                  value={paySupAccountId}
                  onChange={(e) => setPaySupAccountId(e.target.value)}
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
                  onClick={() => setPayingSup(null)}
                  className="btn-outline text-xs h-9 px-4"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs h-9 px-5"
                >
                  পেমেন্ট সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
