// ====================================================================
// DIMKHATA (ডিমখাতা) — Wastage Loss & Courtesy Stock Deduction (Req 7, 8)
// ====================================================================

import React, { useState } from 'react';
import { AlertTriangle, Gift, CheckCircle2, History, Trash2, ArrowRight } from 'lucide-react';
import { EggCategory, InventoryStock, Branch, StockAdjustment } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';

interface WastageCourtesyViewProps {
  categories: EggCategory[];
  stocks: InventoryStock[];
  branches: Branch[];
  adjustments: StockAdjustment[];
  onRefresh: () => void;
}

export const WastageCourtesyView: React.FC<WastageCourtesyViewProps> = ({
  categories,
  stocks,
  branches,
  adjustments,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'WASTAGE' | 'COURTESY'>('WASTAGE');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [qtyPcs, setQtyPcs] = useState<number>(30); // 1 crate default
  const [wastageType, setWastageType] = useState<'WASTAGE_BROKEN' | 'WASTAGE_ROTTEN'>('WASTAGE_BROKEN');
  const [recipientOrReason, setRecipientOrReason] = useState('');

  // Current Landed Cost for valuation
  const currentStock = stocks.find((s) => s.category_id === categoryId && s.branch_id === branchId);
  const currentUnitLandedCost = currentStock?.avg_landed_cost_per_pc || 10.50;
  const totalCostValue = Math.round(qtyPcs * currentUnitLandedCost * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qtyPcs <= 0) {
      alert('দয়া করে সঠিক ডিমের সংখ্যা দিন!');
      return;
    }

    const type = activeTab === 'WASTAGE' ? wastageType : 'COURTESY_GIFT';
    const adjCode = DimKhataStore.getNextCode('ADJ');

    const newAdjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      adjustment_code: adjCode,
      adjustment_date: adjustmentDate,
      branch_id: branchId,
      category_id: categoryId,
      adjustment_type: type,
      qty_pcs: qtyPcs,
      unit_landed_cost: currentUnitLandedCost,
      total_cost_value: totalCostValue,
      recipient_or_reason: recipientOrReason || (activeTab === 'WASTAGE' ? 'পরিবহনে ভাঙা / গরমে পচা' : 'সৌজন্য গিফট'),
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordStockAdjustment(newAdjustment);
    alert('সফল! ডিম স্টক থেকে বিয়োগ করা হয়েছে এবং লাভ-লোকসানের খরচে যুক্ত হয়েছে।');
    onRefresh();

    setQtyPcs(30);
    setRecipientOrReason('');
  };

  // Calculations for current month's totals
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyWastage = adjustments
    .filter((a) => a.adjustment_date.startsWith(currentMonth) && (a.adjustment_type === 'WASTAGE_BROKEN' || a.adjustment_type === 'WASTAGE_ROTTEN'))
    .reduce((sum, a) => sum + a.total_cost_value, 0);

  const monthlyCourtesy = adjustments
    .filter((a) => a.adjustment_date.startsWith(currentMonth) && a.adjustment_type === 'COURTESY_GIFT')
    .reduce((sum, a) => sum + a.total_cost_value, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>ড্যামেজ, পচা ও সৌজন্যে দেওয়া ডিমের হিসাব (Req 7, 8)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          ভাঙা বা নষ্ট ডিম ও স্থানীয় সৌজন্যে দেওয়া ডিমের আর্থিক ক্ষতি সরাসরি লাভ-লোকসানে সমন্বয়
        </p>
      </div>

      {/* 2 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">চলতি মাসের মোট ভাঙা/পচা ক্ষতি</div>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {formatTaka(monthlyWastage)}
            </div>
            <div className="text-[11px] text-rose-600 mt-0.5">
              Wastage Loss Expense হিসাবে পিএন্ডএলে বাদ যাবে
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
            💔
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">চলতি মাসের মোট সৌজন্য ডিমের খরচ</div>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {formatTaka(monthlyCourtesy)}
            </div>
            <div className="text-[11px] text-blue-600 mt-0.5">
              Courtesy Promo Expense হিসাবে পিএন্ডএলে বাদ যাবে
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            🎁
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('WASTAGE')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                activeTab === 'WASTAGE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>ভাঙা ও পচা ডিম (Wastage Loss)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COURTESY')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                activeTab === 'COURTESY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>সৌজন্যে / গিফটে দেওয়া ডিম (Courtesy)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শাখা / গোডাউন
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
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
                  ডিমের ক্যাটাগরি
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_bn}
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
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            {/* If Wastage tab, select broken vs rotten */}
            {activeTab === 'WASTAGE' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ড্যামেজের ধরন
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-medium ${
                      wastageType === 'WASTAGE_BROKEN'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wastageType"
                      checked={wastageType === 'WASTAGE_BROKEN'}
                      onChange={() => setWastageType('WASTAGE_BROKEN')}
                      className="text-rose-600"
                    />
                    <span>পরিবহনে বা নামানোর সময় ভাঙা ডিম</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-medium ${
                      wastageType === 'WASTAGE_ROTTEN'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wastageType"
                      checked={wastageType === 'WASTAGE_ROTTEN'}
                      onChange={() => setWastageType('WASTAGE_ROTTEN')}
                      className="text-rose-600"
                    />
                    <span>গরমে নষ্ট / পচা ডিম (Expiry Loss)</span>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কাকে সৌজন্যে দেওয়া হলো (প্রাপক / কারণ)
                </label>
                <input
                  type="text"
                  placeholder="উদা: স্থানীয় মেহমান আপ্যায়ন / প্রশাসন / খামারী শুভেচ্ছা"
                  value={recipientOrReason}
                  onChange={(e) => setRecipientOrReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            )}

            {/* Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পরিমাণ (পিস)
                </label>
                <input
                  type="number"
                  value={qtyPcs}
                  onChange={(e) => setQtyPcs(Number(e.target.value) || 0)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm font-black text-slate-900"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  মোট: {toBengaliNumber(qtyPcs)} পিস (বা {toBengaliNumber(Math.floor(qtyPcs / 30))} খাঁচি {toBengaliNumber(qtyPcs % 30)} পিস)
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium">আর্থিক ক্ষতির মূল্য (স্বয়ংক্রিয় ল্যান্ডেড দর)</div>
                <div className="text-xl font-black text-rose-700 mt-1">
                  {formatTaka(totalCostValue)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  (প্রতি পিসের বর্তমান কেনা খরচ: ৳{toBengaliNumber(currentUnitLandedCost.toFixed(2))})
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 ${
                activeTab === 'WASTAGE'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>স্টক থেকে বাদ দিন ও লাভ-লোকসানে যুক্ত করুন</span>
            </button>
          </form>
        </div>

        {/* Adjustments History (1 Col) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>সাম্প্রতিক নষ্ট ও সৌজন্য রেকর্ড</span>
          </h4>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {adjustments.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                কোনো রেকর্ড নেই
              </div>
            ) : (
              adjustments.map((a) => {
                const cat = categories.find((c) => c.id === a.category_id);
                const isWastage = a.adjustment_type === 'WASTAGE_BROKEN' || a.adjustment_type === 'WASTAGE_ROTTEN';
                return (
                  <div
                    key={a.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className={isWastage ? 'text-rose-700' : 'text-blue-700'}>
                          {isWastage ? '💔 ভাঙা/পচা' : '🎁 সৌজন্য'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>{cat?.name_bn}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {toBengaliNumber(a.adjustment_date)} | {toBengaliNumber(a.qty_pcs)} পিস ({a.recipient_or_reason || ''})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-rose-700">{formatTaka(a.total_cost_value)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
