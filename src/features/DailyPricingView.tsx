// ====================================================================
// DIMKHATA (ডিমখাতা) — Daily Market Rates & 5 Product Categories (Req 6)
// ====================================================================

import React, { useState } from 'react';
import { Tag, Sparkles, Save, Info, RefreshCw } from 'lucide-react';
import { EggCategory, DailyMarketRate, InventoryStock } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatQuantityPcs, formatTaka, toBengaliNumber } from '../lib/egg-units';

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-600" />
            <span>ডিমের ক্যাটাগরি ও দৈনিক বাজার দর</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            আজকের তারিখ: <strong>{toBengaliNumber(todayStr)}</strong> | প্রতিদিনের কেনা, পাইকারি ও খুচরা রেট আপডেট করুন
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>সকল বাজার দর সংরক্ষণ করুন</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span>✓ আজকের বাজার দর সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!</span>
        </div>
      )}

      {/* Notice Banner */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">দর ও হিসাবের নিয়মাবলী:</span> বিক্রয় মেমো (POS) তৈরির সময় কাস্টমার টাইপ (পাইকারি/খুচরা) অনুযায়ী এই রেট স্বয়ংক্রিয়ভাবে ইনভয়েসে বসবে। স্টাফরা চাইলে মেমো তৈরির সময় বিশেষ ছাড়ে দর কমাতে পারবে।
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
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-amber-400 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-inner"
                    style={{ backgroundColor: cat.color_hex }}
                  >
                    {toBengaliNumber(idx + 1)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {cat.name_bn}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{cat.name_en}</span>
                      <span>•</span>
                      <span className="font-mono">{cat.code}</span>
                      <span>•</span>
                      <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.2 rounded border border-amber-200">
                        ১ খাঁচি = {toBengaliNumber(cat.pcs_per_crate)} পিস
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Badge */}
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3 text-xs">
                  <div>
                    <div className="text-slate-400 font-medium">মজুদ ডিম</div>
                    <div className="font-black text-slate-900 text-sm">
                      {bdown.totalPcsBn} পিস
                    </div>
                  </div>
                  <div className="border-l pl-3 border-slate-200 text-amber-800 font-bold">
                    {bdown.crateBreakdown}
                  </div>
                </div>
              </div>

              {/* Rate Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                {/* 1. Buying Rate */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      কেনা দর (খামার থেকে)
                    </label>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                      ক্রয় মূল্য
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      step="0.05"
                      value={current.buying}
                      onChange={(e) => handleRateChange(cat.id, 'buying', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-black text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>১০০ পিস (১ শ): ৳{toBengaliNumber(Math.round(current.buying * 100))}</span>
                    <span>১ খাঁচি: ৳{toBengaliNumber(Math.round(current.buying * cat.pcs_per_crate))}</span>
                  </div>
                </div>

                {/* 2. Wholesale Rate */}
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900">
                      পাইকারি বিক্রয় দর
                    </label>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-semibold">
                      পাইকারি
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-amber-500 font-bold">৳</span>
                    <input
                      type="number"
                      step="0.05"
                      value={current.wholesale}
                      onChange={(e) => handleRateChange(cat.id, 'wholesale', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm font-black text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-amber-800 pt-1">
                    <span>১০০ পিস: ৳{toBengaliNumber(Math.round(current.wholesale * 100))}</span>
                    <span>১ খাঁচি: ৳{toBengaliNumber(Math.round(current.wholesale * cat.pcs_per_crate))}</span>
                  </div>
                </div>

                {/* 3. Retail Rate */}
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-900">
                      খুচরা বিক্রয় দর
                    </label>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">
                      খুচরা
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-emerald-500 font-bold">৳</span>
                    <input
                      type="number"
                      step="0.05"
                      value={current.retail}
                      onChange={(e) => handleRateChange(cat.id, 'retail', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm font-black text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-800 pt-1">
                    <span>১ হালি (৪ পিস): ৳{toBengaliNumber((current.retail * 4).toFixed(1))}</span>
                    <span>১ ডজন (১২ পিস): ৳{toBengaliNumber(Math.round(current.retail * 12))}</span>
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
