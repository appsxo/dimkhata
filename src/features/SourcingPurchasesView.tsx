// ====================================================================
// DIMKHATA (ডিমখাতা) — Sourcing & Landed Cost Engine (ElevenLabs Design)
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
      {/* Title */}
      <div>
        <h2 className="font-serif font-light text-3xl text-[#0c0a09] tracking-tight">
          সোর্সিং ও খামার থেকে ডিম কেনা (Landed Cost Engine)
        </h2>
        <p className="text-xs text-[#777169] mt-0.5">
          ট্রাক ভাড়া, লোড-আনলোড লেবার খরচ যোগ করে স্বয়ংক্রিয়ভাবে ডিমের প্রকৃত ল্যান্ডেড কস্ট (WAC) নির্ণয়
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form (2 Cols) */}
        <div className="lg:col-span-2 card-editorial space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Supplier, Branch, Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  খামারী / মহাজন নির্বাচন
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="input-editorial w-full text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.supplier_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  গোডাউন / শাখা
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="input-editorial w-full text-xs"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  তারিখ
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
              </div>
            </div>

            {/* Egg Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#0c0a09]">
                  ক্রয়কৃত ডিমের বিবরণ (Batch Items)
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn-outline text-xs h-8 px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>আইটেম যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#fafafa] border border-[#e7e5e4] rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-4">
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleItemChange(idx, 'categoryId', e.target.value)}
                        className="input-editorial w-full text-xs py-1.5"
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
                          className="input-editorial w-full pr-8 text-xs font-semibold py-1.5"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-[#a8a29e]">পিস</span>
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
                          className="input-editorial w-full pl-6 text-xs font-semibold py-1.5"
                        />
                        <span className="absolute left-2.5 top-2 text-xs text-[#777169]">৳</span>
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-[#0c0a09]">
                        {formatTaka(item.qtyPcs * item.rawRate)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-[#a8a29e] hover:text-[#dc2626] text-xs px-1"
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
            <div className="bg-[#fafafa] border border-[#e7e5e4] rounded-xl p-4 space-y-3">
              <div className="text-xs font-medium text-[#0c0a09] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#777169]" />
                <span>পরিবহন ও লোডিং ওভারহেড (Landed Overheads)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777169] mb-1">
                    ট্রাক / পিকআপ ভাড়া
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-[#777169]">৳</span>
                    <input
                      type="number"
                      value={truckFare}
                      onChange={(e) => setTruckFare(Number(e.target.value) || 0)}
                      className="input-editorial w-full pl-6 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#777169] mb-1">
                    লোড-আনলোড লেবার খরচ
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-[#777169]">৳</span>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
                      className="input-editorial w-full pl-6 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#777169] mb-1">
                    টোল / বিবিধ খরচ
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-[#777169]">৳</span>
                    <input
                      type="number"
                      value={otherCost}
                      onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
                      className="input-editorial w-full pl-6 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f0efed]">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  নগদ পরিশোধ (Paid Amount)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-[#777169]">৳</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="input-editorial w-full pl-7 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  পেমেন্ট একাউন্ট
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={paidAmount <= 0}
                  className="input-editorial w-full text-xs disabled:opacity-50"
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
              className="btn-primary w-full h-11"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ডিম কেনা সম্পন্ন ও স্টক যুক্ত করুন</span>
            </button>
          </form>
        </div>

        {/* Live Calculation Summary (Dark-Inverted Card: #0c0a09, per ElevenLabs pricing-tier-featured spec) */}
        <div className="space-y-4">
          <div className="bg-[#0c0a09] text-white rounded-2xl p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Calculator className="w-5 h-5 text-white/80" />
              <h3 className="font-serif font-light text-xl text-white">ল্যান্ডেড কস্ট সামারি</h3>
            </div>

            <div className="space-y-2.5 text-xs text-[#a8a29e]">
              <div className="flex justify-between">
                <span>মোট ডিমের সংখ্যা:</span>
                <span className="font-medium text-white">{toBengaliNumber(totalEggsPcs)} পিস</span>
              </div>
              <div className="flex justify-between">
                <span>খামারের মূল দর:</span>
                <span className="font-medium text-white">{formatTaka(rawSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>ট্রাক + লেবার + অন্যান্য:</span>
                <span className="text-white">+ {formatTaka(truckFare + laborCost + otherCost)}</span>
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between text-sm font-medium text-white">
                <span>সর্বমোট ল্যান্ডেড কস্ট:</span>
                <span className="font-serif font-light text-xl text-white">{formatTaka(totalLandedCost)}</span>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center mt-3">
                <div className="text-[11px] text-[#a8a29e]">প্রকৃত কেনা খরচ (প্রতি ডিম)</div>
                <div className="font-serif font-light text-3xl text-white mt-0.5">
                  ৳{toBengaliNumber(effectiveLandedRatePerPc.toFixed(2))}
                </div>
                <div className="text-[10px] text-[#a8a29e] mt-1">
                  (প্রতি ডিমে ওভারহেড যোগ হয়েছে ৳{toBengaliNumber(((truckFare + laborCost + otherCost) / Math.max(1, totalEggsPcs)).toFixed(2))})
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-[#a8a29e]">
                  <span>পরিশোধিত টাকা:</span>
                  <span className="text-white">{formatTaka(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-[#a8a29e]">
                  <span>মহাজন বকেয়া পাবে:</span>
                  <span className="text-white font-medium">{formatTaka(dueAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sourcing History Quick List */}
          <div className="card-editorial p-4 space-y-3">
            <h4 className="text-xs font-medium text-[#777169] uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>সাম্প্রতিক চালানসমূহ</span>
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {purchases.length === 0 ? (
                <div className="text-xs text-[#a8a29e] text-center py-4">
                  কোনো চালান তৈরি হয়নি
                </div>
              ) : (
                purchases.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-[#fafafa] rounded-lg border border-[#e7e5e4] text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-[#0c0a09]">{p.purchase_code}</div>
                      <div className="text-[11px] text-[#777169]">
                        {toBengaliNumber(p.purchase_date)} | {toBengaliNumber(p.total_eggs_pcs)} পিস
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-[#0c0a09]">{formatTaka(p.total_landed_cost)}</div>
                      <div className="text-[10px] text-[#777169]">
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
