import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle2, History, Calculator, UserPlus, X } from 'lucide-react';
import { Supplier, EggCategory, Branch, FinancialAccount, Purchase, PurchaseItem } from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { calculateLandedCost, formatTaka, toBengaliNumber } from '../lib/egg-units';
import { useLanguage, getCategoryDisplayName } from '../lib/i18n';
import { sanitizeText } from '../lib/security';
import { AppleSectionHeader } from '../components/ui/AppleUI';

interface SourcingPurchasesViewProps {
  suppliers: Supplier[];
  categories: EggCategory[];
  branches: Branch[];
  accounts: FinancialAccount[];
  purchases: Purchase[];
  onRefresh: () => void;
}

export const SourcingPurchasesView: React.FC<SourcingPurchasesViewProps> = ({
  suppliers,
  categories,
  branches,
  accounts,
  purchases,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || 'DIRECT_FARM');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupFarm, setNewSupFarm] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');

  useEffect(() => {
    if (supplierId !== 'DIRECT_FARM' && !suppliers.some((s) => s.id === supplierId)) {
      setSupplierId(suppliers[0]?.id || 'DIRECT_FARM');
    }
  }, [suppliers, supplierId]);

  const [items, setItems] = useState<{ categoryId: string; qtyPcs: number; rawRate: number }[]>([
    { categoryId: categories[0]?.id || '', qtyPcs: 3000, rawRate: 10.2 },
  ]);

  const [truckFare, setTruckFare] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [otherCost, setOtherCost] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');

  const totalEggsPcs = items.reduce((sum, i) => sum + (Number(i.qtyPcs) || 0), 0);
  const rawSubtotal = items.reduce((sum, i) => sum + (Number(i.qtyPcs) || 0) * (Number(i.rawRate) || 0), 0);

  const { totalLandedCost, effectiveLandedRatePerPc } = calculateLandedCost(
    rawSubtotal,
    truckFare,
    laborCost,
    otherCost,
    totalEggsPcs
  );
  const dueAmount = Math.max(0, totalLandedCost - paidAmount);

  const handleQuickAddSupplier = () => {
    const cleanName = sanitizeText(newSupName, 100);
    if (!cleanName) {
      alert(t('খামারী বা মহাজনের নাম লিখুন!', 'Please enter supplier/farm name!'));
      return;
    }
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      supplier_code: DimKhataStore.getNextCode('SUP'),
      name: cleanName,
      farm_name: sanitizeText(newSupFarm, 100) || cleanName,
      phone: sanitizeText(newSupPhone, 30) || '01700-000000',
      present_address: t('বাংলাদেশ', 'Bangladesh'),
      kyc_docs: [],
      current_payable: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    DimKhataStore.saveSupplier(newSup);
    onRefresh();
    setSupplierId(newSup.id);
    setNewSupName('');
    setNewSupFarm('');
    setNewSupPhone('');
    setShowQuickSupplier(false);
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { categoryId: categories[0]?.id || '', qtyPcs: 1500, rawRate: 10.5 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'categoryId' | 'qtyPcs' | 'rawRate', val: string | number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: field === 'categoryId' ? String(val) : Number(val) || 0,
      };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalEggsPcs <= 0) {
      alert(t('দয়া করে সঠিক ডিমের সংখ্যা দিন!', 'Please enter a valid egg quantity!'));
      return;
    }
    if (supplierId === 'DIRECT_FARM' && dueAmount > 0) {
      alert(
        t(
          'মহাজন খাতায় বাকি রাখতে হলে "+ নতুন মহাজন" বাটনে ক্লিক করে মহাজন নির্বাচন করুন অথবা "পূর্ণ পরিশোধ" করুন।',
          'To record supplier credit/payable, please select or add a supplier, or tap "Full Paid".'
        )
      );
      return;
    }

    const purchaseCode = DimKhataStore.getNextCode('PUR');
    const extraPerPc = totalEggsPcs > 0 ? (truckFare + laborCost + otherCost) / totalEggsPcs : 0;

    const purchaseItems: PurchaseItem[] = items.map((i, idx) => ({
      id: `pitem-${Date.now()}-${idx}`,
      purchase_id: '',
      category_id: i.categoryId,
      qty_pcs: i.qtyPcs,
      raw_rate_per_pc: i.rawRate,
      raw_total: i.qtyPcs * i.rawRate,
      landed_cost_share: Math.round(i.qtyPcs * extraPerPc * 100) / 100,
      effective_landed_cost_per_pc: Math.round((i.rawRate + extraPerPc) * 10000) / 10000,
    }));

    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      purchase_code: purchaseCode,
      purchase_date: purchaseDate,
      supplier_id: supplierId,
      branch_id: branchId,
      total_eggs_pcs: totalEggsPcs,
      raw_subtotal: rawSubtotal,
      truck_fare: truckFare,
      labor_cost: laborCost,
      other_cost: otherCost,
      total_landed_cost: totalLandedCost,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_account_id: paidAmount > 0 ? accountId : undefined,
      items: purchaseItems,
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordPurchase(newPurchase);
    alert(t(`সফল! চালান ${purchaseCode} সংরক্ষিত ও স্টক আপডেট হয়েছে।`, `Purchase ${purchaseCode} saved & stock updated!`));
    onRefresh();
    setItems([{ categoryId: categories[0]?.id || '', qtyPcs: 3000, rawRate: 10.2 }]);
    setPaidAmount(0);
  };

  return (
    <div className="space-y-5">
      <AppleSectionHeader
        title={t('খামার থেকে ডিম কেনা ও ল্যান্ডেড কস্ট (WAC)', 'Egg Sourcing & Landed Cost (WAC)')}
        subtitle={t('ট্রাক ভাড়া ও লেবার খরচ যোগ করে স্বয়ংক্রিয়ভাবে ডিমের প্রকৃত ইউনিট কস্ট হিসাব', 'Auto-calculates landed unit cost (WAC) with transport and labor overheads')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-apple p-4 sm:p-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-semibold text-[#1d1d1f]">
                    {t('খামারী / মহাজন', 'Supplier / Farm')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickSupplier((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066cc] hover:underline"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{t('+ নতুন মহাজন', '+ New Supplier')}</span>
                  </button>
                </div>
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input-apple w-full text-[14px]">
                  <option value="DIRECT_FARM">{t('সরাসরি খামার / নগদ ক্রয়', 'Direct Farm (Cash)')}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.supplier_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('গোডাউন / শাখা', 'Branch / Godown')}
                </label>
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input-apple w-full text-[14px]">
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('তারিখ', 'Date')}</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="input-apple w-full text-[14px]"
                />
              </div>
            </div>

            {showQuickSupplier && (
              <div className="p-3.5 rounded-[12px] bg-[#f5f5f7] border border-[#0066cc]/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-[#0066cc]" />
                    {t('দ্রুত নতুন মহাজন যোগ করুন (SE-SUP)', 'Quick Add Supplier (SE-SUP)')}
                  </span>
                  <button type="button" onClick={() => setShowQuickSupplier(false)} className="text-[#86868b] hover:text-[#1d1d1f]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder={t('মহাজনের নাম *', 'Supplier Name *')}
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <input
                    type="text"
                    placeholder={t('খামারের নাম', 'Farm Name')}
                    value={newSupFarm}
                    onChange={(e) => setNewSupFarm(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <input
                    type="text"
                    placeholder={t('মোবাইল নম্বর', 'Phone')}
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <button type="button" onClick={handleQuickAddSupplier} className="btn-primary !min-h-[40px] text-[13px]">
                    {t('যোগ করুন', 'Save')}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#1d1d1f]">
                  {t('ক্রয়কৃত ডিমের বিবরণ', 'Purchased Egg Batch')}
                </label>
                <button type="button" onClick={handleAddItem} className="btn-outline text-[12px] py-1 px-2.5 min-h-[34px]">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('+ আইটেম যোগ', '+ Add Item')}</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-4">
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleItemChange(idx, 'categoryId', e.target.value)}
                        className="input-apple w-full text-[14px]"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{getCategoryDisplayName(c)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3 relative">
                      <input
                        type="number"
                        placeholder={t('পরিমাণ (পিস)', 'Qty (Pcs)')}
                        value={item.qtyPcs}
                        onChange={(e) => handleItemChange(idx, 'qtyPcs', e.target.value)}
                        className="input-apple w-full pr-9 text-[14px] font-semibold"
                      />
                      <span className="absolute right-2.5 top-3 text-[11px] text-[#7a7a7a]">{t('পিস', 'pcs')}</span>
                    </div>

                    <div className="sm:col-span-3 relative">
                      <input
                        type="number"
                        step="0.05"
                        placeholder={t('দর (পিস)', 'Rate/Pc')}
                        value={item.rawRate}
                        onChange={(e) => handleItemChange(idx, 'rawRate', e.target.value)}
                        className="input-apple w-full pl-6 text-[14px] font-semibold"
                      />
                      <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                      <span className="text-[14px] font-semibold text-[#1d1d1f]">{formatTaka(item.qtyPcs * item.rawRate)}</span>
                      {items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="text-[#7a7a7a] hover:text-[#d92916] text-xs px-1">
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] p-3.5 space-y-2.5">
              <div className="text-[12px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>{t('পরিবহন ও লেবার খরচ (Landed Overheads)', 'Transport & Labor Overheads')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4e4e4e] mb-1">{t('ট্রাক / পিকআপ ভাড়া', 'Truck Fare')}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                    <input
                      type="number"
                      value={truckFare}
                      onChange={(e) => setTruckFare(Number(e.target.value) || 0)}
                      className="input-apple w-full pl-6 text-[14px] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#4e4e4e] mb-1">{t('লোড-আনলোড লেবার', 'Labor Cost')}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
                      className="input-apple w-full pl-6 text-[14px] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#4e4e4e] mb-1">{t('টোল / অন্যান্য', 'Toll / Other')}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                    <input
                      type="number"
                      value={otherCost}
                      onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
                      className="input-apple w-full pl-6 text-[14px] font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e0e0e0]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-semibold text-[#1d1d1f]">{t('নগদ পরিশোধ', 'Paid Amount')}</label>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(totalLandedCost)}
                    className="text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2.5 py-0.5 rounded-[980px]"
                  >
                    {t('পূর্ণ পরিশোধ', 'Full Paid')}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm text-[#7a7a7a]">৳</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className="input-apple w-full pl-7 text-[15px] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">{t('পেমেন্ট একাউন্ট', 'Payment Account')}</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={paidAmount <= 0}
                  className="input-apple w-full text-[14px] disabled:opacity-50"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({formatTaka(a.current_balance)})</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 text-[14px]">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('ডিম কেনা সম্পন্ন ও স্টক যুক্ত করুন', 'Save Purchase & Add to Live Stock')}</span>
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="tile-dark p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
              <Calculator className="w-4 h-4 text-[#2997ff]" />
              <h3 className="font-semibold text-[17px] text-white">{t('ল্যান্ডেড কস্ট সামারি', 'Landed Cost Summary')}</h3>
            </div>

            <div className="space-y-2 text-[13px] text-white/75">
              <div className="flex justify-between">
                <span>{t('মোট ডিম:', 'Total Eggs:')}</span>
                <span className="font-semibold text-white">{toBengaliNumber(totalEggsPcs)} {t('পিস', 'pcs')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('খামারের মূল দর:', 'Raw Subtotal:')}</span>
                <span className="font-semibold text-white">{formatTaka(rawSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('পরিবহন ও লেবার:', 'Overheads:')}</span>
                <span className="text-white">+ {formatTaka(truckFare + laborCost + otherCost)}</span>
              </div>

              <div className="border-t border-white/10 pt-2.5 flex justify-between text-[14px] font-semibold text-white">
                <span>{t('সর্বমোট ল্যান্ডেড কস্ট:', 'Total Landed Cost:')}</span>
                <span className="font-semibold text-[18px] text-[#2997ff]">{formatTaka(totalLandedCost)}</span>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-[12px] text-center">
                <div className="text-[11px] text-white/70">{t('প্রকৃত কেনা খরচ (প্রতি পিস)', 'Effective Landed Cost / Pc')}</div>
                <div className="font-semibold text-[24px] text-white mt-0.5">৳{toBengaliNumber(effectiveLandedRatePerPc.toFixed(2))}</div>
              </div>

              <div className="border-t border-white/10 pt-2.5 space-y-1 text-[12px]">
                <div className="flex justify-between text-white/75">
                  <span>{t('পরিশোধিত:', 'Paid:')}</span>
                  <span className="text-emerald-400 font-semibold">{formatTaka(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-white/75">
                  <span>{t('মহাজন বকেয়া:', 'Supplier Payable:')}</span>
                  <span className="text-white font-semibold">{formatTaka(dueAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-apple p-4 space-y-2.5">
            <h4 className="text-[12px] font-semibold text-[#7a7a7a] uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>{t('সাম্প্রতিক চালানসমূহ', 'Recent Purchases')}</span>
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {purchases.length === 0 ? (
                <div className="text-xs text-[#7a7a7a] text-center py-4">
                  {t('কোনো ক্রয় চালান নেই', 'No purchases yet')}
                </div>
              ) : (
                purchases.slice(0, 5).map((p) => (
                  <div key={p.id} className="p-2.5 bg-[#f5f5f7] rounded-[10px] border border-[#e0e0e0] text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-[#0066cc] font-mono">{p.purchase_code}</div>
                      <div className="text-[11px] text-[#7a7a7a]">
                        {toBengaliNumber(p.purchase_date)} | {toBengaliNumber(p.total_eggs_pcs)} {t('পিস', 'pcs')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#1d1d1f]">{formatTaka(p.total_landed_cost)}</div>
                      <div className="text-[11px] text-[#7a7a7a]">
                        ৳{toBengaliNumber((p.total_landed_cost / Math.max(1, p.total_eggs_pcs)).toFixed(2))}/{t('পিস', 'pc')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
