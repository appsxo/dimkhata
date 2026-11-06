// ====================================================================
// DIMKHATA (ডিমখাতা) — Daily Market Rates Modal (ElevenLabs Design)
// ====================================================================

import React, { useState } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#e7e5e4] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#fafafa] border-b border-[#e7e5e4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#f0efed] border border-[#e7e5e4] flex items-center justify-center text-sm">
              <Sparkles className="w-4 h-4 text-[#292524]" />
            </div>
            <div>
              <h3 className="font-serif font-light text-2xl text-[#0c0a09] leading-tight">
                আজকের বাজার দর আপডেট ({toBengaliNumber(todayStr)})
              </h3>
              <p className="text-xs text-[#777169]">
                ৫টি ক্যাটাগরির দৈনিক কেনা, পাইকারি ও খুচরা দর নির্ধারণ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#777169] hover:text-[#0c0a09] hover:bg-[#f0efed] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 divide-y divide-[#f0efed]">
          {categories.map((cat) => {
            const current = rates[cat.id] || { buying: 0, wholesale: 0, retail: 0 };
            return (
              <div key={cat.id} className="pt-4 first:pt-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-light text-xl text-[#0c0a09]">
                      {cat.name_bn}
                    </span>
                    <span className="text-xs text-[#777169]">({cat.name_en})</span>
                  </div>
                  <span className="badge-pill text-[10px] py-0 px-2">
                    ১ খাঁচি = {toBengaliNumber(cat.pcs_per_crate)} পিস
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Buying Rate */}
                  <div className="bg-[#fafafa] p-3 rounded-xl border border-[#e7e5e4]">
                    <label className="block text-[11px] font-medium text-[#777169] mb-1">
                      কেনা দর (পিস)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs text-[#777169]">৳</span>
                      <input
                        type="number"
                        step="0.05"
                        value={current.buying}
                        onChange={(e) => handleRateChange(cat.id, 'buying', e.target.value)}
                        className="input-editorial w-full pl-6 text-sm font-semibold"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-[#777169]">
                      ১০০ পিস: ৳{toBengaliNumber(Math.round(current.buying * 100))}
                    </div>
                  </div>

                  {/* Wholesale Rate */}
                  <div className="bg-[#fafafa] p-3 rounded-xl border border-[#e7e5e4]">
                    <label className="block text-[11px] font-medium text-[#0c0a09] mb-1">
                      পাইকারি দর (পিস)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs text-[#777169]">৳</span>
                      <input
                        type="number"
                        step="0.05"
                        value={current.wholesale}
                        onChange={(e) => handleRateChange(cat.id, 'wholesale', e.target.value)}
                        className="input-editorial w-full pl-6 text-sm font-semibold"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-[#777169]">
                      ১ খাঁচি: ৳{toBengaliNumber(Math.round(current.wholesale * cat.pcs_per_crate))}
                    </div>
                  </div>

                  {/* Retail Rate */}
                  <div className="bg-[#fafafa] p-3 rounded-xl border border-[#e7e5e4]">
                    <label className="block text-[11px] font-medium text-[#777169] mb-1">
                      খুচরা দর (পিস)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs text-[#777169]">৳</span>
                      <input
                        type="number"
                        step="0.05"
                        value={current.retail}
                        onChange={(e) => handleRateChange(cat.id, 'retail', e.target.value)}
                        className="input-editorial w-full pl-6 text-sm font-semibold"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-[#777169]">
                      ১ হালি: ৳{toBengaliNumber((current.retail * 4).toFixed(1))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#fafafa] border-t border-[#e7e5e4] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="btn-outline text-xs h-9 px-4"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            className="btn-primary text-xs h-9 px-5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>বাজার দর সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
