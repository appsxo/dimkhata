import React, { useState } from 'react';
import { AlertTriangle, Gift, CheckCircle2, History, ArrowRightLeft } from 'lucide-react';
import { EggCategory, InventoryStock, Branch, StockAdjustment } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { useLanguage, getCategoryDisplayName } from '../lib/i18n';
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
  const currentUnitLandedCost = currentStock?.avg_landed_cost_per_pc || 10.5;
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
      activeTab === 'WASTAGE' ? wastageType : activeTab === 'COURTESY' ? 'COURTESY_GIFT' : 'BRANCH_TRANSFER';

    DimKhataStore.recordStockAdjustment({
      id: `adj-${Date.now()}`,
      adjustment_code: DimKhataStore.getNextCode('ADJ'),
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
          ? t('পরিবহনে ভাঙা / পচা', 'Broken / Rotten Wastage')
          : activeTab === 'COURTESY'
          ? t('সৌজন্য গিফট', 'Courtesy Gift')
          : `${t('শাখা স্থানান্তর', 'Branch Transfer')} (${branches.find((b) => b.id === targetBranchId)?.name || ''})`),
      created_at: new Date().toISOString(),
    });

    alert(
      activeTab === 'TRANSFER'
        ? t('সফল! স্টক স্থানান্তরিত হয়েছে।', 'Stock transferred successfully!')
        : t('সফল! স্টক বিয়োগ ও লাভ-লোকসানে যুক্ত হয়েছে।', 'Stock deducted and recorded in P&L!')
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
    <div className="space-y-5">
      <AppleSectionHeader
        title={t('ড্যামেজ, সৌজন্য ও শাখা স্থানান্তর', 'Wastage, Courtesy & Transfer')}
        subtitle={t('ভাঙা/পচা ডিম ও সৌজন্য গিফট স্বয়ংক্রিয়ভাবে লাভ-লোকসানে যুক্ত হয়', 'Broken/rotten eggs and courtesy gifts auto-deduct from stock & P&L')}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <AppleStatCard
          label={t('চলতি মাসের ভাঙা/পচা ক্ষতি', "Month's Wastage Loss")}
          value={formatTaka(monthlyWastage)}
          icon={<span>💔</span>}
        />
        <AppleStatCard
          label={t('চলতি মাসের সৌজন্য খরচ', "Month's Courtesy Expense")}
          value={formatTaka(monthlyCourtesy)}
          icon={<span>🎁</span>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-apple p-4 sm:p-5 space-y-4">
          <AppleOptionChips
            options={[
              { value: 'WASTAGE', label: t('ভাঙা ও পচা', 'Wastage'), icon: <AlertTriangle className="w-3.5 h-3.5" /> },
              { value: 'COURTESY', label: t('সৌজন্য গিফট', 'Courtesy'), icon: <Gift className="w-3.5 h-3.5" /> },
              { value: 'TRANSFER', label: t('শাখা স্থানান্তর', 'Transfer'), icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {activeTab === 'TRANSFER' ? t('উৎস শাখা', 'Source Branch') : t('শাখা / গোডাউন', 'Branch')}
                </label>
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input-apple w-full text-[14px]">
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('ডিমের ক্যাটাগরি', 'Egg Category')}
                </label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-apple w-full text-[14px]">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{getCategoryDisplayName(c)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('তারিখ', 'Date')}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  className={`p-3 rounded-[12px] border flex items-center gap-2 cursor-pointer text-[13px] font-semibold transition ${
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
                  />
                  <span>{t('পরিবহনে বা নামানোর সময় ভাঙা', 'Broken in Transit / Unloading')}</span>
                </label>

                <label
                  className={`p-3 rounded-[12px] border flex items-center gap-2 cursor-pointer text-[13px] font-semibold transition ${
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
                  />
                  <span>{t('গরমে নষ্ট / পচা ডিম', 'Rotten / Expired Eggs')}</span>
                </label>
              </div>
            ) : activeTab === 'COURTESY' ? (
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('প্রাপক / কারণ', 'Recipient / Reason')}
                </label>
                <input
                  type="text"
                  placeholder={t('উদা: মেহমান আপ্যায়ন / সৌজন্য উপহার', 'e.g., Guest hospitality / Promo gift')}
                  value={recipientOrReason}
                  onChange={(e) => setRecipientOrReason(e.target.value)}
                  className="input-apple w-full text-[14px]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                    {t('গন্তব্য শাখা', 'Destination Branch')}
                  </label>
                  <select value={targetBranchId} onChange={(e) => setTargetBranchId(e.target.value)} className="input-apple w-full text-[14px]">
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                    {t('ট্রান্সফার নোট', 'Transfer Note')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('উদা: ভ্যানে গোডাউনে প্রেরণ', 'e.g., Sent via van')}
                    value={recipientOrReason}
                    onChange={(e) => setRecipientOrReason(e.target.value)}
                    className="input-apple w-full text-[14px]"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#f5f5f7] p-3.5 rounded-[12px] border border-[#e0e0e0]">
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('পরিমাণ (পিস)', 'Qty (Pcs)')} | {t('মজুদ:', 'Stock:')} {toBengaliNumber(currentStock?.qty_pcs || 0)}
                </label>
                <input
                  type="number"
                  value={qtyPcs}
                  onChange={(e) => setQtyPcs(Number(e.target.value) || 0)}
                  className="input-apple w-full text-[15px] font-semibold"
                />
                <div className="text-[11px] text-[#7a7a7a] mt-1">
                  {toBengaliNumber(Math.floor(qtyPcs / crateSize))} {t('খাঁচি', 'crates')} {toBengaliNumber(qtyPcs % crateSize)} {t('পিস', 'pcs')}
                </div>
              </div>

              <div>
                <div className="text-[12px] text-[#7a7a7a]">
                  {activeTab === 'TRANSFER' ? t('স্থানান্তরিত স্টকের মূল্য', 'Transfer Cost Value') : t('আর্থিক ক্ষতির মূল্য (WAC)', 'Loss Value (WAC)')}
                </div>
                <div className="font-semibold text-[22px] text-[#1d1d1f] mt-0.5">
                  {formatTaka(totalCostValue)}
                </div>
                <div className="text-[11px] text-[#0066cc] font-semibold">
                  (৳{toBengaliNumber(currentUnitLandedCost.toFixed(2))} / {t('পিস', 'pc')})
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 text-[14px]">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {activeTab === 'TRANSFER'
                  ? t('শাখা স্টক ট্রান্সফার সম্পন্ন করুন', 'Transfer Branch Stock')
                  : t('স্টক থেকে বাদ ও সংরক্ষণ করুন', 'Deduct Stock & Record')}
              </span>
            </button>
          </form>
        </div>

        <div className="card-apple p-4 sm:p-5 space-y-3">
          <h4 className="text-[12px] font-semibold text-[#7a7a7a] uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>{t('সাম্প্রতিক রেকর্ড', 'Recent Adjustments')}</span>
          </h4>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {adjustments.length === 0 ? (
              <div className="text-xs text-[#7a7a7a] text-center py-6">
                {t('কোনো রেকর্ড নেই', 'No adjustments yet')}
              </div>
            ) : (
              adjustments.map((a) => {
                const cat = categories.find((c) => c.id === a.category_id);
                const isWastage = a.adjustment_type === 'WASTAGE_BROKEN' || a.adjustment_type === 'WASTAGE_ROTTEN';
                const isTransfer = a.adjustment_type === 'BRANCH_TRANSFER';
                return (
                  <div
                    key={a.id}
                    className="p-2.5 bg-[#f5f5f7] rounded-[12px] border border-[#e0e0e0] text-xs flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                        <span className="text-[#0066cc]">
                          {isWastage ? t('ভাঙা/পচা', 'Wastage') : isTransfer ? t('ট্রান্সফার', 'Transfer') : t('সৌজন্য', 'Courtesy')}
                        </span>
                        <span className="text-[#7a7a7a]">•</span>
                        <span>{cat ? getCategoryDisplayName(cat) : ''}</span>
                      </div>
                      <div className="text-[11px] text-[#7a7a7a] mt-0.5">
                        {toBengaliNumber(a.adjustment_date)} | {toBengaliNumber(a.qty_pcs)} {t('পিস', 'pcs')}
                      </div>
                    </div>
                    <div className="font-semibold text-[#1d1d1f]">{formatTaka(a.total_cost_value)}</div>
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
