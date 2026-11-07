// ====================================================================
// DIMKHATA (ডিমখাতা) — Wastage Loss & Courtesy Eggs (Apple Design System)
// ====================================================================

import React, { useState } from 'react';
import { AlertTriangle, Gift, CheckCircle2, History, ArrowRightLeft } from 'lucide-react';
import { EggCategory, InventoryStock, Branch, StockAdjustment } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { useLanguage } from '../lib/i18n';
import { AppleSectionHeader, AppleStatCard, AppleOptionChips } from '../components/ui/AppleUI';

interface WastageCourtesyViewProps {
  categories: EggCategory[];
  stocks: InventoryStock[];
  allBranchStocks?: InventoryStock[];
  branches: Branch[];
  adjustments: StockAdjustment[];
  onRefresh: () => void;
}

export const WastageCourtesyView: React.FC<WastageCourtesyViewProps> = ({
  categories,
  stocks,
  allBranchStocks,
  branches,
  adjustments,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const rawBranchStocks = allBranchStocks || stocks;
  const [activeTab, setActiveTab] = useState<'WASTAGE' | 'COURTESY' | 'TRANSFER'>('WASTAGE');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [targetBranchId, setTargetBranchId] = useState(branches[1]?.id || branches[0]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [qtyPcs, setQtyPcs] = useState<number>(30);
  const [wastageType, setWastageType] = useState<'WASTAGE_BROKEN' | 'WASTAGE_ROTTEN'>('WASTAGE_BROKEN');
  const [recipientOrReason, setRecipientOrReason] = useState('');

  const selectedCat = categories.find((c) => c.id === categoryId);
  const crateSize = selectedCat?.pcs_per_crate || 30;
  const currentStock = rawBranchStocks.find((s) => s.category_id === categoryId && s.branch_id === branchId);
  const currentUnitLandedCost = currentStock?.avg_landed_cost_per_pc || 10.50;
  const totalCostValue = Math.round(qtyPcs * currentUnitLandedCost * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qtyPcs <= 0) {
      alert(t('দয়া করে সঠিক ডিমের সংখ্যা দিন!', 'Please enter a valid egg quantity!'));
      return;
    }

    if (activeTab === 'TRANSFER' && branchId === targetBranchId) {
      alert(t('উৎস এবং গন্তব্য শাখা আলাদা হতে হবে!', 'Source and destination branches must be different!'));
      return;
    }

    const type: StockAdjustment['adjustment_type'] =
      activeTab === 'WASTAGE'
        ? wastageType
        : activeTab === 'COURTESY'
        ? 'COURTESY_GIFT'
        : 'BRANCH_TRANSFER';
    const adjCode = DimKhataStore.getNextCode('ADJ');

    const newAdjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      adjustment_code: adjCode,
      adjustment_date: adjustmentDate,
      branch_id: branchId,
      target_branch_id: activeTab === 'TRANSFER' ? targetBranchId : undefined,
      category_id: categoryId,
      adjustment_type: type,
      qty_pcs: qtyPcs,
      unit_landed_cost: currentUnitLandedCost,
      total_cost_value: totalCostValue,
      recipient_or_reason:
        recipientOrReason ||
        (activeTab === 'WASTAGE'
          ? t('পরিবহনে ভাঙা / গরমে পচা', 'Broken / Rotten Wastage')
          : activeTab === 'COURTESY'
          ? t('সৌজন্য গিফট', 'Courtesy Gift')
          : `শাখা ট্রান্সফার (${branches.find((b) => b.id === targetBranchId)?.name || 'গন্তব্য শাখা'})`),
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordStockAdjustment(newAdjustment);
    alert(
      activeTab === 'TRANSFER'
        ? t('সফল! এক শাখা থেকে অন্য শাখায় ডিমের স্টক স্থানান্তরিত হয়েছে।', 'Stock transferred successfully between branches!')
        : t('সফল! ডিম স্টক থেকে বিয়োগ করা হয়েছে এবং লাভ-লোকসানের খরচে যুক্ত হয়েছে।', 'Stock deducted and loss recorded in P&L!')
    );
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
      <AppleSectionHeader
        eyebrow={t('স্টক সমন্বয় ও লস ট্র্যাকিং', 'Stock Adjustment & Loss Tracking')}
        title={t('ড্যামেজ, পচা, সৌজন্য ডিম ও শাখা স্থানান্তর', 'Wastage, Courtesy & Branch Transfer')}
        subtitle={t(
          'ভাঙা বা নষ্ট ডিম ও সৌজন্যে দেওয়া ডিমের আর্থিক ক্ষতি স্বয়ংক্রিয়ভাবে লাভ-লোকসানে যোগ হবে',
          'Broken/rotten eggs and courtesy gifts are automatically deducted from stock and recorded in P&L'
        )}
      />

      {/* 2 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AppleStatCard
          label={t('চলতি মাসের মোট ভাঙা/পচা ক্ষতি', "This Month's Wastage Loss")}
          value={formatTaka(monthlyWastage)}
          subtext={t('Wastage Loss Expense হিসাবে লাভ-লোকসানে বাদ পড়বে', 'Deducted as Wastage Loss in Net Profit')}
          icon={<span>💔</span>}
        />

        <AppleStatCard
          label={t('চলতি মাসের মোট সৌজন্য ডিমের খরচ', "This Month's Courtesy Expense")}
          value={formatTaka(monthlyCourtesy)}
          subtext={t('Courtesy Promo Expense হিসাবে লাভ-লোকসানে বাদ পড়বে', 'Deducted as Courtesy Expense in Net Profit')}
          icon={<span>🎁</span>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form (2 Cols) */}
        <div className="lg:col-span-2 card-apple p-5 sm:p-6 space-y-5">
          {/* Option Chips */}
          <AppleOptionChips
            options={[
              { value: 'WASTAGE', label: t('ভাঙা ও পচা (Wastage)', 'Wastage'), icon: <AlertTriangle className="w-3.5 h-3.5" /> },
              { value: 'COURTESY', label: t('সৌজন্য গিফট (Courtesy)', 'Courtesy'), icon: <Gift className="w-3.5 h-3.5" /> },
              { value: 'TRANSFER', label: t('শাখা স্থানান্তর (Transfer)', 'Transfer'), icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {activeTab === 'TRANSFER'
                    ? t('উৎস শাখা (যেখান থেকে যাবে)', 'Source Branch')
                    : t('শাখা / গোডাউন', 'Branch / Godown')}
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
                  ডিমের ক্যাটাগরি
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input-apple w-full text-[14px]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_bn}
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
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                  className="input-apple w-full text-[14px]"
                />
              </div>
            </div>

            {activeTab === 'WASTAGE' ? (
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1.5">
                  ড্যামেজের ধরন নির্বাচন করুন
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-[12px] border flex items-center gap-2.5 cursor-pointer text-[13px] font-semibold transition ${
                      wastageType === 'WASTAGE_BROKEN'
                        ? 'bg-[#0066cc]/8 border-[#0066cc] text-[#0066cc]'
                        : 'border-[#d2d2d7] bg-white text-[#1d1d1f]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wastageType"
                      checked={wastageType === 'WASTAGE_BROKEN'}
                      onChange={() => setWastageType('WASTAGE_BROKEN')}
                      className="text-[#0066cc] focus:ring-[#0071e3]"
                    />
                    <span>পরিবহনে বা নামানোর সময় ভাঙা</span>
                  </label>

                  <label
                    className={`p-3.5 rounded-[12px] border flex items-center gap-2.5 cursor-pointer text-[13px] font-semibold transition ${
                      wastageType === 'WASTAGE_ROTTEN'
                        ? 'bg-[#0066cc]/8 border-[#0066cc] text-[#0066cc]'
                        : 'border-[#d2d2d7] bg-white text-[#1d1d1f]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wastageType"
                      checked={wastageType === 'WASTAGE_ROTTEN'}
                      onChange={() => setWastageType('WASTAGE_ROTTEN')}
                      className="text-[#0066cc] focus:ring-[#0071e3]"
                    />
                    <span>গরমে নষ্ট / পচা ডিম (Expiry)</span>
                  </label>
                </div>
              </div>
            ) : activeTab === 'COURTESY' ? (
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  কাকে সৌজন্যে দেওয়া হলো (প্রাপক / কারণ)
                </label>
                <input
                  type="text"
                  placeholder="উদা: স্থানীয় মেহমান আপ্যায়ন / খামারী শুভেচ্ছা"
                  value={recipientOrReason}
                  onChange={(e) => setRecipientOrReason(e.target.value)}
                  className="input-apple w-full text-[14px]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                    গন্তব্য শাখা (যেখানে জমা হবে)
                  </label>
                  <select
                    value={targetBranchId}
                    onChange={(e) => setTargetBranchId(e.target.value)}
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
                    ট্রান্সফার নোট / বাহন
                  </label>
                  <input
                    type="text"
                    placeholder="উদা: নিজস্ব ভ্যানে যাত্রাবাড়ী গোডাউনে প্রেরণ"
                    value={recipientOrReason}
                    onChange={(e) => setRecipientOrReason(e.target.value)}
                    className="input-apple w-full text-[14px]"
                  />
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#f5f5f7] p-4 rounded-[12px] border border-[#e0e0e0]">
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  পরিমাণ (পিস) | শাখায় মজুদ: {toBengaliNumber(currentStock?.qty_pcs || 0)} পিস
                </label>
                <input
                  type="number"
                  value={qtyPcs}
                  onChange={(e) => setQtyPcs(Number(e.target.value) || 0)}
                  className="input-apple w-full text-[15px] font-semibold"
                />
                <div className="text-[11px] text-[#7a7a7a] mt-1">
                  মোট: {toBengaliNumber(qtyPcs)} পিস ({toBengaliNumber(Math.floor(qtyPcs / crateSize))} খাঁচি {toBengaliNumber(qtyPcs % crateSize)} পিস)
                </div>
              </div>

              <div>
                <div className="text-[12px] text-[#7a7a7a]">
                  {activeTab === 'TRANSFER' ? 'স্থানান্তরিত স্টকের ল্যান্ডেড মূল্য' : 'আর্থিক ক্ষতির মূল্য (স্বয়ংক্রিয় ল্যান্ডেড দর)'}
                </div>
                <div className="font-semibold text-[24px] text-[#1d1d1f] mt-1">
                  {formatTaka(totalCostValue)}
                </div>
                <div className="text-[11px] text-[#0066cc] font-semibold mt-0.5">
                  (প্রতি পিসের বর্তমান কেনা খরচ: ৳{toBengaliNumber(currentUnitLandedCost.toFixed(2))})
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-[15px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {activeTab === 'TRANSFER'
                  ? 'শাখা স্টক ট্রান্সফার সম্পন্ন করুন'
                  : 'স্টক থেকে বাদ দিন ও লাভ-লোকসানে যুক্ত করুন'}
              </span>
            </button>
          </form>
        </div>

        {/* Adjustments History */}
        <div className="card-apple p-4 sm:p-5 space-y-3">
          <h4 className="text-[12px] font-semibold text-[#7a7a7a] uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>সাম্প্রতিক রেকর্ডসমূহ</span>
          </h4>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {adjustments.length === 0 ? (
              <div className="text-xs text-[#7a7a7a] text-center py-6">
                কোনো রেকর্ড নেই
              </div>
            ) : (
              adjustments.map((a) => {
                const cat = categories.find((c) => c.id === a.category_id);
                const isWastage = a.adjustment_type === 'WASTAGE_BROKEN' || a.adjustment_type === 'WASTAGE_ROTTEN';
                const isTransfer = a.adjustment_type === 'BRANCH_TRANSFER';
                return (
                  <div
                    key={a.id}
                    className="p-3 bg-[#f5f5f7] rounded-[12px] border border-[#e0e0e0] text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                        <span className="text-[#0066cc]">{isWastage ? 'ভাঙা/পচা' : isTransfer ? 'শাখা স্থানান্তর' : 'সৌজন্য'}</span>
                        <span className="text-[#7a7a7a]">•</span>
                        <span>{cat?.name_bn}</span>
                      </div>
                      <div className="text-[11px] text-[#7a7a7a] mt-0.5">
                        {toBengaliNumber(a.adjustment_date)} | {toBengaliNumber(a.qty_pcs)} পিস
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#1d1d1f]">{formatTaka(a.total_cost_value)}</div>
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
