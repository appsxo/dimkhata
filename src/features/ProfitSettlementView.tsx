import React, { useState } from 'react';
import { Settings, Printer, MinusCircle } from 'lucide-react';
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

    DimKhataStore.recordPartnerDrawing(
      {
        id: `draw-${Date.now()}`,
        partner_id: drawPartnerId,
        drawing_date: new Date().toISOString().split('T')[0],
        amount: drawAmount,
        account_id: drawAccountId,
        notes: drawNotes || t('মালিকের ব্যক্তিগত উত্তোলন', 'Partner Drawing'),
        created_at: new Date().toISOString(),
      },
      'br-01'
    );
    alert(t('ব্যক্তিগত উত্তোলন সফলভাবে সংরক্ষিত হয়েছে!', 'Partner drawing saved and deducted from Cashbook!'));
    setIsDrawingOpen(false);
    onRefresh();
  };

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    const sharif = partners.find((p) => p.name.includes('শরিফ'));
    const eman = partners.find((p) => p.name.includes('ইমান'));
    if (sharif) DimKhataStore.updatePartnerWeight(sharif.id, Number(sharifWeight) || 2);
    if (eman) DimKhataStore.updatePartnerWeight(eman.id, Number(emanWeight) || 1);
    alert(t('লভ্যাংশ বণ্টনের অনুপাত আপডেট হয়েছে!', 'Profit distribution ratio updated!'));
    setIsRatioOpen(false);
    onRefresh();
  };

  const monthDrawings = drawings.filter((d) => d.drawing_date.startsWith(selectedMonth));

  return (
    <div className="space-y-5">
      <AppleSectionHeader
        title={t('মাসিক নিট লাভ ও ২:১ লভ্যাংশ বণ্টন', 'Monthly Net Profit & 2:1 Partner Split')}
        subtitle={t('শরিফ (৬৬.৬৭%) ও ইমান (৩৩.৩৩%) এর নিট পাওনা ও লাভ-লোকসান বিবরণী', 'Automated P&L statement and 2:1 profit split between Sharif & Eman')}
        actions={
          <>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-apple text-[13px] py-1.5"
            />
            <button onClick={() => setIsDrawingOpen(true)} className="btn-outline text-[12px] px-3">
              <MinusCircle className="w-3.5 h-3.5" />
              <span>{t('উত্তোলন', 'Drawing')}</span>
            </button>
            <button onClick={() => setIsRatioOpen(true)} className="btn-outline text-[12px] px-3">
              <Settings className="w-3.5 h-3.5" />
              <span>{t('অনুপাত', 'Ratio')}</span>
            </button>
            <button onClick={() => window.print()} className="btn-primary text-[12px] px-3.5">
              <Printer className="w-3.5 h-3.5" />
              <span>{t('প্রিন্ট', 'Print')}</span>
            </button>
          </>
        }
      />

      <div className="card-apple p-4 sm:p-5 space-y-3.5 print-card">
        <div className="border-b border-[#e0e0e0] pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-semibold text-[18px] sm:text-[20px] text-[#1d1d1f]">
              {t('মাসিক লাভ-লোকসান বিবরণী', 'Monthly Income Statement (P&L)')}
            </h3>
            <p className="text-[12px] text-[#7a7a7a]">
              {t('মাস:', 'Month:')} <strong>{toBengaliNumber(selectedMonth)}</strong> | {t('শরিফ এন্ড ইমান এন্টারপ্রাইজ', 'Sharif & Eman Enterprise')}
            </p>
          </div>
          <div className="sm:text-right">
            <span className="text-[11px] text-[#7a7a7a] uppercase tracking-wider">{t('প্রকৃত নিট লাভ / লোকসান', 'Net Profit / Loss')}</span>
            <div className={`font-semibold text-[24px] ${settlement.netProfit >= 0 ? 'text-[#0066cc]' : 'text-[#d92916]'}`}>
              {formatTaka(settlement.netProfit)}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-[13px] divide-y divide-[#e0e0e0]">
          <div className="flex justify-between py-2 text-[#1d1d1f]">
            <span className="font-semibold">{t('১. মোট ডিম বিক্রয় আয় (Gross Sales Revenue):', '1. Gross Sales Revenue:')}</span>
            <span className="font-semibold">{formatTaka(settlement.totalSalesRevenue)}</span>
          </div>
          <div className="flex justify-between py-2 text-[#4e4e4e]">
            <span>{t('২. বিক্রিত ডিমের ল্যান্ডেড কস্ট (COGS):', '2. Cost of Goods Sold (Landed COGS):')}</span>
            <span className="text-[#7a7a7a]">- {formatTaka(settlement.totalCogs)}</span>
          </div>
          <div className="flex justify-between py-2.5 text-[14px] font-semibold bg-[#f5f5f7] px-3 rounded-[10px] border border-[#e0e0e0] text-[#1d1d1f]">
            <span>{t('মোট বাণিজ্যিক লাভ (Gross Profit):', 'Gross Trading Profit:')}</span>
            <span>{formatTaka(settlement.grossProfit)}</span>
          </div>
          <div className="flex justify-between py-2 text-[#4e4e4e]">
            <span>{t('৩. পরিচালনা খরচ (ভাড়া, বিদ্যুৎ, আপ্যায়ন ইত্যাদি):', '3. Operating Expenses:')}</span>
            <span className="text-[#7a7a7a]">- {formatTaka(settlement.totalOperatingExpenses)}</span>
          </div>
          <div className="flex justify-between py-2 text-[#4e4e4e]">
            <span>{t('৪. কর্মচারীদের বেতন (Monthly Payroll):', '4. Monthly Staff Payroll:')}</span>
            <span className="text-[#7a7a7a]">- {formatTaka(settlement.totalSalaries)}</span>
          </div>
          <div className="flex justify-between py-2 text-[#4e4e4e]">
            <span>{t('৫. ভাঙা ও পচা ডিমের ক্ষতি (Wastage Loss):', '5. Wastage / Broken Egg Loss:')}</span>
            <span className="text-[#7a7a7a]">- {formatTaka(settlement.totalWastageLoss)}</span>
          </div>
          <div className="flex justify-between py-2 text-[#4e4e4e]">
            <span>{t('৬. সৌজন্য গিফট ডিমের খরচ (Courtesy Loss):', '6. Courtesy Gift Stock Cost:')}</span>
            <span className="text-[#7a7a7a]">- {formatTaka(settlement.totalCourtesyLoss)}</span>
          </div>
          <div
            className={`flex justify-between py-3 px-3.5 rounded-[12px] border text-[15px] font-semibold ${
              settlement.netProfit >= 0 ? 'bg-[#0066cc]/8 border-[#0066cc] text-[#0066cc]' : 'bg-white border-[#d92916] text-[#d92916]'
            }`}
          >
            <span>{t('মাসের প্রকৃত নীট লাভ (Net Profit):', 'Monthly Net Profit:')}</span>
            <span className="font-semibold text-[20px]">{formatTaka(settlement.netProfit)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settlement.distributions.map((dist) => {
          const isSharif = dist.partnerName.includes('শরিফ');
          return (
            <div key={dist.partnerId} className="card-apple p-4 sm:p-5 space-y-3">
              <div>
                <span className="badge-blue text-[11px] py-0 px-2.5">
                  {isSharif ? t('মালিক ১ (২ অংশ)', 'Partner 1 (2 Shares)') : t('মালিক ২ (১ অংশ)', 'Partner 2 (1 Share)')}
                </span>
                <h4 className="font-semibold text-[20px] text-[#1d1d1f] mt-1.5">{dist.partnerName}</h4>
                <p className="text-[12px] text-[#7a7a7a]">
                  {t('লভ্যাংশ অনুপাত:', 'Profit Share:')} <strong>{toBengaliNumber(dist.percentage)}%</strong> ({toBengaliNumber(dist.shareWeight)})
                </p>
              </div>

              <div className="bg-[#f5f5f7] p-3.5 rounded-[12px] border border-[#e0e0e0] space-y-2 text-[13px]">
                <div className="flex justify-between text-[#4e4e4e]">
                  <span>{t('মোট প্রাপ্য অংশ:', 'Gross Profit Share:')}</span>
                  <span className="font-semibold text-[#1d1d1f]">{formatTaka(dist.grossShare)}</span>
                </div>
                <div className="flex justify-between text-[#d92916]">
                  <span>{t('ব্যক্তিগত উত্তোলন (Drawings):', 'Personal Drawings:')}</span>
                  <span>- {formatTaka(dist.drawingsDeducted)}</span>
                </div>
                <div className="border-t border-[#e0e0e0] pt-2 flex justify-between text-[14px] font-semibold text-[#1d1d1f]">
                  <span>{t('অবশিষ্ট নীট পাওনা:', 'Net Payable:')}</span>
                  <span className="font-semibold text-[20px] text-[#0066cc]">{formatTaka(dist.netPayable)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-apple p-4 sm:p-5 space-y-3">
        <h4 className="font-semibold text-[16px] text-[#1d1d1f]">
          {t('চলতি মাসের ব্যক্তিগত উত্তোলন (Drawings)', 'Monthly Partner Drawings')}
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] text-left bg-[#f5f5f7]">
                <th className="py-2 px-3 font-semibold">{t('তারিখ', 'Date')}</th>
                <th className="py-2 px-3 font-semibold">{t('মালিক', 'Partner')}</th>
                <th className="py-2 px-3 font-semibold">{t('পরিমাণ', 'Amount')}</th>
                <th className="py-2 px-3 font-semibold">{t('একাউন্ট', 'Account')}</th>
                <th className="py-2 px-3 font-semibold">{t('বিবরণ', 'Note')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {monthDrawings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#7a7a7a]">
                    {t('চলতি মাসে কোনো ব্যক্তিগত উত্তোলন নেই।', 'No partner drawings this month.')}
                  </td>
                </tr>
              ) : (
                monthDrawings.map((draw) => {
                  const p = partners.find((pt) => pt.id === draw.partner_id);
                  const acc = accounts.find((a) => a.id === draw.account_id);
                  return (
                    <tr key={draw.id} className="hover:bg-[#f5f5f7]">
                      <td className="py-2 px-3 text-[#7a7a7a]">{toBengaliNumber(draw.drawing_date)}</td>
                      <td className="py-2 px-3 font-semibold text-[#1d1d1f]">{p?.name}</td>
                      <td className="py-2 px-3 font-semibold text-[#1d1d1f]">{formatTaka(draw.amount)}</td>
                      <td className="py-2 px-3 text-[#7a7a7a]">{acc?.name || t('ক্যাশ', 'Cash')}</td>
                      <td className="py-2 px-3 text-[#7a7a7a]">{draw.notes}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AppleModal
        isOpen={isDrawingOpen}
        onClose={() => setIsDrawingOpen(false)}
        title={t('মালিকের ব্যক্তিগত উত্তোলন', 'Record Partner Drawing')}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleRecordDrawing} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('মালিক নির্বাচন', 'Partner')}</label>
            <select value={drawPartnerId} onChange={(e) => setDrawPartnerId(e.target.value)} className="input-apple w-full text-[14px]">
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('টাকার পরিমাণ (৳)', 'Amount (৳)')}</label>
            <div className="relative flex items-center">
              <span className="input-prefix-symbol">৳</span>
              <input
                type="number"
                required
                value={drawAmount}
                onChange={(e) => setDrawAmount(Number(e.target.value) || 0)}
                className="input-apple input-has-prefix w-full text-[15px] font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('উৎস একাউন্ট', 'Account')}</label>
            <select value={drawAccountId} onChange={(e) => setDrawAccountId(e.target.value)} className="input-apple w-full text-[14px]">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatTaka(a.current_balance)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('মন্তব্য / কারণ', 'Note')}</label>
            <input
              type="text"
              placeholder={t('উদা: ব্যক্তিগত খরচ', 'e.g., Personal expense')}
              value={drawNotes}
              onChange={(e) => setDrawNotes(e.target.value)}
              className="input-apple w-full text-[14px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsDrawingOpen(false)} className="btn-outline text-[13px] px-4">
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('সংরক্ষণ করুন', 'Save')}
            </button>
          </div>
        </form>
      </AppleModal>

      <AppleModal
        isOpen={isRatioOpen}
        onClose={() => setIsRatioOpen(false)}
        title={t('লভ্যাংশ অনুপাত কনফিগার', 'Configure Profit Ratio')}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSaveWeights} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('শরিফ (Sharif) এর অনুপাত ভাগ', 'Sharif Share Weight')}</label>
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
            <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('ইমান (Eman) এর অনুপাত ভাগ', 'Eman Share Weight')}</label>
            <input
              type="number"
              step="0.1"
              required
              value={emanWeight}
              onChange={(e) => setEmanWeight(Number(e.target.value) || 1)}
              className="input-apple w-full text-[14px] font-semibold"
            />
          </div>
          <div className="p-3 bg-[#f5f5f7] rounded-[12px] border border-[#e0e0e0] text-[12px] font-semibold text-[#0066cc]">
            {t('শরিফ:', 'Sharif:')} {((sharifWeight / (sharifWeight + emanWeight)) * 100).toFixed(1)}% | {t('ইমান:', 'Eman:')}{' '}
            {((emanWeight / (sharifWeight + emanWeight)) * 100).toFixed(1)}%
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsRatioOpen(false)} className="btn-outline text-[13px] px-4">
              {t('বাতিল', 'Cancel')}
            </button>
            <button type="submit" className="btn-primary text-[13px] px-5">
              {t('আপডেট করুন', 'Save Ratio')}
            </button>
          </div>
        </form>
      </AppleModal>
    </div>
  );
};
