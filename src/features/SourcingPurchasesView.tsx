// ====================================================================
// DIMKHATA (ডিমখাতা) — Sourcing & Landed Cost Engine (Apple Design System)
// Supports Direct Farm Purchase, Inline Supplier Registration & Bilingual UI
// ====================================================================

import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle2, History, Calculator, UserPlus, X } from 'lucide-react';
import {
  Supplier,
  EggCategory,
  Branch,
  FinancialAccount,
  Purchase,
  PurchaseItem,
} from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { calculateLandedCost, formatTaka, toBengaliNumber } from '../lib/egg-units';
import { useLanguage, getCategoryDisplayName } from '../lib/i18n';
import { sanitizeText } from '../lib/security';
import { AppleSectionHeader } from '../components/ui/AppleUI';

interface SourcingPurchasesViewProps {
  suppliers: Supplier[];
  categories: EggCategory[];
  branches: Branch[];
  accounts: FinancialAccount[];
  purchases: Purchase[];
  onRefresh: () => void;
}

export const SourcingPurchasesView: React.FC<SourcingPurchasesViewProps> = ({
  suppliers,
  categories,
  branches,
  accounts,
  purchases,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || 'DIRECT_FARM');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Inline Quick Add Supplier state
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupFarm, setNewSupFarm] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddr, setNewSupAddr] = useState('');

  useEffect(() => {
    if (supplierId !== 'DIRECT_FARM' && !suppliers.some((s) => s.id === supplierId)) {
      setSupplierId(suppliers[0]?.id || 'DIRECT_FARM');
    }
  }, [suppliers, supplierId]);

  const [items, setItems] = useState<
    { categoryId: string; qtyPcs: number; rawRate: number }[]
  >([
    {
      categoryId: categories[0]?.id || '',
      qtyPcs: 3000,
      rawRate: 10.2,
    },
  ]);

  const [truckFare, setTruckFare] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [otherCost, setOtherCost] = useState<number>(0);

  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  const totalEggsPcs = items.reduce((sum, i) => sum + (Number(i.qtyPcs) || 0), 0);
  const rawSubtotal = items.reduce(
    (sum, i) => sum + (Number(i.qtyPcs) || 0) * (Number(i.rawRate) || 0),
    0
  );

  const { totalLandedCost, effectiveLandedRatePerPc } = calculateLandedCost(
    rawSubtotal,
    truckFare,
    laborCost,
    otherCost,
    totalEggsPcs
  );

  const dueAmount = Math.max(0, totalLandedCost - paidAmount);

  const handleQuickAddSupplier = () => {
    const cleanName = sanitizeText(newSupName, 100);
    if (!cleanName) {
      alert(t('খামারী বা মহাজনের নাম লিখুন!', 'Please enter supplier/farm name!'));
      return;
    }
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      supplier_code: DimKhataStore.getNextCode('SUP'),
      name: cleanName,
      farm_name: sanitizeText(newSupFarm, 100) || cleanName,
      phone: sanitizeText(newSupPhone, 30) || '01700-000000',
      present_address: sanitizeText(newSupAddr, 200) || t('বাংলাদেশ', 'Bangladesh'),
      kyc_docs: [],
      current_payable: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    DimKhataStore.saveSupplier(newSup);
    onRefresh();
    setSupplierId(newSup.id);
    setNewSupName('');
    setNewSupFarm('');
    setNewSupPhone('');
    setNewSupAddr('');
    setShowQuickSupplier(false);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        categoryId: categories[0]?.id || '',
        qtyPcs: 1500,
        rawRate: 10.5,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: 'categoryId' | 'qtyPcs' | 'rawRate',
    val: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: field === 'categoryId' ? val : Number(val) || 0,
      };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalEggsPcs <= 0) {
      alert(t('দয়া করে সঠিক ডিমের সংখ্যা দিন!', 'Please enter a valid egg quantity!'));
      return;
    }

    if (supplierId === 'DIRECT_FARM' && dueAmount > 0) {
      alert(
        t(
          'মহাজন খাতায় বাকি রাখতে হলে "+ নতুন মহাজন" বাটনে ক্লিক করে মহাজন নির্বাচন করুন অথবা "পূর্ণ পরিশোধ" করুন।',
          'To record supplier credit/payable, please select or add a supplier using "+ New Supplier", or tap "Full Paid".'
        )
      );
      return;
    }

    const purchaseCode = DimKhataStore.getNextCode('PUR');
    const extraPerPc = totalEggsPcs > 0 ? (truckFare + laborCost + otherCost) / totalEggsPcs : 0;

    const purchaseItems: PurchaseItem[] = items.map((i, idx) => {
      const itemRawTotal = i.qtyPcs * i.rawRate;
      const shareOfOverhead = i.qtyPcs * extraPerPc;
      const itemEffectiveRate = i.rawRate + extraPerPc;

      return {
        id: `pitem-${Date.now()}-${idx}`,
        purchase_id: '',
        category_id: i.categoryId,
        qty_pcs: i.qtyPcs,
        raw_rate_per_pc: i.rawRate,
        raw_total: itemRawTotal,
        landed_cost_share: Math.round(shareOfOverhead * 100) / 100,
        effective_landed_cost_per_pc: Math.round(itemEffectiveRate * 10000) / 10000,
      };
    });

    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      purchase_code: purchaseCode,
      purchase_date: purchaseDate,
      supplier_id: supplierId,
      branch_id: branchId,
      total_eggs_pcs: totalEggsPcs,
      raw_subtotal: rawSubtotal,
      truck_fare: truckFare,
      labor_cost: laborCost,
      other_cost: otherCost,
      total_landed_cost: totalLandedCost,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_account_id: paidAmount > 0 ? accountId : undefined,
      notes: sanitizeText(notes, 300),
      items: purchaseItems,
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordPurchase(newPurchase);
    alert(
      t(
        `সফল! চালান নং: ${purchaseCode} তৈরি হয়েছে এবং স্টক ও WAC ল্যান্ডেড কস্ট আপডেট হয়েছে।`,
        `Success! Purchase ${purchaseCode} saved and live stock + WAC landed cost updated.`
      )
    );
    onRefresh();

    setItems([{ categoryId: categories[0]?.id || '', qtyPcs: 3000, rawRate: 10.2 }]);
    setPaidAmount(0);
    setNotes('');
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <AppleSectionHeader
        eyebrow={t('খামার ও মহাজন চালান', 'Sourcing & Farm Challan')}
        title={t('খামার থেকে ডিম কেনা ও ল্যান্ডেড কস্ট (WAC)', 'Egg Sourcing & Landed Cost (WAC)')}
        subtitle={t(
          'ট্রাক ভাড়া ও লোড-আনলোড লেবার খরচ যোগ করে স্বয়ংক্রিয়ভাবে ডিমের প্রকৃত ইউনিট কস্ট বের করুন',
          'Automatically calculate true landed unit cost (WAC) including truck fare and labor overheads'
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Entry Form (2 Cols) */}
        <div className="lg:col-span-2 card-apple p-4 sm:p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Supplier, Branch, Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-semibold text-[#1d1d1f]">
                    {t('খামারী / মহাজন নির্বাচন', 'Supplier / Farm')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickSupplier((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066cc] hover:underline"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{t('+ নতুন মহাজন', '+ New Supplier')}</span>
                  </button>
                </div>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="input-apple w-full text-[14px]"
                >
                  <option value="DIRECT_FARM">
                    {t('সরাসরি খামার / নগদ ক্রয়', 'Direct Farm (Cash Purchase)')}
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.supplier_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('গোডাউন / শাখা', 'Branch / Godown')}
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="input-apple w-full text-[14px]"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('তারিখ', 'Date')}
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="input-apple w-full text-[14px]"
                />
              </div>
            </div>

            {/* Inline Quick Add Supplier Drawer */}
            {showQuickSupplier && (
              <div className="p-4 rounded-[14px] bg-[#f5f5f7] border border-[#0066cc]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-[#0066cc]" />
                    {t('দ্রুত নতুন খামারী / মহাজন নিবন্ধন (SE-SUP)', 'Quick Add Supplier / Farm (SE-SUP)')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQuickSupplier(false)}
                    className="text-[#86868b] hover:text-[#1d1d1f]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    placeholder={t('মহাজনের নাম *', 'Supplier Name *')}
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <input
                    type="text"
                    placeholder={t('খামারের নাম', 'Farm Name')}
                    value={newSupFarm}
                    onChange={(e) => setNewSupFarm(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <input
                    type="text"
                    placeholder={t('মোবাইল নম্বর', 'Phone Number')}
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddSupplier}
                    className="btn-primary !min-h-[42px] text-[13px]"
                  >
                    {t('মহাজন যোগ করুন', 'Save Supplier')}
                  </button>
                </div>
              </div>
            )}

            {/* Egg Items Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#1d1d1f]">
                  {t('ক্রয়কৃত ডিমের বিবরণ', 'Purchased Egg Batch')}
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn-outline text-[12px] py-1.5 px-3 min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('+ আইটেম যোগ করুন', '+ Add Item')}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    <div className="sm:col-span-4">
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleItemChange(idx, 'categoryId', e.target.value)}
                        className="input-apple w-full text-[14px]"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {getCategoryDisplayName(c)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder={t('পরিমাণ (পিস)', 'Qty (Pcs)')}
                          value={item.qtyPcs}
                          onChange={(e) => handleItemChange(idx, 'qtyPcs', e.target.value)}
                          className="input-apple w-full pr-9 text-[14px] font-semibold"
                        />
                        <span className="absolute right-2.5 top-3 text-[11px] text-[#7a7a7a]">
                          {t('পিস', 'pcs')}
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.05"
                          placeholder={t('দর (পিস)', 'Rate/Pc')}
                          value={item.rawRate}
                          onChange={(e) => handleItemChange(idx, 'rawRate', e.target.value)}
                          className="input-apple w-full pl-6 text-[14px] font-semibold"
                        />
                        <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                      <span className="text-[14px] font-semibold text-[#1d1d1f]">
                        {formatTaka(item.qtyPcs * item.rawRate)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-[#7a7a7a] hover:text-[#d92916] text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Landed Cost Breakdown */}
            <div className="bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] p-4 space-y-3">
              <div className="text-[13px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#0066cc]" />
                <span>{t('পরিবহন ও লোডিং খরচ (Landed Overheads)', 'Transport & Labor Overheads')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4e4e4e] mb-1">
                    {t('ট্রাক / পিকআপ ভাড়া', 'Truck / Pickup Fare')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                    <input
                      type="number"
                      value={truckFare}
                      onChange={(e) => setTruckFare(Number(e.target.value) || 0)}
                      className="input-apple w-full pl-6 text-[14px] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#4e4e4e] mb-1">
                    {t('লোড-আনলোড লেবার খরচ', 'Loading / Labor Cost')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
                      className="input-apple w-full pl-6 text-[14px] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#4e4e4e] mb-1">
                    {t('টোল / বিবিধ খরচ', 'Toll / Other Cost')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                    <input
                      type="number"
                      value={otherCost}
                      onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
                      className="input-apple w-full pl-6 text-[14px] font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e0e0e0]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-semibold text-[#1d1d1f]">
                    {t('নগদ পরিশোধ (Paid Amount)', 'Paid Amount')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(totalLandedCost)}
                    className="text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2.5 py-0.5 rounded-[980px]"
                  >
                    {t('পূর্ণ পরিশোধ', 'Full Paid')}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm text-[#7a7a7a]">৳</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="input-apple w-full pl-7 text-[15px] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('পেমেন্ট একাউন্ট', 'Payment Account')}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={paidAmount <= 0}
                  className="input-apple w-full text-[14px] disabled:opacity-50"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatTaka(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-[15px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {t(
                  'ডিম কেনা সম্পন্ন ও স্টক যুক্ত করুন',
                  'Save Purchase & Add to Live Stock'
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Live Calculation Summary ({component.product-tile-dark} #272729) */}
        <div className="space-y-4">
          <div className="tile-dark p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Calculator className="w-5 h-5 text-[#2997ff]" />
              <h3 className="font-semibold text-[19px] sm:text-[20px] text-white">
                {t('ল্যান্ডেড কস্ট সামারি', 'Landed Cost Summary')}
              </h3>
            </div>

            <div className="space-y-2.5 text-[13px] text-white/75">
              <div className="flex justify-between">
                <span>{t('মোট ডিমের সংখ্যা:', 'Total Egg Quantity:')}</span>
                <span className="font-semibold text-white">
                  {toBengaliNumber(totalEggsPcs)} {t('পিস', 'pcs')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('খামারের মূল দর:', 'Raw Farm Subtotal:')}</span>
                <span className="font-semibold text-white">{formatTaka(rawSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('ট্রাক + লেবার + অন্যান্য:', 'Truck + Labor + Other:')}</span>
                <span className="text-white">+ {formatTaka(truckFare + laborCost + otherCost)}</span>
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between text-[15px] font-semibold text-white">
                <span>{t('সর্বমোট ল্যান্ডেড কস্ট:', 'Total Landed Cost:')}</span>
                <span className="font-semibold text-[20px] text-[#2997ff]">
                  {formatTaka(totalLandedCost)}
                </span>
              </div>

              <div className="p-3.5 bg-white/5 border border-white/10 rounded-[12px] text-center mt-3">
                <div className="text-[11px] text-white/70">
                  {t('প্রকৃত কেনা খরচ (প্রতি ডিম)', 'Effective Landed Cost (Per Egg)')}
                </div>
                <div className="font-semibold text-[28px] text-white mt-0.5">
                  ৳{toBengaliNumber(effectiveLandedRatePerPc.toFixed(2))}
                </div>
                <div className="text-[11px] text-[#2997ff] mt-1">
                  {t(
                    `(প্রতি ডিমে পরিবহন যোগ: ৳${toBengaliNumber(((truckFare + laborCost + otherCost) / Math.max(1, totalEggsPcs)).toFixed(2))})`,
                    `(+৳${((truckFare + laborCost + otherCost) / Math.max(1, totalEggsPcs)).toFixed(2)} overhead per egg)`
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1.5 text-[13px]">
                <div className="flex justify-between text-white/75">
                  <span>{t('পরিশোধিত টাকা:', 'Paid Amount:')}</span>
                  <span className="text-emerald-400 font-semibold">{formatTaka(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-white/75">
                  <span>{t('মহাজন বকেয়া পাবে:', 'Supplier Payable:')}</span>
                  <span className="text-white font-semibold">{formatTaka(dueAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sourcing History Quick List */}
          <div className="card-apple p-4 sm:p-5 space-y-3">
            <h4 className="text-[12px] font-semibold text-[#7a7a7a] uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>{t('সাম্প্রতিক চালানসমূহ', 'Recent Purchases')}</span>
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {purchases.length === 0 ? (
                <div className="text-xs text-[#7a7a7a] text-center py-4">
                  {t('এখনো কোনো ক্রয় চালান তৈরি হয়নি', 'No purchases recorded yet')}
                </div>
              ) : (
                purchases.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#f5f5f7] rounded-[12px] border border-[#e0e0e0] text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-[#0066cc] font-mono">{p.purchase_code}</div>
                      <div className="text-[11px] text-[#7a7a7a]">
                        {toBengaliNumber(p.purchase_date)} | {toBengaliNumber(p.total_eggs_pcs)}{' '}
                        {t('পিস', 'pcs')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#1d1d1f]">
                        {formatTaka(p.total_landed_cost)}
                      </div>
                      <div className="text-[11px] text-[#7a7a7a]">
                        {t('দর', 'Rate')} ৳
                        {toBengaliNumber(
                          (p.total_landed_cost / Math.max(1, p.total_eggs_pcs)).toFixed(2)
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
