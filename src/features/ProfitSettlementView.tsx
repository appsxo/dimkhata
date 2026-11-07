// ====================================================================
// DIMKHATA (ডিমখাতা) — Monthly Net P&L & 2:1 Profit Split (Apple Design)
// ====================================================================

import React, { useState } from 'react';
import {
  Settings,
  Printer,
  MinusCircle,
} from 'lucide-react';
import { Partner, PartnerDrawing, FinancialAccount } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { useLanguage } from '../lib/i18n';
import { AppleSectionHeader, AppleModal } from '../components/ui/AppleUI';

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
  const { t } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [drawPartnerId, setDrawPartnerId] = useState(partners[0]?.id || '');
  const [drawAmount, setDrawAmount] = useState<number>(10000);
  const [drawAccountId, setDrawAccountId] = useState(accounts[0]?.id || '');
  const [drawNotes, setDrawNotes] = useState('');

  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [sharifWeight, setSharifWeight] = useState(partners.find((p) => p.name.includes('শরিফ'))?.share_weight || 2.0);
  const [emanWeight, setEmanWeight] = useState(partners.find((p) => p.name.includes('ইমান'))?.share_weight || 1.0);

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
      notes: drawNotes || t('মালিকের ব্যক্তিগত উত্তোলন', 'Partner Drawing'),
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordPartnerDrawing(newDrawing, 'br-01');
    alert(t('ব্যক্তিগত উত্তোলন সফলভাবে সংরক্ষিত হয়েছে ও ক্যাশ বুক থেকে কর্তন হয়েছে!', 'Partner drawing saved and deducted from Cashbook!'));
    setIsDrawingOpen(false);
    onRefresh();
  };

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    const sharif = partners.find((p) => p.name.includes('শরিফ'));
    const eman = partners.find((p) => p.name.includes('ইমান'));

    if (sharif) DimKhataStore.updatePartnerWeight(sharif.id, Number(sharifWeight) || 2);
    if (eman) DimKhataStore.updatePartnerWeight(eman.id, Number(emanWeight) || 1);

    alert(t('লভ্যাংশ বণ্টনের অনুপাত সফলভাবে আপডেট হয়েছে!', 'Profit distribution ratio updated!'));
    setIsRatioOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <AppleSectionHeader
        eyebrow={t('১-ক্লিক অটোমেটিক লাভ-লোকসান', '1-Click Automated Profit & Loss')}
        title={t('মাস শেষে নিট লাভ ও ২:১ লভ্যাংশ বণ্টন', 'Monthly Net Profit & 2:1 Partner Split')}
        subtitle={t(
          'মোট আয় থেকে ল্যান্ডেড কস্ট, বেতন, দোকান খরচ, ওয়েস্টেজ বাদ দিয়ে শরিফ (৬৬.৬৭%) ও ইমান (৩৩.৩৩%) এর নিট পাওনা',
          'Deducts COGS, salaries, shop expenses & wastage from revenue and splits net profit 2:1 between Sharif (66.67%) & Eman (33.33%)'
        )}
        actions={
          <>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-apple text-[13px] py-1.5"
            />

            <button
              onClick={() => setIsDrawingOpen(true)}
              className="btn-outline text-[13px] px-3.5"
            >
              <MinusCircle className="w-4 h-4" />
              <span>{t('ব্যক্তিগত উত্তোলন', 'Partner Drawing')}</span>
            </button>

            <button
              onClick={() => setIsRatioOpen(true)}
              className="btn-outline text-[13px] px-3.5"
            >
              <Settings className="w-4 h-4" />
              <span>{t('অনুপাত কনফিগার', 'Ratio Config')}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="btn-primary text-[13px] px-4"
            >
              <Printer className="w-4 h-4" />
              <span>{t('রিপোর্ট প্রিন্ট', 'Print Report')}</span>
            </button>
          </>
        }
      />

      {/* 1-Click Monthly Net Profit Statement */}
      <div className="card-apple p-5 sm:p-6 space-y-4 print-card">
        <div className="border-b border-[#e0e0e0] pb-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-semibold text-[22px] text-[#1d1d1f]">
              {t('মাসিক লাভ-লোকসান বিবরণী (Monthly Income Statement)', 'Monthly Income Statement (P&L)')}
            </h3>
            <p className="text-[12px] text-[#7a7a7a]">
              {t('হিসাবের মাস:', 'Settlement Month:')} <strong>{toBengaliNumber(selectedMonth)}</strong> | {t('শরিফ এন্ড ইমান এন্টারপ্রাইজ', 'Sharif & Eman Enterprise')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#7a7a7a] uppercase tracking-wider">{t('প্রকৃত নিট লাভ / লোকসান', 'Net Profit / Loss')}</span>
            <div
              className={`font-semibold text-[28px] mt-0.5 ${
                settlement.netProfit >= 0 ? 'text-[#0066cc]' : 'text-[#d92916]'
              }`}
            >
              {formatTaka(settlement.netProfit)}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Lines */}
        <div className="space-y-2 text-[13px] divide-y divide-[#e0e0e0]">
          <div className="flex justify-between py-2.5 text-[#1d1d1f]">
            <span className="font-semibold">১. মোট ডিম বিক্রয় আয় (Gross Sales Revenue):</span>
            <span className="font-semibold">{formatTaka(settlement.totalSalesRevenue)}</span>
          </div>

          <div className="flex justify-between py-2.5 text-[#4e4e4e]">
            <span>২. বিক্রিত ডিমের ল্যান্ডেড কস্ট (Cost of Goods Sold - COGS):</span>
            <span className="text-[#7a7a7a]">- {formatTaka(settlement.totalCogs)}</span>
          </div>

          <div className="flex justify-between py-3 text-[14px] font-semibold bg-[#f5f5f7] px-3.5 rounded-[12px] border border-[#e0e0e0] text-[#1d1d1f]">
            <span>মোট বাণিজ্যিক লাভ (Gross Trading Profit):</span>
            <span>{formatTaka(settlement.grossProfit)}</span>
          </div>

          <div className="flex justify-between py-2.5 text-[#4e4e4e]">
            <span>৩. মোট পরিচালনা খরচ (দোকান ভাড়া, বিদ্যুৎ, আপ্যায়ন, মেরামত ইত্যাদি):</span>
            <span className="text-[#7a7a7a]">- {formatTaka(settlement.totalOperatingExpenses)}</span>
          </div>

          <div className="flex justify-between py-2.5 text-[#4e4e4e]">
            <span>৪. কর্মচারীদের বেতন বাবদ খরচ (Monthly Net Payroll):</span>
            <span className="text-[#7a7a7a]">- {formatTaka(settlement.totalSalaries)}</span>
          </div>

          <div className="flex justify-between py-2.5 text-[#4e4e4e]">
            <span>৫. ভাঙা ও গরমে পচা ডিমের আর্থিক ক্ষতি (Wastage / Expiry Loss):</span>
            <span className="text-[#7a7a7a]">- {formatTaka(settlement.totalWastageLoss)}</span>
          </div>

          <div className="flex justify-between py-2.5 text-[#4e4e4e]">
            <span>৬. সৌজন্যে / গিফটে দেওয়া ডিমের আর্থিক খরচ (Courtesy Stock Loss):</span>
            <span className="text-[#7a7a7a]">- {formatTaka(settlement.totalCourtesyLoss)}</span>
          </div>

          <div
            className={`flex justify-between py-3.5 px-4 rounded-[12px] border text-[15px] font-semibold ${
              settlement.netProfit >= 0
                ? 'bg-[#0066cc]/8 border-[#0066cc] text-[#0066cc]'
                : 'bg-white border-[#d92916] text-[#d92916]'
            }`}
          >
            <span>মাসের প্রকৃত নীট লাভ / লোকসান (Net Profit):</span>
            <span className="font-semibold text-[22px]">{formatTaka(settlement.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* 2:1 Partner Distribution Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[22px] text-[#1d1d1f]">
              মালিকদের ২:১ লভ্যাংশ বণ্টন (Partner Distribution)
            </h3>
            <span className="badge-blue">কনফিগারযোগ্য</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settlement.distributions.map((dist) => {
            const isSharif = dist.partnerName.includes('শরিফ');
            return (
              <div
                key={dist.partnerId}
                className="card-apple p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge-blue text-[11px] py-0 px-2.5">
                      {isSharif ? 'মালিক ১ (২ অংশ)' : 'মালিক ২ (১ অংশ)'}
                    </span>
                    <h4 className="font-semibold text-[22px] text-[#1d1d1f] mt-2">
                      {dist.partnerName}
                    </h4>
                    <p className="text-[12px] text-[#7a7a7a] mt-0.5">
                      প্রাপ্য লভ্যাংশ অনুপাত: <strong>{toBengaliNumber(dist.percentage)}%</strong> (শেয়ার: {toBengaliNumber(dist.shareWeight)})
                    </p>
                  </div>
                </div>

                <div className="bg-[#f5f5f7] p-4 rounded-[12px] border border-[#e0e0e0] space-y-2 text-[13px]">
                  <div className="flex justify-between text-[#4e4e4e]">
                    <span>মোট প্রাপ্য অংশ ({dist.percentage}%):</span>
                    <span className="font-semibold text-[#1d1d1f]">{formatTaka(dist.grossShare)}</span>
                  </div>

                  <div className="flex justify-between text-[#d92916]">
                    <span>চলতি মাসে ব্যক্তিগত উত্তোলন (Drawings):</span>
                    <span>- {formatTaka(dist.drawingsDeducted)}</span>
                  </div>

                  <div className="border-t border-[#e0e0e0] pt-2.5 flex justify-between text-[14px] font-semibold text-[#1d1d1f]">
                    <span>অবশিষ্ট নীট পাওনা / উত্তোলনযোগ্য:</span>
                    <span className="font-semibold text-[22px] text-[#0066cc]">
                      {formatTaka(dist.netPayable)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#7a7a7a]">
                  * ব্যক্তিগত প্রয়োজনে তোলা টাকা মাস শেষে তার প্রাপ্য লভ্যাংশ থেকে সমন্বয় করা হয়েছে।
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Partner Drawings History */}
      <div className="card-apple p-5 sm:p-6 space-y-4">
        <h4 className="font-semibold text-[18px] text-[#1d1d1f]">
          চলতি মাসের মালিকদের ব্যক্তিগত উত্তোলন হিস্ট্রি (Personal Drawings)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-left bg-[#f5f5f7]">
                <th className="py-2.5 px-3 font-semibold">তারিখ</th>
                <th className="py-2.5 px-3 font-semibold">মালিকের নাম</th>
                <th className="py-2.5 px-3 font-semibold">টাকার পরিমাণ</th>
                <th className="py-2.5 px-3 font-semibold">উৎস একাউন্ট</th>
                <th className="py-2.5 px-3 font-semibold">বিবরণ / কারণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {drawings.filter((d) => d.drawing_date.startsWith(selectedMonth)).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#7a7a7a]">
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
                      <tr key={draw.id} className="hover:bg-[#f5f5f7]">
                        <td className="py-2.5 px-3 text-[#7a7a7a]">
                          {toBengaliNumber(draw.drawing_date)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#1d1d1f]">
                          {p?.name}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#1d1d1f]">
                          {formatTaka(draw.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-[#7a7a7a]">
                          {acc?.name || 'ক্যাশ'}
                        </td>
                        <td className="py-2.5 px-3 text-[#7a7a7a]">
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
      <AppleModal
        isOpen={isDrawingOpen}
        onClose={() => setIsDrawingOpen(false)}
        title="মালিকের ব্যক্তিগত উত্তোলন (Drawing)"
        subtitle="মাস শেষে এই টাকা মালিকের নিট লভ্যাংশ থেকে কর্তন করা হবে"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleRecordDrawing} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              কোন মালিক টাকা তুলছেন?
            </label>
            <select
              value={drawPartnerId}
              onChange={(e) => setDrawPartnerId(e.target.value)}
              className="input-apple w-full text-[14px]"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              টাকার পরিমাণ (৳)
            </label>
            <input
              type="number"
              required
              value={drawAmount}
              onChange={(e) => setDrawAmount(Number(e.target.value) || 0)}
              className="input-apple w-full text-[15px] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              উৎস একাউন্ট
            </label>
            <select
              value={drawAccountId}
              onChange={(e) => setDrawAccountId(e.target.value)}
              className="input-apple w-full text-[14px]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatTaka(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              মন্তব্য / কারণ
            </label>
            <input
              type="text"
              placeholder="উদা: ব্যক্তিগত পারিবারিক খরচ"
              value={drawNotes}
              onChange={(e) => setDrawNotes(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDrawingOpen(false)}
              className="btn-outline text-[13px] px-4"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              উত্তোলন সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </AppleModal>

      {/* RATIO CONFIGURATION MODAL */}
      <AppleModal
        isOpen={isRatioOpen}
        onClose={() => setIsRatioOpen(false)}
        title="মালিকদের লভ্যাংশ অনুপাত কনফিগার"
        subtitle="ডিফল্ট অনুপাত ২:১ (শরিফ ২ ভাগ ও ইমান ১ ভাগ)"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSaveWeights} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              শরিফ (Sharif) এর অনুপাত ভাগ
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={sharifWeight}
              onChange={(e) => setSharifWeight(Number(e.target.value) || 1)}
              className="input-apple w-full text-[14px] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
              ইমান (Eman) এর অনুপাত ভাগ
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={emanWeight}
              onChange={(e) => setEmanWeight(Number(e.target.value) || 1)}
              className="input-apple w-full text-[14px] font-semibold"
            />
          </div>

          <div className="p-3 bg-[#f5f5f7] rounded-[12px] border border-[#e0e0e0] text-[12px] text-[#4e4e4e] space-y-1">
            <div>নতুন শতকরা হার:</div>
            <div className="font-semibold text-[#0066cc]">
              শরিফ: {((sharifWeight / (sharifWeight + emanWeight)) * 100).toFixed(1)}% | ইমান: {((emanWeight / (sharifWeight + emanWeight)) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRatioOpen(false)}
              className="btn-outline text-[13px] px-4"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="btn-primary text-[13px] px-5"
            >
              অনুপাত সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </AppleModal>
    </div>
  );
};
