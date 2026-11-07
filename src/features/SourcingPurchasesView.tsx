// ====================================================================
// DIMKHATA (ডিমখাতা) — Sourcing & Landed Cost Engine (Apple Design System)
// ====================================================================

import React, { useState } from 'react';
import { Truck, Plus, CheckCircle2, History, Calculator } from 'lucide-react';
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
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const [items, setItems] = useState<
    { categoryId: string; qtyPcs: number; rawRate: number }[]
  >([
    {
      categoryId: categories[0]?.id || '',
      qtyPcs: 3000,
      rawRate: 10.20,
    },
  ]);

  const [truckFare, setTruckFare] = useState<number>(3500);
  const [laborCost, setLaborCost] = useState<number>(1200);
  const [otherCost, setOtherCost] = useState<number>(300);

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

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        categoryId: categories[0]?.id || '',
        qtyPcs: 1500,
        rawRate: 10.50,
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
      alert('দয়া করে সঠিক ডিমের সংখ্যা দিন!');
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
      notes,
      items: purchaseItems,
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordPurchase(newPurchase);
    alert(`সফল! চালান নং: ${purchaseCode} তৈরি হয়েছে এবং স্টক ও WAC ল্যান্ডেড কস্ট আপডেট হয়েছে।`);
    onRefresh();

    setItems([{ categoryId: categories[0]?.id || '', qtyPcs: 3000, rawRate: 10.20 }]);
    setPaidAmount(0);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <AppleSectionHeader
        eyebrow="খামার ও মহাজন চালান"
        title="খামার থেকে ডিম কেনা ও ল্যান্ডেড কস্ট (WAC)"
        subtitle="ট্রাক ভাড়া ও লোড-আনলোড লেবার খরচ যোগ করে স্বয়ংক্রিয়ভাবে ডিমের প্রকৃত ইউনিট কস্ট বের করুন"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form (2 Cols) */}
        <div className="lg:col-span-2 card-apple p-5 sm:p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Supplier, Branch, Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  খামারী / মহাজন নির্বাচন
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="input-apple w-full text-[14px]"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.supplier_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  গোডাউন / শাখা
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
                  তারিখ
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="input-apple w-full text-[14px]"
                />
              </div>
            </div>

            {/* Egg Items Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#1d1d1f]">
                  ক্রয়কৃত ডিমের বিবরণ (Batch Items)
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn-outline text-[12px] py-1.5 px-3 min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ আইটেম যোগ করুন</span>
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
                            {c.name_bn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="পরিমাণ (পিস)"
                          value={item.qtyPcs}
                          onChange={(e) => handleItemChange(idx, 'qtyPcs', e.target.value)}
                          className="input-apple w-full pr-9 text-[14px] font-semibold"
                        />
                        <span className="absolute right-2.5 top-3 text-[11px] text-[#7a7a7a]">পিস</span>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.05"
                          placeholder="দর (পিস)"
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
                <span>পরিবহন ও লোডিং খরচ (Landed Overheads)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4e4e4e] mb-1">
                    ট্রাক / পিকআপ ভাড়া
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
                    লোড-আনলোড লেবার খরচ
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
                    টোল / বিবিধ খরচ
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
                    নগদ পরিশোধ (Paid Amount)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(totalLandedCost)}
                    className="text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2.5 py-0.5 rounded-[980px]"
                  >
                    পূর্ণ পরিশোধ
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
                  পেমেন্ট একাউন্ট
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
              <span>ডিম কেনা সম্পন্ন ও স্টক যুক্ত করুন</span>
            </button>
          </form>
        </div>

        {/* Live Calculation Summary ({component.product-tile-dark} #272729) */}
        <div className="space-y-4">
          <div className="tile-dark p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Calculator className="w-5 h-5 text-[#2997ff]" />
              <h3 className="font-semibold text-[20px] text-white">ল্যান্ডেড কস্ট সামারি</h3>
            </div>

            <div className="space-y-2.5 text-[13px] text-white/75">
              <div className="flex justify-between">
                <span>মোট ডিমের সংখ্যা:</span>
                <span className="font-semibold text-white">{toBengaliNumber(totalEggsPcs)} পিস</span>
              </div>
              <div className="flex justify-between">
                <span>খামারের মূল দর:</span>
                <span className="font-semibold text-white">{formatTaka(rawSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>ট্রাক + লেবার + অন্যান্য:</span>
                <span className="text-white">+ {formatTaka(truckFare + laborCost + otherCost)}</span>
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between text-[15px] font-semibold text-white">
                <span>সর্বমোট ল্যান্ডেড কস্ট:</span>
                <span className="font-semibold text-[20px] text-[#2997ff]">{formatTaka(totalLandedCost)}</span>
              </div>

              <div className="p-3.5 bg-white/5 border border-white/10 rounded-[12px] text-center mt-3">
                <div className="text-[11px] text-white/70">প্রকৃত কেনা খরচ (প্রতি ডিম)</div>
                <div className="font-semibold text-[28px] text-white mt-0.5">
                  ৳{toBengaliNumber(effectiveLandedRatePerPc.toFixed(2))}
                </div>
                <div className="text-[11px] text-[#2997ff] mt-1">
                  (প্রতি ডিমে পরিবহন যোগ: ৳{toBengaliNumber(((truckFare + laborCost + otherCost) / Math.max(1, totalEggsPcs)).toFixed(2))})
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1.5 text-[13px]">
                <div className="flex justify-between text-white/75">
                  <span>পরিশোধিত টাকা:</span>
                  <span className="text-emerald-400 font-semibold">{formatTaka(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-white/75">
                  <span>মহাজন বকেয়া পাবে:</span>
                  <span className="text-white font-semibold">{formatTaka(dueAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sourcing History Quick List */}
          <div className="card-apple p-4 sm:p-5 space-y-3">
            <h4 className="text-[12px] font-semibold text-[#7a7a7a] uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>সাম্প্রতিক চালানসমূহ</span>
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {purchases.length === 0 ? (
                <div className="text-xs text-[#7a7a7a] text-center py-4">
                  কোনো চালান তৈরি হয়নি
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
                        {toBengaliNumber(p.purchase_date)} | {toBengaliNumber(p.total_eggs_pcs)} পিস
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#1d1d1f]">{formatTaka(p.total_landed_cost)}</div>
                      <div className="text-[11px] text-[#7a7a7a]">
                        দর ৳{toBengaliNumber((p.total_landed_cost / Math.max(1, p.total_eggs_pcs)).toFixed(2))}
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
