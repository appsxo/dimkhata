// ====================================================================
// DIMKHATA (ডিমখাতা) — Daily Market Rates Update Modal (Req 6)
// ====================================================================

import React, { useState } from 'react';
import { X, Save, TrendingUp, Sparkles } from 'lucide-react';
import { DimKhataStore } from '../../lib/storage-store';
import { DailyMarketRate, EggCategory } from '../../types';
import { toBengaliNumber } from '../../lib/egg-units';

interface DailyRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: EggCategory[];
  branchId: string;
  onSaved: () => void;
}

export const DailyRateModal: React.FC<DailyRateModalProps> = ({
  isOpen,
  onClose,
  categories,
  branchId,
  onSaved,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const existingRates = DimKhataStore.getDailyRates(todayStr);

  // Initialize draft rates
  const [rates, setRates] = useState<Record<string, { buying: number; wholesale: number; retail: number }>>(() => {
    const initial: Record<string, { buying: number; wholesale: number; retail: number }> = {};
    categories.forEach((cat) => {
      const found = existingRates.find((r) => r.category_id === cat.id);
      initial[cat.id] = {
        buying: found?.buying_rate_pc || 10.0,
        wholesale: found?.wholesale_rate_pc || 11.0,
        retail: found?.retail_rate_pc || 12.0,
      };
    });
    return initial;
  });

  const handleRateChange = (catId: string, field: 'buying' | 'wholesale' | 'retail', val: string) => {
    const num = parseFloat(val) || 0;
    setRates((prev) => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [field]: num,
      },
    }));
  };

  const handleSave = () => {
    const effectiveBranchId = branchId === 'ALL' ? 'br-01' : branchId;
    const newRatesList: DailyMarketRate[] = categories.map((cat) => ({
      id: `rate-${Date.now()}-${cat.id}`,
      rate_date: todayStr,
      branch_id: effectiveBranchId,
      category_id: cat.id,
      buying_rate_pc: rates[cat.id]?.buying || 0,
      wholesale_rate_pc: rates[cat.id]?.wholesale || 0,
      retail_rate_pc: rates[cat.id]?.retail || 0,
      updated_at: new Date().toISOString(),
    }));

    DimKhataStore.setDailyRates(newRatesList);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                আজকের ডিমের বাজার দর আপডেট ({toBengaliNumber(todayStr)})
              </h3>
              <p className="text-xs text-amber-100">
                ৫টি ক্যাটাগরির দৈনিক কেনা ও বিক্রয় দর নির্ধারণ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 divide-y divide-slate-100">
          {categories.map((cat) => {
            const current = rates[cat.id] || { buying: 0, wholesale: 0, retail: 0 };
            return (
              <div key={cat.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: cat.color_hex }}
                    />
                    <span className="font-bold text-slate-800 text-sm">
                      {cat.name_bn}
                    </span>
                    <span className="text-xs text-slate-400">({cat.name_en})</span>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-medium border border-amber-200">
                    প্রতি খাঁচি: {toBengaliNumber(cat.pcs_per_crate)} পিস
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Buying Rate */}
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      কেনা দর (প্রতি পিস)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">৳</span>
                      <input
                        type="number"
                        step="0.05"
                        value={current.buying}
                        onChange={(e) => handleRateChange(cat.id, 'buying', e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      ১০০ পিস: ৳{toBengaliNumber(Math.round(current.buying * 100))}
                    </div>
                  </div>

                  {/* Wholesale Rate */}
                  <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-200">
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      পাইকারি দর (পিস)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-amber-500">৳</span>
                      <input
                        type="number"
                        step="0.05"
                        value={current.wholesale}
                        onChange={(e) => handleRateChange(cat.id, 'wholesale', e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-white border border-amber-300 rounded-lg text-sm font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-amber-700">
                      ১ খাঁচি: ৳{toBengaliNumber(Math.round(current.wholesale * cat.pcs_per_crate))}
                    </div>
                  </div>

                  {/* Retail Rate */}
                  <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      খুচরা দর (পিস)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-emerald-500">৳</span>
                      <input
                        type="number"
                        step="0.05"
                        value={current.retail}
                        onChange={(e) => handleRateChange(cat.id, 'retail', e.target.value)}
                        className="w-full pl-6 pr-2 py-1 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-emerald-700">
                      ১ হালি (৪): ৳{toBengaliNumber((current.retail * 4).toFixed(1))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>বাজার দর সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
