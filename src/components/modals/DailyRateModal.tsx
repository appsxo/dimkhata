// ====================================================================
// DIMKHATA (ডিমখাতা) — Daily Market Rates Modal (Apple Design System)
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white rounded-t-[20px] sm:rounded-[18px] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#e0e0e0]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f5f5f7] border-b border-[#e0e0e0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[20px] text-[#1d1d1f] leading-tight">
                আজকের বাজার দর আপডেট ({toBengaliNumber(todayStr)})
              </h3>
              <p className="text-[12px] text-[#7a7a7a]">
                ৫টি ক্যাটাগরির দৈনিক কেনা, পাইকারি ও খুচরা দর নির্ধারণ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon-circle text-[#1d1d1f]"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 divide-y divide-[#e0e0e0]">
          {categories.map((cat) => {
            const current = rates[cat.id] || { buying: 0, wholesale: 0, retail: 0 };
            return (
              <div key={cat.id} className="pt-4 first:pt-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[18px] text-[#1d1d1f]">
                      {cat.name_bn}
                    </span>
                    <span className="text-[12px] text-[#7a7a7a]">({cat.name_en})</span>
                  </div>
                  <span className="badge-blue text-[10px] py-0 px-2">
                    ১ খাঁচি = {toBengaliNumber(cat.pcs_per_crate)} পিস
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Buying Rate */}
                  <div className="bg-[#f5f5f7] p-3 rounded-[12px] border border-[#e0e0e0]">
                    <label className="block text-[11px] font-semibold text-[#4e4e4e] mb-1">
                      কেনা দর (পিস)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                      <input
                        type="number"
                        step="0.05"
                        value={current.buying}
                        onChange={(e) => handleRateChange(cat.id, 'buying', e.target.value)}
                        className="input-apple w-full pl-6 text-[14px] font-semibold"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-[#7a7a7a]">
                      ১০০ পিস: ৳{toBengaliNumber(Math.round(current.buying * 100))}
                    </div>
                  </div>

                  {/* Wholesale Rate */}
                  <div className="bg-[#0066cc]/5 p-3 rounded-[12px] border border-[#0066cc]/30">
                    <label className="block text-[11px] font-semibold text-[#0066cc] mb-1">
                      পাইকারি দর (পিস)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-3 text-xs text-[#0066cc]">৳</span>
                      <input
                        type="number"
                        step="0.05"
                        value={current.wholesale}
                        onChange={(e) => handleRateChange(cat.id, 'wholesale', e.target.value)}
                        className="input-apple w-full pl-6 text-[14px] font-semibold"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-[#4e4e4e]">
                      ১ খাঁচি: ৳{toBengaliNumber(Math.round(current.wholesale * cat.pcs_per_crate))}
                    </div>
                  </div>

                  {/* Retail Rate */}
                  <div className="bg-[#f5f5f7] p-3 rounded-[12px] border border-[#e0e0e0]">
                    <label className="block text-[11px] font-semibold text-[#4e4e4e] mb-1">
                      খুচরা দর (পিস)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                      <input
                        type="number"
                        step="0.05"
                        value={current.retail}
                        onChange={(e) => handleRateChange(cat.id, 'retail', e.target.value)}
                        className="input-apple w-full pl-6 text-[14px] font-semibold"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-[#7a7a7a]">
                      ১ হালি: ৳{toBengaliNumber((current.retail * 4).toFixed(1))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f5f5f7] border-t border-[#e0e0e0] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="btn-outline text-[13px] px-4"
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            className="btn-primary text-[13px] px-5"
          >
            <Save className="w-4 h-4" />
            <span>বাজার দর সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
