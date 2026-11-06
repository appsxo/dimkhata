// ====================================================================
// DIMKHATA (ডিমখাতা) — Monthly Net P&L & 2:1 Partner Distribution (Req 13, 14)
// ====================================================================

import React, { useState } from 'react';
import {
  PieChart,
  DollarSign,
  TrendingUp,
  Settings,
  Printer,
  MinusCircle,
  PlusCircle,
  HelpCircle,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Partner, PartnerDrawing, FinancialAccount } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';

interface ProfitSettlementViewProps {
  partners: Partner[];
  drawings: PartnerDrawing[];
  accounts: FinancialAccount[];
  onRefresh: () => void;
}

export const ProfitSettlementView: React.FC<ProfitSettlementViewProps> = ({
  partners,
  drawings,
  accounts,
  onRefresh,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // e.g. '2026-11'

  // Drawing Modal
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [drawPartnerId, setDrawPartnerId] = useState(partners[0]?.id || '');
  const [drawAmount, setDrawAmount] = useState<number>(10000);
  const [drawAccountId, setDrawAccountId] = useState(accounts[0]?.id || '');
  const [drawNotes, setDrawNotes] = useState('');

  // Ratio Editor Modal
  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [sharifWeight, setSharifWeight] = useState(partners.find((p) => p.name.includes('শরিফ'))?.share_weight || 2.0);
  const [emanWeight, setEmanWeight] = useState(partners.find((p) => p.name.includes('ইমান'))?.share_weight || 1.0);

  // 1-Click Monthly Net Profit Calculation Engine
  const settlement = DimKhataStore.calculateMonthlySettlement(selectedMonth);

  const handleRecordDrawing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawPartnerId || drawAmount <= 0) return;

    const newDrawing: PartnerDrawing = {
      id: `draw-${Date.now()}`,
      partner_id: drawPartnerId,
      drawing_date: new Date().toISOString().split('T')[0],
      amount: drawAmount,
      account_id: drawAccountId,
      notes: drawNotes || 'মালিকের ব্যক্তিগত উত্তোলন',
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordPartnerDrawing(newDrawing, 'br-01');
    alert('ব্যক্তিগত উত্তোলন সফলভাবে সংরক্ষিত হয়েছে ও ক্যাশ বুক থেকে কর্তন হয়েছে!');
    setIsDrawingOpen(false);
    onRefresh();
  };

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    const sharif = partners.find((p) => p.name.includes('শরিফ'));
    const eman = partners.find((p) => p.name.includes('ইমান'));

    if (sharif) DimKhataStore.updatePartnerWeight(sharif.id, Number(sharifWeight) || 2);
    if (eman) DimKhataStore.updatePartnerWeight(eman.id, Number(emanWeight) || 1);

    alert('লভ্যাংশ বণ্টনের অনুপাত সফলভাবে আপডেট হয়েছে!');
    setIsRatioOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-700" />
            <span>মাস শেষে লাভ-লোকসান ও ২:১ লভ্যাংশ বণ্টন (Req 13, 14)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ১-ক্লিকে মোট আয়, ল্যান্ডেড কস্ট, পরিচালনা খরচ, ওয়েস্টেজ বাদ দিয়ে শরিফ (৬৬.৬৭%) ও ইমান (৩৩.৩৩%) এর নিট পাওনা
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs"
          />

          <button
            onClick={() => setIsDrawingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs transition"
          >
            <MinusCircle className="w-4 h-4 text-amber-700" />
            <span>ব্যক্তিগত উত্তোলন</span>
          </button>

          <button
            onClick={() => setIsRatioOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>অনুপাত কনফিগার</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">রিপোর্ট প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* 1-Click Monthly Net Profit Statement (Req 13) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4 print-card">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-black text-lg text-slate-900">
              মাসিক লাভ-লোকসান বিবরণী (Monthly Income Statement)
            </h3>
            <p className="text-xs text-slate-500">
              হিসাবের মাস: <strong>{toBengaliNumber(selectedMonth)}</strong> | শরিফ এন্ড ইমান এন্টারপ্রাইজ
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">প্রকৃত নিট লাভ / লোকসান</span>
            <div
              className={`text-2xl font-black ${
                settlement.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatTaka(settlement.netProfit)}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Lines */}
        <div className="space-y-2 text-xs divide-y divide-slate-100">
          <div className="flex justify-between py-1.5">
            <span className="font-bold text-slate-800">১. মোট ডিম বিক্রয় আয় (Gross Sales Revenue):</span>
            <span className="font-bold text-slate-900">{formatTaka(settlement.totalSalesRevenue)}</span>
          </div>

          <div className="flex justify-between py-1.5 text-slate-600">
            <span>২. বিক্রিত ডিমের ল্যান্ডেড কস্ট (Cost of Goods Sold - COGS):</span>
            <span className="text-rose-700 font-semibold">- {formatTaka(settlement.totalCogs)}</span>
          </div>

          <div className="flex justify-between py-2 text-sm font-bold bg-amber-50/60 px-3 rounded-lg border border-amber-200">
            <span>মোট বাণিজ্যিক লাভ (Gross Trading Profit):</span>
            <span className="text-amber-900">{formatTaka(settlement.grossProfit)}</span>
          </div>

          <div className="flex justify-between py-1.5 text-slate-600">
            <span>৩. মোট পরিচালনা খরচ (দোকান ভাড়া, বিদ্যুৎ, আপ্যায়ন, মেরামত ইত্যাদি):</span>
            <span className="text-rose-700 font-semibold">- {formatTaka(settlement.totalOperatingExpenses)}</span>
          </div>

          <div className="flex justify-between py-1.5 text-slate-600">
            <span>৪. কর্মচারীদের বেতন বাবদ খরচ (Monthly Net Payroll):</span>
            <span className="text-rose-700 font-semibold">- {formatTaka(settlement.totalSalaries)}</span>
          </div>

          <div className="flex justify-between py-1.5 text-slate-600">
            <span>৫. ভাঙা ও গরমে পচা ডিমের আর্থিক ক্ষতি (Wastage / Expiry Loss):</span>
            <span className="text-rose-700 font-semibold">- {formatTaka(settlement.totalWastageLoss)}</span>
          </div>

          <div className="flex justify-between py-1.5 text-slate-600">
            <span>৬. সৌজন্যে / গিফটে দেওয়া ডিমের আর্থিক খরচ (Courtesy Stock Loss):</span>
            <span className="text-rose-700 font-semibold">- {formatTaka(settlement.totalCourtesyLoss)}</span>
          </div>

          <div
            className={`flex justify-between py-3 px-3 rounded-xl border text-base font-black ${
              settlement.netProfit >= 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <span>মাসের প্রকৃত নীট লাভ / লোকসান (Net Profit):</span>
            <span className="text-xl">{formatTaka(settlement.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* 2:1 Partner Distribution Cards (Req 14) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span>👑 ২:১ রেশিও অনুযায়ী মালিকদের লভ্যাংশ বণ্টন (Partner Distribution)</span>
            <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
              কনফিগারযোগ্য
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settlement.distributions.map((dist) => {
            const isSharif = dist.partnerName.includes('শরিফ');
            return (
              <div
                key={dist.partnerId}
                className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-md space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      {isSharif ? 'মালিক ১ (২ অংশ)' : 'মালিক ২ (১ অংশ)'}
                    </span>
                    <h4 className="text-lg font-black text-slate-900 mt-1">
                      {dist.partnerName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      লভ্যাংশ অনুপাত: <strong>{toBengaliNumber(dist.percentage)}%</strong> (শেয়ার ওয়েট: {toBengaliNumber(dist.shareWeight)})
                    </p>
                  </div>

                  <div className="text-3xl">
                    {isSharif ? '👑' : '💼'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>মোট প্রাপ্য অংশ ({dist.percentage}%):</span>
                    <span className="font-bold text-slate-900">{formatTaka(dist.grossShare)}</span>
                  </div>

                  <div className="flex justify-between text-rose-700">
                    <span>চলতি মাসে ব্যক্তিগত উত্তোলন (Drawings):</span>
                    <span className="font-bold">- {formatTaka(dist.drawingsDeducted)}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                    <span>অবশিষ্ট নীট পাওনা / উত্তোলনযোগ্য:</span>
                    <span
                      className={`text-base font-black ${
                        dist.netPayable >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatTaka(dist.netPayable)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  * ব্যক্তিগত প্রয়োজনে তোলা টাকা মাস শেষে তার প্রাপ্য লভ্যাংশ থেকে সমন্বয় করা হয়েছে।
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Partner Drawings History */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h4 className="font-bold text-xs text-slate-800">
          চলতি মাসের মালিকদের ব্যক্তিগত উত্তোলন হিস্ট্রি (Personal Drawings)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50">
                <th className="py-2.5 px-3">তারিখ</th>
                <th className="py-2.5 px-3">মালিকের নাম</th>
                <th className="py-2.5 px-3">টাকার পরিমাণ</th>
                <th className="py-2.5 px-3">উৎস একাউন্ট</th>
                <th className="py-2.5 px-3">বিবরণ / কারণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drawings.filter((d) => d.drawing_date.startsWith(selectedMonth)).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    চলতি মাসে কোনো ব্যক্তিগত উত্তোলন নেই।
                  </td>
                </tr>
              ) : (
                drawings
                  .filter((d) => d.drawing_date.startsWith(selectedMonth))
                  .map((draw) => {
                    const p = partners.find((pt) => pt.id === draw.partner_id);
                    const acc = accounts.find((a) => a.id === draw.account_id);
                    return (
                      <tr key={draw.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 text-slate-500">
                          {toBengaliNumber(draw.drawing_date)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {p?.name}
                        </td>
                        <td className="py-2.5 px-3 font-black text-rose-700">
                          {formatTaka(draw.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {acc?.name || 'ক্যাশ'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {draw.notes || 'ব্যক্তিগত উত্তোলন'}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD DRAWING MODAL */}
      {isDrawingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              মালিকের ব্যক্তিগত উত্তোলন (Personal Drawing)
            </h3>
            <p className="text-xs text-slate-500">
              মাস শেষে এই টাকা মালিকের নিট লভ্যাংশ থেকে কর্তন করা হবে
            </p>

            <form onSubmit={handleRecordDrawing} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কোন মালিক টাকা তুলছেন?
                </label>
                <select
                  value={drawPartnerId}
                  onChange={(e) => setDrawPartnerId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  required
                  value={drawAmount}
                  onChange={(e) => setDrawAmount(Number(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-rose-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  উৎস একাউন্ট (যেখান থেকে টাকা দেওয়া হচ্ছে)
                </label>
                <select
                  value={drawAccountId}
                  onChange={(e) => setDrawAccountId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatTaka(a.current_balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মন্তব্য / কারণ
                </label>
                <input
                  type="text"
                  placeholder="উদা: ব্যক্তিগত পারিবারিক খরচ"
                  value={drawNotes}
                  onChange={(e) => setDrawNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDrawingOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
                >
                  উত্তোলন সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RATIO CONFIGURATION MODAL */}
      {isRatioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              মালিকদের লভ্যাংশ অনুপাত কনফিগার
            </h3>
            <p className="text-xs text-slate-500">
              ডিফল্ট অনুপাত ২:১ (শরিফ ২ ভাগ ও ইমান ১ ভাগ)। প্রয়োজনে অনুপাত পরিবর্তন করতে পারেন।
            </p>

            <form onSubmit={handleSaveWeights} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শরিফ (Sharif) এর অনুপাত ভাগ
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={sharifWeight}
                  onChange={(e) => setSharifWeight(Number(e.target.value) || 1)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ইমান (Eman) এর অনুপাত ভাগ
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={emanWeight}
                  onChange={(e) => setEmanWeight(Number(e.target.value) || 1)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 space-y-1">
                <div>নতুন শতকরা হার:</div>
                <div className="font-bold">
                  শরিফ: {((sharifWeight / (sharifWeight + emanWeight)) * 100).toFixed(1)}% | ইমান: {((emanWeight / (sharifWeight + emanWeight)) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRatioOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs"
                >
                  অনুপাত সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
