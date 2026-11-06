// ====================================================================
// DIMKHATA (ডিমখাতা) — Sourcing & Landed Cost Engine (Req 9)
// ====================================================================

import React, { useState } from 'react';
import { Truck, Plus, CheckCircle2, History, Calculator, UserCheck, AlertCircle } from 'lucide-react';
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
  // New Sourcing Entry Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Items in this truck batch
  const [items, setItems] = useState<
    { categoryId: string; qtyPcs: number; rawRate: number }[]
  >([
    {
      categoryId: categories[0]?.id || '',
      qtyPcs: 3000, // 100 crates
      rawRate: 10.20,
    },
  ]);

  // Landed Cost additions
  const [truckFare, setTruckFare] = useState<number>(3500);
  const [laborCost, setLaborCost] = useState<number>(1200);
  const [otherCost, setOtherCost] = useState<number>(300);

  // Payment details
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Computations
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

    // Calculate effective landed cost for each item proportionally
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

    // Reset form
    setItems([{ categoryId: categories[0]?.id || '', qtyPcs: 3000, rawRate: 10.20 }]);
    setPaidAmount(0);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-700" />
          <span>সোর্সিং ও খামার থেকে ডিম কেনা (Landed Cost Engine)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          ট্রাক ভাড়া, লোড-আনলোড লেবার খরচ যোগ করে স্বয়ংক্রিয়ভাবে ডিমের প্রকৃত ল্যান্ডেড কস্ট (WAC) নির্ণয়
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Supplier, Branch, Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  খামারী / মহাজন নির্বাচন
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.supplier_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  গোডাউন / শাখা
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  তারিখ
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Egg Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  ক্রয়কৃত ডিমের বিবরণ (Batch Items)
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>আইটেম যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-4">
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleItemChange(idx, 'categoryId', e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
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
                          className="w-full p-1.5 pr-8 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400">পিস</span>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.05"
                          placeholder="দর (প্রতি পিস)"
                          value={item.rawRate}
                          onChange={(e) => handleItemChange(idx, 'rawRate', e.target.value)}
                          className="w-full p-1.5 pl-6 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        />
                        <span className="absolute left-2 top-1.5 text-xs text-slate-400">৳</span>
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {formatTaka(item.qtyPcs * item.rawRate)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-600 hover:text-rose-800 text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Landed Cost Breakdown (Req 9) */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-700" />
                <span>ল্যান্ডেড খরচসমূহ (Landed Overheads)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ট্রাক / পিকআপ ভাড়া
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">৳</span>
                    <input
                      type="number"
                      value={truckFare}
                      onChange={(e) => setTruckFare(Number(e.target.value) || 0)}
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    লোড-আনলোড লেবার খরচ
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">৳</span>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    টোল / বিবিধ খরচ
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">৳</span>
                    <input
                      type="number"
                      value={otherCost}
                      onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নগদ পরিশোধ (Paid Amount)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পেমেন্ট একাউন্ট (যদি পরিশোধ থাকে)
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={paidAmount <= 0}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-50"
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
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ডিম কেনা সম্পন্ন ও স্টক যুক্ত করুন</span>
            </button>
          </form>
        </div>

        {/* Live Calculation Summary Card (1 Col) */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-amber-950 text-white rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-600/40 pb-3">
              <Calculator className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base">ল্যান্ডেড কস্ট লাইভ সামারি</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>মোট ডিমের সংখ্যা:</span>
                <span className="font-bold text-white">{toBengaliNumber(totalEggsPcs)} পিস</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>খামারের মূল দাম:</span>
                <span className="font-semibold">{formatTaka(rawSubtotal)}</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>ট্রাক + লেবার + অন্যান্য:</span>
                <span>+ {formatTaka(truckFare + laborCost + otherCost)}</span>
              </div>

              <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-bold text-white">
                <span>সর্বমোট ল্যান্ডেড কস্ট:</span>
                <span className="text-amber-400 text-base">{formatTaka(totalLandedCost)}</span>
              </div>

              <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-center mt-3">
                <div className="text-[11px] text-amber-200">প্রকৃত কেনা খরচ (প্রতি ডিম)</div>
                <div className="text-2xl font-black text-amber-300 mt-0.5">
                  ৳{toBengaliNumber(effectiveLandedRatePerPc.toFixed(2))}
                </div>
                <div className="text-[10px] text-amber-200/80 mt-1">
                  (প্রতি ডিমে ওভারহেড যোগ হয়েছে ৳{toBengaliNumber(((truckFare + laborCost + otherCost) / Math.max(1, totalEggsPcs)).toFixed(2))})
                </div>
              </div>

              <div className="border-t border-slate-700 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-emerald-400">
                  <span>পরিশোধিত টাকা:</span>
                  <span>{formatTaka(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>মহাজন পাবে (বকেয়া):</span>
                  <span>{formatTaka(dueAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sourcing History Quick List */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>সাম্প্রতিক ডিম কেনার চালানসমূহ</span>
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {purchases.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">
                  কোনো চালান তৈরি হয়নি
                </div>
              ) : (
                purchases.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{p.purchase_code}</div>
                      <div className="text-[11px] text-slate-400">
                        {toBengaliNumber(p.purchase_date)} | {toBengaliNumber(p.total_eggs_pcs)} পিস
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">{formatTaka(p.total_landed_cost)}</div>
                      <div className="text-[10px] text-amber-800">
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
