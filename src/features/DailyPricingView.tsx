// ====================================================================
// DIMKHATA (ডিমখাতা) — Daily Market Rates (Apple Design System)
// ====================================================================

import React, { useState, useEffect } from 'react';
import { Save, Info } from 'lucide-react';
import { EggCategory, DailyMarketRate, InventoryStock } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatQuantityPcs, toBengaliNumber } from '../lib/egg-units';
import { useLanguage, getCategoryDisplayName } from '../lib/i18n';
import { AppleSectionHeader } from '../components/ui/AppleUI';

interface DailyPricingViewProps {
  categories: EggCategory[];
  stocks: InventoryStock[];
  rates: DailyMarketRate[];
  branchId: string;
  onRefresh: () => void;
}

export const DailyPricingView: React.FC<DailyPricingViewProps> = ({
  categories,
  stocks,
  rates,
  branchId,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const todayStr = new Date().toISOString().split('T')[0];

  const [formRates, setFormRates] = useState<Record<string, { buying: number; wholesale: number; retail: number }>>(() => {
    const map: Record<string, { buying: number; wholesale: number; retail: number }> = {};
    categories.forEach((cat) => {
      const existing = rates.find((r) => r.category_id === cat.id);
      map[cat.id] = {
        buying: existing?.buying_rate_pc || 10.0,
        wholesale: existing?.wholesale_rate_pc || 11.0,
        retail: existing?.retail_rate_pc || 12.0,
      };
    });
    return map;
  });

  useEffect(() => {
    const map: Record<string, { buying: number; wholesale: number; retail: number }> = {};
    categories.forEach((cat) => {
      const existing = rates.find((r) => r.category_id === cat.id);
      map[cat.id] = {
        buying: existing?.buying_rate_pc || 10.0,
        wholesale: existing?.wholesale_rate_pc || 11.0,
        retail: existing?.retail_rate_pc || 12.0,
      };
    });
    setFormRates(map);
  }, [rates, categories]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleRateChange = (catId: string, field: 'buying' | 'wholesale' | 'retail', val: string) => {
    const num = parseFloat(val) || 0;
    setFormRates((prev) => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [field]: num,
      },
    }));
    setSavedSuccess(false);
  };

  const handleSaveAll = () => {
    const effectiveBranchId = branchId === 'ALL' ? 'br-01' : branchId;
    const newRatesList: DailyMarketRate[] = categories.map((cat) => ({
      id: `rate-${Date.now()}-${cat.id}`,
      rate_date: todayStr,
      branch_id: effectiveBranchId,
      category_id: cat.id,
      buying_rate_pc: formRates[cat.id]?.buying || 0,
      wholesale_rate_pc: formRates[cat.id]?.wholesale || 0,
      retail_rate_pc: formRates[cat.id]?.retail || 0,
      updated_at: new Date().toISOString(),
    }));

    DimKhataStore.setDailyRates(newRatesList);
    setSavedSuccess(true);
    onRefresh();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <AppleSectionHeader
        eyebrow={t(`আজকের তারিখ: ${toBengaliNumber(todayStr)}`, `Date: ${todayStr}`)}
        title={t('ডিমের ৫টি ক্যাটাগরি ও দৈনিক বাজার দর', "5 Egg Categories & Daily Market Rates")}
        subtitle={t(
          'প্রতিদিনের কেনা, পাইকারি ও খুচরা বিক্রয় দর এখানে পরিবর্তন করলে বিক্রয় মেমোতে স্বয়ংক্রিয়ভাবে আপডেট হবে',
          'Update buying, wholesale, and retail rates here to automatically sync with the POS memo'
        )}
        actions={
          <button
            onClick={handleSaveAll}
            className="btn-primary py-2.5 px-5"
          >
            <Save className="w-4 h-4" />
            <span>{t('সকল বাজার দর সংরক্ষণ করুন', 'Save All Market Rates')}</span>
          </button>
        }
      />

      {savedSuccess && (
        <div className="p-3.5 bg-white border border-[#15803d]/30 text-[#15803d] rounded-[12px] text-[13px] font-semibold flex items-center gap-2">
          <span>{t('✓ আজকের বাজার দর সফলভাবে সংরক্ষিত হয়েছে!', "✓ Today's market rates saved and synced to Supabase!")}</span>
        </div>
      )}

      {/* Apple Notice Banner */}
      <div className="p-4 bg-white border border-[#e0e0e0] rounded-[18px] flex items-start gap-3 text-[13px] text-[#4e4e4e]">
        <Info className="w-4 h-4 text-[#0066cc] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#1d1d1f] font-semibold">{t('সহজ নির্দেশনা:', 'Tip:')}</strong>{' '}
          {t(
            'নিচে প্রতিটি ডিমের পিস প্রতি দর বসান। নিচে ১০০ পিস (শ), ১ খাঁচি এবং ১ হালির হিসাব স্বয়ংক্রিয়ভাবে দেখা যাবে।',
            'Enter per-piece rates below. 100 pcs (Sho), 1 Crate, and 1 Hali (4 pcs) rates are calculated automatically.'
          )}
        </div>
      </div>

      {/* 5 Category Cards */}
      <div className="space-y-4">
        {categories.map((cat, idx) => {
          const current = formRates[cat.id] || { buying: 0, wholesale: 0, retail: 0 };
          const stock = stocks.find((s) => s.category_id === cat.id);
          const pcs = stock?.qty_pcs || 0;
          const bdown = formatQuantityPcs(pcs, cat.pcs_per_crate);

          return (
            <div
              key={cat.id}
              className="card-apple p-5 sm:p-6 space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e0e0e0] pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center text-[14px] font-semibold">
                    {toBengaliNumber(idx + 1)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[20px] text-[#1d1d1f] tracking-[-0.015em]">
                      {getCategoryDisplayName(cat)}
                    </h3>
                    <div className="text-[12px] text-[#7a7a7a] flex items-center gap-2 flex-wrap">
                      <span>{cat.name_en}</span>
                      <span>•</span>
                      <span className="font-mono text-[#1d1d1f]">{cat.code}</span>
                      <span>•</span>
                      <span className="badge-pill text-[11px] py-0 px-2">
                        {t(
                          `১ খাঁচি = ${toBengaliNumber(cat.pcs_per_crate)} পিস`,
                          `1 Crate = ${cat.pcs_per_crate} pcs`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Badge */}
                <div className="bg-[#f5f5f7] px-4 py-2.5 rounded-[12px] border border-[#e0e0e0] flex items-center gap-4 text-xs">
                  <div>
                    <div className="text-[#7a7a7a] text-[11px]">{t('বর্তমান মজুদ', 'Current Stock')}</div>
                    <div className="font-semibold text-[17px] text-[#1d1d1f]">
                      {bdown.totalPcsBn} {t('পিস', 'pcs')}
                    </div>
                  </div>
                  <div className="border-l pl-4 border-[#e0e0e0] text-[#0066cc] font-semibold">
                    {bdown.crateBreakdown}
                  </div>
                </div>
              </div>

              {/* Rate Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* 1. Buying Rate */}
                <div className="bg-[#f5f5f7] p-3.5 rounded-[12px] border border-[#e0e0e0] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-[#1d1d1f]">
                      কেনা দর (খামার থেকে)
                    </label>
                    <span className="badge-pill text-[10px] py-0 px-2 bg-white">ক্রয়</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm text-[#7a7a7a]">৳</span>
                    <input
                      type="number"
                      step="0.05"
                      value={current.buying}
                      onChange={(e) => handleRateChange(cat.id, 'buying', e.target.value)}
                      className="input-apple w-full pl-7 text-[15px] font-semibold"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#7a7a7a] pt-0.5">
                    <span>১০০ পিস: ৳{toBengaliNumber(Math.round(current.buying * 100))}</span>
                    <span>১ খাঁচি: ৳{toBengaliNumber(Math.round(current.buying * cat.pcs_per_crate))}</span>
                  </div>
                </div>

                {/* 2. Wholesale Rate */}
                <div className="bg-[#0066cc]/5 p-3.5 rounded-[12px] border border-[#0066cc]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-[#0066cc]">
                      পাইকারি বিক্রয় দর
                    </label>
                    <span className="badge-blue text-[10px] py-0 px-2">পাইকারি</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm text-[#0066cc]">৳</span>
                    <input
                      type="number"
                      step="0.05"
                      value={current.wholesale}
                      onChange={(e) => handleRateChange(cat.id, 'wholesale', e.target.value)}
                      className="input-apple w-full pl-7 text-[15px] font-semibold"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#4e4e4e] pt-0.5">
                    <span>১০০ পিস: ৳{toBengaliNumber(Math.round(current.wholesale * 100))}</span>
                    <span>১ খাঁচি: ৳{toBengaliNumber(Math.round(current.wholesale * cat.pcs_per_crate))}</span>
                  </div>
                </div>

                {/* 3. Retail Rate */}
                <div className="bg-[#f5f5f7] p-3.5 rounded-[12px] border border-[#e0e0e0] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-[#1d1d1f]">
                      খুচরা বিক্রয় দর
                    </label>
                    <span className="badge-pill text-[10px] py-0 px-2 bg-white">খুচরা</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm text-[#7a7a7a]">৳</span>
                    <input
                      type="number"
                      step="0.05"
                      value={current.retail}
                      onChange={(e) => handleRateChange(cat.id, 'retail', e.target.value)}
                      className="input-apple w-full pl-7 text-[15px] font-semibold"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#7a7a7a] pt-0.5">
                    <span>১ হালি: ৳{toBengaliNumber((current.retail * 4).toFixed(1))}</span>
                    <span>১ ডজন: ৳{toBengaliNumber(Math.round(current.retail * 12))}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
