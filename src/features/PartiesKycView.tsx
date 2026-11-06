// ====================================================================
// DIMKHATA (ডিমখাতা) — Parties & KYC Verification Hub (Req 1, 2, 10)
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
  FileText,
  AlertCircle,
  Eye,
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

  // Add party modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [customerType, setCustomerType] = useState<Customer['customer_type']>('WHOLESALE');
  const [presentAddress, setPresentAddress] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState(50000);

  // KYC modal state
  const [kycEntity, setKycEntity] = useState<{ id: string; name: string; type: 'CUSTOMER' | 'SUPPLIER' } | null>(null);

  // Due Collection Modal
  const [collectingCust, setCollectingCust] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectAccountId, setCollectAccountId] = useState(accounts[0]?.id || '');

  // KYC Document Preview lightbox
  const [previewDoc, setPreviewDoc] = useState<KycDocument | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" />
            <span>কাস্টমার, খামারী ও কেওয়াইসি (KYC Profiles & Verification)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            অটো ইউনিক আইডি (SE-CUST / SE-SUP), NID ও পাসপোর্ট আপলোড এবং বকেয়া কালেকশন
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === 'CUSTOMERS' ? 'নতুন কাস্টমার নিবন্ধন' : 'নতুন খামারী নিবন্ধন'}
          </span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-5 py-2 rounded-lg transition ${
              activeTab === 'CUSTOMERS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            কাস্টমার ও পাইকার তালিকা ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-5 py-2 rounded-lg transition ${
              activeTab === 'SUPPLIERS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            খামারী ও মহাজন তালিকা ({suppliers.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="নাম, আইডি বা মোবাইল দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                        {cust.customer_code}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">
                        {cust.name}
                      </h3>
                      {cust.business_name && (
                        <p className="text-xs text-slate-500 font-medium">
                          {cust.business_name}
                        </p>
                      )}
                    </div>

                    {/* KYC Badge */}
                    <button
                      onClick={() =>
                        setKycEntity({
                          id: cust.id,
                          name: cust.name,
                          type: 'CUSTOMER',
                        })
                      }
                      title="কেওয়াইসি ডকুমেন্ট আপলোড বা দেখুন"
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                        hasKyc
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-amber-50 border-amber-300 text-amber-800'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{hasKyc ? `${cust.kyc_docs.length} KYC` : '+ KYC যোগ'}</span>
                    </button>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{toBengaliNumber(cust.phone)}</span>
                    </div>
                    {cust.present_address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cust.present_address}</span>
                      </div>
                    )}
                    {cust.nid_number && (
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>NID: {cust.nid_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Due & Credit Limit Box */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">বাকির সীমা:</span>
                    <span className="font-bold text-slate-700">
                      {formatTaka(cust.credit_limit)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">বর্তমান বকেয়া:</span>
                    <span
                      className={`text-sm font-black ${
                        isDueOverLimit ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {formatTaka(cust.current_due)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => shareDueReminderWhatsApp(cust, company)}
                      className="flex items-center justify-center gap-1.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>তাগাদা SMS</span>
                    </button>

                    <button
                      onClick={() => {
                        setCollectingCust(cust);
                        setCollectAmount(cust.current_due);
                      }}
                      disabled={cust.current_due <= 0}
                      className="flex items-center justify-center gap-1.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-xs"
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
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-amber-400 transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md">
                        {sup.supplier_code}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">
                        {sup.name}
                      </h3>
                      {sup.farm_name && (
                        <p className="text-xs text-slate-500 font-medium">
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
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                        hasKyc
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-amber-50 border-amber-300 text-amber-800'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{hasKyc ? `${sup.kyc_docs.length} KYC` : '+ KYC যোগ'}</span>
                    </button>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{toBengaliNumber(sup.phone)}</span>
                    </div>
                    {sup.present_address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sup.present_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">মহাজন মোট পাবে:</span>
                    <span className="text-sm font-black text-rose-700">
                      {formatTaka(sup.current_payable)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD PARTY MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {activeTab === 'CUSTOMERS' ? 'নতুন কাস্টমার নিবন্ধন' : 'নতুন খামারী/মহাজন নিবন্ধন'}
            </h3>

            <form
              onSubmit={activeTab === 'CUSTOMERS' ? handleCreateCustomer : handleCreateSupplier}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হাজী রফিকুল ইসলাম"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রতিষ্ঠান / খামারের নাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মদিনা ট্রেডার্স / শ্রীপুর পোল্ট্রি ফার্ম"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">জাতীয় পরিচয়পত্র (NID)</label>
                  <input
                    type="text"
                    placeholder="NID নম্বর"
                    value={nidNumber}
                    onChange={(e) => setNidNumber(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {activeTab === 'CUSTOMERS' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    সর্বোচ্চ বাকির সীমা (Credit Limit ৳)
                  </label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  placeholder="দোকান বা খামারের ঠিকানা"
                  value={presentAddress}
                  onChange={(e) => setPresentAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
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
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUE COLLECTION MODAL */}
      {collectingCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              বকেয়া টাকা জমা গ্রহণ (Due Collection)
            </h3>
            <p className="text-xs text-slate-500">
              কাস্টমার: <strong>{collectingCust.name}</strong> ({collectingCust.customer_code})
            </p>

            <form onSubmit={handleSettleDue} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  জমা টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কোন একাউন্টে জমা হবে?
                </label>
                <select
                  value={collectAccountId}
                  onChange={(e) => setCollectAccountId(e.target.value)}
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
                  onClick={() => setCollectingCust(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  জমা সম্পন্ন করুন
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
