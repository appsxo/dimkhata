import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
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

  const buildRateMap = () => {
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
  };

  const [formRates, setFormRates] = useState(buildRateMap);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormRates(buildRateMap());
  }, [rates, categories]);

  const handleRateChange = (catId: string, field: 'buying' | 'wholesale' | 'retail', val: string) => {
    const num = parseFloat(val) || 0;
    setFormRates((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], [field]: num },
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
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-4">
      <AppleSectionHeader
        title={t('ডিমের ৫টি ক্যাটাগরি ও দৈনিক বাজার দর', '5 Egg Categories & Daily Market Rates')}
        subtitle={t(
          `তারিখ: ${toBengaliNumber(todayStr)} • পিস প্রতি কেনা, পাইকারি ও খুচরা দর`,
          `Date: ${todayStr} • Per-piece buying, wholesale & retail rates`
        )}
        actions={
          <button type="button" onClick={handleSaveAll} className="btn-primary py-2 px-4 text-[13.5px]">
            <Save className="w-4 h-4" />
            <span>{t('বাজার দর সংরক্ষণ করুন', 'Save Market Rates')}</span>
          </button>
        }
      />

      {savedSuccess && (
        <div className="p-3 bg-white border border-[#15803d]/30 text-[#15803d] rounded-[12px] text-[13px] font-semibold">
          {t('✓ আজকের বাজার দর সংরক্ষিত হয়েছে!', "✓ Today's market rates saved!")}
        </div>
      )}

      <div className="space-y-3">
        {categories.map((cat, idx) => {
          const current = formRates[cat.id] || { buying: 0, wholesale: 0, retail: 0 };
          const stock = stocks.find((s) => s.category_id === cat.id);
          const pcs = stock?.qty_pcs || 0;
          const bdown = formatQuantityPcs(pcs, cat.pcs_per_crate);

          return (
            <div key={cat.id} className="card-apple p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#e0e0e0] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center text-[13px] font-semibold">
                    {toBengaliNumber(idx + 1)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[17px] text-[#1d1d1f]">
                      {getCategoryDisplayName(cat)}
                    </h3>
                    <div className="text-[11.5px] text-[#7a7a7a] flex items-center gap-2">
                      <span className="font-mono">{cat.code}</span>
                      <span>•</span>
                      <span>
                        {t(
                          `১ খাঁচি = ${toBengaliNumber(cat.pcs_per_crate)} পিস`,
                          `1 Crate = ${cat.pcs_per_crate} pcs`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f5f5f7] px-3.5 py-2 rounded-[10px] border border-[#e0e0e0] flex items-center gap-3 text-xs">
                  <div>
                    <span className="text-[#7a7a7a]">{t('মজুদ:', 'Stock:')} </span>
                    <strong className="text-[#1d1d1f] text-[14px]">
                      {bdown.totalPcsBn} {t('পিস', 'pcs')}
                    </strong>
                  </div>
                  <div className="border-l pl-3 border-[#e0e0e0] text-[#0066cc] font-semibold">
                    {bdown.crateBreakdown}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#f5f5f7] p-3 rounded-[12px] border border-[#e0e0e0] space-y-1.5">
                  <label className="block text-[12px] font-semibold text-[#1d1d1f]">
                    {t('কেনা দর (খামার)', 'Buying Rate (Farm)')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-[#7a7a7a]">৳</span>
                    <input
                      type="number"
                      step="0.05"
                      value={current.buying}
                      onChange={(e) => handleRateChange(cat.id, 'buying', e.target.value)}
                      className="input-apple w-full pl-7 text-[15px] font-semibold"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#7a7a7a]">
                    <span>{t('১০০ পিস:', '100 pcs:')} ৳{toBengaliNumber(Math.round(current.buying * 100))}</span>
                    <span>{t('১ খাঁচি:', '1 Crate:')} ৳{toBengaliNumber(Math.round(current.buying * cat.pcs_per_crate))}</span>
                  </div>
                </div>

                <div className="bg-[#0066cc]/5 p-3 rounded-[12px] border border-[#0066cc]/30 space-y-1.5">
                  <label className="block text-[12px] font-semibold text-[#0066cc]">
                    {t('পাইকারি বিক্রয় দর', 'Wholesale Rate')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-[#0066cc]">৳</span>
                    <input
                      type="number"
                      step="0.05"
                      value={current.wholesale}
                      onChange={(e) => handleRateChange(cat.id, 'wholesale', e.target.value)}
                      className="input-apple w-full pl-7 text-[15px] font-semibold"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#4e4e4e]">
                    <span>{t('১০০ পিস:', '100 pcs:')} ৳{toBengaliNumber(Math.round(current.wholesale * 100))}</span>
                    <span>{t('১ খাঁচি:', '1 Crate:')} ৳{toBengaliNumber(Math.round(current.wholesale * cat.pcs_per_crate))}</span>
                  </div>
                </div>

                <div className="bg-[#f5f5f7] p-3 rounded-[12px] border border-[#e0e0e0] space-y-1.5">
                  <label className="block text-[12px] font-semibold text-[#1d1d1f]">
                    {t('খুচরা বিক্রয় দর', 'Retail Rate')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-[#7a7a7a]">৳</span>
                    <input
                      type="number"
                      step="0.05"
                      value={current.retail}
                      onChange={(e) => handleRateChange(cat.id, 'retail', e.target.value)}
                      className="input-apple w-full pl-7 text-[15px] font-semibold"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#7a7a7a]">
                    <span>{t('১ হালি:', '1 Hali:')} ৳{toBengaliNumber((current.retail * 4).toFixed(1))}</span>
                    <span>{t('১ ডজন:', '1 Dozen:')} ৳{toBengaliNumber(Math.round(current.retail * 12))}</span>
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
