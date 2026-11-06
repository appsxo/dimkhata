// ====================================================================
// DIMKHATA (ডিমখাতা) — Wastage Loss & Courtesy Eggs (ElevenLabs Design)
// ====================================================================

import React, { useState } from 'react';
import { AlertTriangle, Gift, CheckCircle2, History } from 'lucide-react';
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
  const [qtyPcs, setQtyPcs] = useState<number>(30);
  const [wastageType, setWastageType] = useState<'WASTAGE_BROKEN' | 'WASTAGE_ROTTEN'>('WASTAGE_BROKEN');
  const [recipientOrReason, setRecipientOrReason] = useState('');

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
        <h2 className="font-serif font-light text-3xl text-[#0c0a09] tracking-tight">
          ড্যামেজ, পচা ও সৌজন্যে দেওয়া ডিমের হিসাব (Req 7, 8)
        </h2>
        <p className="text-xs text-[#777169] mt-0.5">
          ভাঙা বা নষ্ট ডিম ও স্থানীয় সৌজন্যে দেওয়া ডিমের আর্থিক ক্ষতি সরাসরি লাভ-লোকসানে সমন্বয়
        </p>
      </div>

      {/* 2 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-editorial flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-[#777169]">চলতি মাসের মোট ভাঙা/পচা ক্ষতি</div>
            <div className="font-serif font-light text-3xl text-[#0c0a09] mt-1">
              {formatTaka(monthlyWastage)}
            </div>
            <div className="text-[11px] text-[#777169] mt-0.5">
              Wastage Loss Expense হিসাবে বাদ পড়বে
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#f0efed] text-[#777169] flex items-center justify-center text-lg">
            💔
          </div>
        </div>

        <div className="card-editorial flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-[#777169]">চলতি মাসের মোট সৌজন্য ডিমের খরচ</div>
            <div className="font-serif font-light text-3xl text-[#0c0a09] mt-1">
              {formatTaka(monthlyCourtesy)}
            </div>
            <div className="text-[11px] text-[#777169] mt-0.5">
              Courtesy Promo Expense হিসাবে বাদ পড়বে
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#f0efed] text-[#777169] flex items-center justify-center text-lg">
            🎁
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form (2 Cols) */}
        <div className="lg:col-span-2 card-editorial space-y-5">
          {/* Tab Selector (Pill Geometry) */}
          <div className="flex bg-[#f0efed] p-1 rounded-full text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('WASTAGE')}
              className={`flex-1 py-2 rounded-full flex items-center justify-center gap-2 transition ${
                activeTab === 'WASTAGE'
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'text-[#4e4e4e] hover:text-[#0c0a09]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>ভাঙা ও পচা ডিম (Wastage Loss)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COURTESY')}
              className={`flex-1 py-2 rounded-full flex items-center justify-center gap-2 transition ${
                activeTab === 'COURTESY'
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'text-[#4e4e4e] hover:text-[#0c0a09]'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>সৌজন্যে / গিফটে দেওয়া ডিম (Courtesy)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  শাখা / গোডাউন
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
                  ডিমের ক্যাটাগরি
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input-editorial w-full text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_bn}
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
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
              </div>
            </div>

            {activeTab === 'WASTAGE' ? (
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  ড্যামেজের ধরন
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-medium transition ${
                      wastageType === 'WASTAGE_BROKEN'
                        ? 'bg-[#fafafa] border-[#0c0a09] text-[#0c0a09]'
                        : 'border-[#e7e5e4] text-[#4e4e4e]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wastageType"
                      checked={wastageType === 'WASTAGE_BROKEN'}
                      onChange={() => setWastageType('WASTAGE_BROKEN')}
                      className="text-[#0c0a09] focus:ring-[#0c0a09]"
                    />
                    <span>পরিবহনে বা নামানোর সময় ভাঙা</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-medium transition ${
                      wastageType === 'WASTAGE_ROTTEN'
                        ? 'bg-[#fafafa] border-[#0c0a09] text-[#0c0a09]'
                        : 'border-[#e7e5e4] text-[#4e4e4e]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wastageType"
                      checked={wastageType === 'WASTAGE_ROTTEN'}
                      onChange={() => setWastageType('WASTAGE_ROTTEN')}
                      className="text-[#0c0a09] focus:ring-[#0c0a09]"
                    />
                    <span>গরমে নষ্ট / পচা ডিম (Expiry)</span>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  কাকে সৌজন্যে দেওয়া হলো (প্রাপক / কারণ)
                </label>
                <input
                  type="text"
                  placeholder="উদা: স্থানীয় মেহমান আপ্যায়ন / প্রশাসন / খামারী শুভেচ্ছা"
                  value={recipientOrReason}
                  onChange={(e) => setRecipientOrReason(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
              </div>
            )}

            {/* Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#fafafa] p-4 rounded-xl border border-[#e7e5e4]">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  পরিমাণ (পিস)
                </label>
                <input
                  type="number"
                  value={qtyPcs}
                  onChange={(e) => setQtyPcs(Number(e.target.value) || 0)}
                  className="input-editorial w-full text-sm font-semibold"
                />
                <div className="text-[11px] text-[#777169] mt-1">
                  মোট: {toBengaliNumber(qtyPcs)} পিস ({toBengaliNumber(Math.floor(qtyPcs / 30))} খাঁচি {toBengaliNumber(qtyPcs % 30)} পিস)
                </div>
              </div>

              <div>
                <div className="text-xs text-[#777169]">আর্থিক ক্ষতির মূল্য (স্বয়ংক্রিয় ল্যান্ডেড দর)</div>
                <div className="font-serif font-light text-2xl text-[#0c0a09] mt-1">
                  {formatTaka(totalCostValue)}
                </div>
                <div className="text-[10px] text-[#777169] mt-1">
                  (প্রতি পিসের বর্তমান কেনা খরচ: ৳{toBengaliNumber(currentUnitLandedCost.toFixed(2))})
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full h-11"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>স্টক থেকে বাদ দিন ও লাভ-লোকসানে যুক্ত করুন</span>
            </button>
          </form>
        </div>

        {/* Adjustments History */}
        <div className="card-editorial p-4 space-y-3">
          <h4 className="text-xs font-medium text-[#777169] uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            <span>সাম্প্রতিক রেকর্ডসমূহ</span>
          </h4>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {adjustments.length === 0 ? (
              <div className="text-xs text-[#a8a29e] text-center py-6">
                কোনো রেকর্ড নেই
              </div>
            ) : (
              adjustments.map((a) => {
                const cat = categories.find((c) => c.id === a.category_id);
                const isWastage = a.adjustment_type === 'WASTAGE_BROKEN' || a.adjustment_type === 'WASTAGE_ROTTEN';
                return (
                  <div
                    key={a.id}
                    className="p-3 bg-[#fafafa] rounded-lg border border-[#e7e5e4] text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-[#0c0a09] flex items-center gap-1.5">
                        <span>{isWastage ? 'ভাঙা/পচা' : 'সৌজন্য'}</span>
                        <span className="text-[#a8a29e]">•</span>
                        <span>{cat?.name_bn}</span>
                      </div>
                      <div className="text-[11px] text-[#777169] mt-0.5">
                        {toBengaliNumber(a.adjustment_date)} | {toBengaliNumber(a.qty_pcs)} পিস
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-[#0c0a09]">{formatTaka(a.total_cost_value)}</div>
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
