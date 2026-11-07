// ====================================================================
// DIMKHATA (ডিমখাতা) — Sales POS & Delivery Challan (Apple Design System)
// Supports Walk-in Cash Customer, Inline Quick Customer Creation & Bilingual UI
// ====================================================================

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Printer,
  Share2,
  Truck,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  Customer,
  EggCategory,
  DailyMarketRate,
  InventoryStock,
  Branch,
  FinancialAccount,
  SalesInvoice,
  SalesItem,
  DeliveryChallan,
  CompanySettings,
} from '../types';
import { DimKhataStore } from '../lib/storage-store';
import { formatTaka, toBengaliNumber } from '../lib/egg-units';
import { shareInvoiceWhatsApp } from '../lib/whatsapp-share';
import { useLanguage, getCategoryDisplayName } from '../lib/i18n';
import { sanitizeText, sanitizePositiveNumber } from '../lib/security';
import { AppleSectionHeader, AppleOptionChips } from '../components/ui/AppleUI';

interface SalesPosViewProps {
  customers: Customer[];
  categories: EggCategory[];
  rates: DailyMarketRate[];
  stocks: InventoryStock[];
  allBranchStocks?: InventoryStock[];
  branches: Branch[];
  accounts: FinancialAccount[];
  sales: SalesInvoice[];
  company: CompanySettings;
  onRefresh: () => void;
  onSelectInvoiceForPrint: (inv: SalesInvoice) => void;
}

export const SalesPosView: React.FC<SalesPosViewProps> = ({
  customers,
  categories,
  rates,
  stocks,
  allBranchStocks,
  branches,
  accounts,
  sales,
  company,
  onRefresh,
  onSelectInvoiceForPrint,
}) => {
  const { t } = useLanguage();
  const rawBranchStocks = allBranchStocks || stocks;

  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || 'WALK_IN');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [saleType, setSaleType] = useState<'WHOLESALE' | 'RETAIL'>('WHOLESALE');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Inline Quick Add Customer state
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustLimit, setNewCustLimit] = useState(50000);

  const [items, setItems] = useState<
    { categoryId: string; inputType: 'CRATE' | 'PCS'; qtyInput: number; unitPrice: number }[]
  >([
    {
      categoryId: categories[0]?.id || '',
      inputType: 'CRATE',
      qtyInput: 10,
      unitPrice: rates.find((r) => r.category_id === categories[0]?.id)?.wholesale_rate_pc || 10.8,
    },
  ]);

  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<SalesInvoice['payment_method']>('CASH');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  const [includeChallan, setIncludeChallan] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Ensure valid customer selection when customers array changes
  useEffect(() => {
    if (customerId !== 'WALK_IN' && !customers.some((c) => c.id === customerId)) {
      setCustomerId(customers[0]?.id || 'WALK_IN');
    }
  }, [customers, customerId]);

  // Sync item unit prices if daily market rates are updated
  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => {
        const rateObj = rates.find((r) => r.category_id === item.categoryId);
        if (!rateObj) return item;
        const updatedPrice =
          saleType === 'WHOLESALE' ? rateObj.wholesale_rate_pc : rateObj.retail_rate_pc;
        return { ...item, unitPrice: updatedPrice };
      })
    );
  }, [rates, saleType]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const getItemPcs = (item: { categoryId: string; inputType: 'CRATE' | 'PCS'; qtyInput: number }) => {
    const cat = categories.find((c) => c.id === item.categoryId);
    const crateSize = cat?.pcs_per_crate || 30;
    return item.inputType === 'CRATE' ? item.qtyInput * crateSize : item.qtyInput;
  };

  const subtotal = items.reduce((sum, item) => {
    const pcs = getItemPcs(item);
    return sum + pcs * (Number(item.unitPrice) || 0);
  }, 0);

  const netTotal = Math.max(0, subtotal - discount);
  const dueAmount = Math.max(0, netTotal - paidAmount);

  const newProjectedDue = (selectedCustomer?.current_due || 0) + dueAmount;
  const isCreditExceeded = selectedCustomer && newProjectedDue > selectedCustomer.credit_limit;

  const handleQuickAddCustomer = () => {
    const cleanName = sanitizeText(newCustName, 100);
    if (!cleanName) {
      alert(t('কাস্টমারের নাম লিখুন!', 'Please enter customer name!'));
      return;
    }
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      customer_code: DimKhataStore.getNextCode('CUST'),
      name: cleanName,
      phone: sanitizeText(newCustPhone, 30) || '01700-000000',
      customer_type: saleType,
      present_address: sanitizeText(newCustAddress, 200) || t('ঢাকা', 'Dhaka'),
      kyc_docs: [],
      credit_limit: sanitizePositiveNumber(newCustLimit, 50000),
      current_due: 0,
      due_alert_days: 7,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    DimKhataStore.saveCustomer(newCust);
    onRefresh();
    setCustomerId(newCust.id);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setShowQuickCustomer(false);
  };

  const handlePaymentMethodChange = (method: SalesInvoice['payment_method']) => {
    setPaymentMethod(method);
    if (method === 'DUE') {
      setPaidAmount(0);
      return;
    }
    if (method === 'CASH') {
      const cashAcc = accounts.find((a) => a.account_type === 'CASH');
      if (cashAcc) setAccountId(cashAcc.id);
    } else if (method === 'BKASH') {
      const bkashAcc = accounts.find((a) => a.name.includes('বিকাশ') || a.name.toLowerCase().includes('bkash'));
      if (bkashAcc) setAccountId(bkashAcc.id);
    } else if (method === 'NAGAD') {
      const nagadAcc = accounts.find((a) => a.name.includes('নগদ') || a.name.toLowerCase().includes('nagad'));
      if (nagadAcc) setAccountId(nagadAcc.id);
    } else if (method === 'BANK') {
      const bankAcc = accounts.find((a) => a.account_type === 'BANK');
      if (bankAcc) setAccountId(bankAcc.id);
    }
  };

  const handleAddItem = () => {
    const cat = categories[0];
    const defaultRate =
      saleType === 'WHOLESALE'
        ? rates.find((r) => r.category_id === cat?.id)?.wholesale_rate_pc || 11
        : rates.find((r) => r.category_id === cat?.id)?.retail_rate_pc || 12;

    setItems((prev) => [
      ...prev,
      {
        categoryId: cat?.id || '',
        inputType: 'CRATE',
        qtyInput: 5,
        unitPrice: defaultRate,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, catId: string) => {
    const rate =
      saleType === 'WHOLESALE'
        ? rates.find((r) => r.category_id === catId)?.wholesale_rate_pc || 11
        : rates.find((r) => r.category_id === catId)?.retail_rate_pc || 12;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        categoryId: catId,
        unitPrice: rate,
      };
      return copy;
    });
  };

  const handleSaleTypeChange = (type: 'WHOLESALE' | 'RETAIL') => {
    setSaleType(type);
    setItems((prev) =>
      prev.map((item) => {
        const rate =
          type === 'WHOLESALE'
            ? rates.find((r) => r.category_id === item.categoryId)?.wholesale_rate_pc || 11
            : rates.find((r) => r.category_id === item.categoryId)?.retail_rate_pc || 12;
        return { ...item, unitPrice: rate };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0 || subtotal <= 0) {
      alert(t('অন্তত একটি ডিমের আইটেম যোগ করুন!', 'Please add at least one egg item!'));
      return;
    }

    if (customerId === 'WALK_IN' && dueAmount > 0) {
      alert(
        t(
          'নগদ খুচরা কাস্টমারের ক্ষেত্রে বাকি রাখা যাবে না। "পূর্ণ বিল জমা" দিন অথবা "+ নতুন কাস্টমার" বাটনে ক্লিক করে কাস্টমার যোগ করুন।',
          'Walk-in cash sales cannot have a due balance. Tap "Full Paid" or add a registered customer using "+ New Customer".'
        )
      );
      return;
    }

    for (const item of items) {
      const pcs = getItemPcs(item);
      const stock = rawBranchStocks.find((s) => s.category_id === item.categoryId && s.branch_id === branchId);
      const cat = categories.find((c) => c.id === item.categoryId);
      if (!stock || stock.qty_pcs < pcs) {
        const proceed = confirm(
          t(
            `সতর্কবার্তা: "${cat ? getCategoryDisplayName(cat) : ''}" এর স্টক ঘাটতি রয়েছে (বর্তমান মজুদ: ${toBengaliNumber(stock?.qty_pcs || 0)} পিস)। আপনি কি ঘাটতি সত্ত্বেও বিক্রয় সম্পন্ন করতে চান?`,
            `Warning: "${cat ? getCategoryDisplayName(cat) : ''}" has insufficient stock (Current: ${stock?.qty_pcs || 0} pcs). Proceed anyway?`
          )
        );
        if (!proceed) return;
      }
    }

    const invoiceCode = DimKhataStore.getNextCode('INV');

    const salesItems: SalesItem[] = items.map((item, idx) => {
      const pcs = getItemPcs(item);
      const stock = rawBranchStocks.find((s) => s.category_id === item.categoryId && s.branch_id === branchId);
      return {
        id: `sitem-${Date.now()}-${idx}`,
        invoice_id: '',
        category_id: item.categoryId,
        qty_pcs: pcs,
        unit_price_pc: item.unitPrice,
        total_price: pcs * item.unitPrice,
        cogs_landed_cost_per_pc: stock?.avg_landed_cost_per_pc || 10.0,
      };
    });

    let challan: DeliveryChallan | undefined;
    if (includeChallan) {
      const challanCode = DimKhataStore.getNextCode('CHL');
      challan = {
        id: `chl-${Date.now()}`,
        challan_code: challanCode,
        invoice_id: '',
        challan_date: invoiceDate,
        vehicle_type: t('পিকআপ / ভ্যান', 'Pickup / Van'),
        vehicle_number: sanitizeText(vehicleNumber, 50),
        driver_name: sanitizeText(driverName, 80),
        driver_phone: sanitizeText(driverPhone, 30),
        destination_address: selectedCustomer?.present_address || t('ঢাকা', 'Dhaka'),
        created_at: new Date().toISOString(),
      };
    }

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      invoice_code: invoiceCode,
      invoice_date: invoiceDate,
      customer_id: customerId,
      branch_id: branchId,
      sale_type: saleType,
      subtotal,
      discount,
      net_total: netTotal,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_account_id: paidAmount > 0 ? accountId : undefined,
      payment_method: paymentMethod,
      has_challan: includeChallan,
      notes: sanitizeText(notes, 300),
      items: salesItems,
      challan,
      created_at: new Date().toISOString(),
    };

    DimKhataStore.recordSalesInvoice(newInvoice);
    onRefresh();
    onSelectInvoiceForPrint(newInvoice);

    setPaidAmount(0);
    setDiscount(0);
    setNotes('');
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <AppleSectionHeader
        eyebrow={t('পাইকারি ও খুচরা বিক্রয়', 'Wholesale & Retail POS')}
        title={t('বিক্রয় মেমো ও ডেলিভারি চালান (POS)', 'Sales Memo & Delivery Challan (POS)')}
        subtitle={t(
          '১-ক্লিকে পাইকারি ও খুচরা রেটে মেমো তৈরি, বাকির সীমা সতর্কতা এবং প্রিন্ট ও WhatsApp শেয়ার',
          'Create wholesale or retail memos in 1 click with credit limit alerts, thermal/A4 print & WhatsApp share'
        )}
        actions={
          <AppleOptionChips
            options={[
              { value: 'WHOLESALE', label: t('পাইকারি বিক্রয়', 'Wholesale') },
              { value: 'RETAIL', label: t('খুচরা বিক্রয়', 'Retail') },
            ]}
            value={saleType}
            onChange={handleSaleTypeChange}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Sales Memo Form (2 Cols) */}
        <div className="lg:col-span-2 card-apple p-4 sm:p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-semibold text-[#1d1d1f]">
                    {t('কাস্টমার নির্বাচন', 'Customer')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQuickCustomer((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066cc] hover:underline"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{t('+ নতুন কাস্টমার', '+ New Customer')}</span>
                  </button>
                </div>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="input-apple w-full text-[14px]"
                >
                  <option value="WALK_IN">
                    {t('নগদ কাস্টমার (Walk-in Cash)', 'Walk-in Cash Customer')}
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customer_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('শাখা / গোডাউন', 'Branch / Godown')}
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="input-apple w-full text-[14px]"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('তারিখ', 'Invoice Date')}
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="input-apple w-full text-[14px]"
                />
              </div>
            </div>

            {/* Inline Quick Customer Registration Box */}
            {showQuickCustomer && (
              <div className="p-4 rounded-[14px] bg-[#f5f5f7] border border-[#0066cc]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-[#0066cc]" />
                    {t('দ্রুত নতুন কাস্টমার নিবন্ধন (SE-CUST)', 'Quick Add Customer (SE-CUST)')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQuickCustomer(false)}
                    className="text-[#86868b] hover:text-[#1d1d1f]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    placeholder={t('কাস্টমারের নাম *', 'Customer Name *')}
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <input
                    type="text"
                    placeholder={t('মোবাইল নম্বর', 'Phone Number')}
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <input
                    type="text"
                    placeholder={t('ঠিকানা / বাজার', 'Address / Market')}
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCustomer}
                    className="btn-primary !min-h-[42px] text-[13px]"
                  >
                    {t('কাস্টমার যোগ করুন', 'Save Customer')}
                  </button>
                </div>
              </div>
            )}

            {/* Credit Limit Alert Banner */}
            {selectedCustomer && (
              <div className="p-3 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] text-[13px] flex flex-wrap items-center justify-between gap-2 text-[#4e4e4e]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#0066cc] shrink-0" />
                  <span>
                    {t('পূর্বের বকেয়া:', 'Previous Due:')}{' '}
                    <strong className="text-[#1d1d1f] font-semibold">
                      {formatTaka(selectedCustomer.current_due)}
                    </strong>{' '}
                    | {t('বাকির সীমা:', 'Credit Limit:')}{' '}
                    <strong className="text-[#1d1d1f] font-semibold">
                      {formatTaka(selectedCustomer.credit_limit)}
                    </strong>
                  </span>
                </div>
                {isCreditExceeded && (
                  <span className="text-[#d92916] font-semibold text-[12px]">
                    ⚠️ {t('বাকির সীমা অতিক্রম করছে', 'Exceeds Credit Limit')}
                  </span>
                )}
              </div>
            )}

            {/* Item Rows */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#1d1d1f]">
                  {t('বিক্রয়কৃত ডিমের তালিকা', 'Egg Items')}
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn-outline text-[12px] py-1.5 px-3 min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('+ আরও ডিম যোগ করুন', '+ Add Item')}</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => {
                  const pcs = getItemPcs(item);
                  const cat = categories.find((c) => c.id === item.categoryId);
                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="sm:col-span-4">
                          <select
                            value={item.categoryId}
                            onChange={(e) => handleCategoryChange(idx, e.target.value)}
                            className="input-apple w-full text-[14px]"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {getCategoryDisplayName(c)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4 flex items-center gap-1.5">
                          <input
                            type="number"
                            value={item.qtyInput}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setItems((prev) => {
                                const copy = [...prev];
                                copy[idx].qtyInput = val;
                                return copy;
                              });
                            }}
                            className="input-apple w-20 text-[15px] font-semibold"
                          />
                          <select
                            value={item.inputType}
                            onChange={(e) => {
                              const val = e.target.value as 'CRATE' | 'PCS';
                              setItems((prev) => {
                                const copy = [...prev];
                                copy[idx].inputType = val;
                                return copy;
                              });
                            }}
                            className="input-apple text-[13px] flex-1"
                          >
                            <option value="CRATE">
                              {t('খাঁচি', 'Crate')} ({cat?.pcs_per_crate || 30})
                            </option>
                            <option value="PCS">{t('পিস', 'Pcs')}</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.05"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setItems((prev) => {
                                  const copy = [...prev];
                                  copy[idx].unitPrice = val;
                                  return copy;
                                });
                              }}
                              className="input-apple w-full pl-6 text-[14px] font-semibold"
                            />
                            <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                          </div>
                        </div>

                        <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                          <span className="text-[14px] font-semibold text-[#1d1d1f]">
                            {formatTaka(pcs * item.unitPrice)}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-[#7a7a7a] hover:text-[#d92916] text-xs px-1.5 py-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quick 1-Tap Mobile Quantity Presets */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#e0e0e0]/70">
                        <span className="text-[11px] text-[#7a7a7a]">
                          {t('মোট ডিম:', 'Total Eggs:')}{' '}
                          <strong className="text-[#1d1d1f] font-semibold">
                            {toBengaliNumber(pcs)} {t('পিস', 'pcs')}
                          </strong>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[1, 5, 10, 20, 50].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setItems((prev) => {
                                  const copy = [...prev];
                                  copy[idx].qtyInput = preset;
                                  return copy;
                                });
                              }}
                              className={`px-2.5 py-1 rounded-[980px] text-[11px] font-semibold transition ${
                                item.qtyInput === preset
                                  ? 'bg-[#0066cc] text-white'
                                  : 'bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:border-[#0066cc]'
                              }`}
                            >
                              {toBengaliNumber(preset)}{' '}
                              {item.inputType === 'CRATE'
                                ? t('খাঁচি', 'Crate')
                                : t('পিস', 'Pcs')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Challan Section Checkbox */}
            <div className="p-3.5 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeChallan}
                  onChange={(e) => setIncludeChallan(e.target.checked)}
                  className="rounded text-[#0066cc] focus:ring-[#0071e3] w-4 h-4"
                />
                <span className="text-[13px] font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#0066cc]" />
                  <span>
                    {t(
                      'আলাদা ডেলিভারি চালান প্রিন্ট করুন (Delivery Challan)',
                      'Generate Separate Delivery Challan'
                    )}
                  </span>
                </span>
              </label>

              {includeChallan && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <input
                    type="text"
                    placeholder={t('গাড়ি / ভ্যান নম্বর', 'Vehicle / Van No.')}
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <input
                    type="text"
                    placeholder={t('ড্রাইভারের নাম', 'Driver Name')}
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                  <input
                    type="text"
                    placeholder={t('ড্রাইভারের ফোন', 'Driver Phone')}
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="input-apple text-[13px]"
                  />
                </div>
              )}
            </div>

            {/* Payment & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#e0e0e0]">
              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('বিশেষ ছাড় / ডিসকাউন্ট', 'Discount')}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="input-apple w-full pl-6 text-[14px] font-semibold"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-semibold text-[#1d1d1f]">
                    {t('নগদ জমা / পেইড', 'Paid Amount')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPaidAmount(netTotal);
                      if (paymentMethod === 'DUE') handlePaymentMethodChange('CASH');
                    }}
                    className="text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 hover:bg-[#0066cc]/20 px-2.5 py-0.5 rounded-[980px] transition"
                  >
                    {t('পূর্ণ বিল জমা', 'Full Paid')}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-3 text-xs text-[#7a7a7a]">৳</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className="input-apple w-full pl-6 text-[14px] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('পেমেন্ট মাধ্যম', 'Payment Method')}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
                  className="input-apple w-full text-[14px]"
                >
                  <option value="CASH">{t('ক্যাশ নগদ', 'Cash')}</option>
                  <option value="BKASH">{t('বিকাশ (bKash)', 'bKash')}</option>
                  <option value="NAGAD">{t('নগদ (Nagad)', 'Nagad')}</option>
                  <option value="BANK">{t('ব্যাংক একাউন্ট', 'Bank Account')}</option>
                  <option value="DUE">{t('সম্পূর্ণ বাকি', 'Full Due')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#1d1d1f] mb-1">
                  {t('জমা একাউন্ট (সিঙ্ক)', 'Deposit Account')}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={paymentMethod === 'DUE' || paidAmount <= 0}
                  className="input-apple w-full text-[14px] disabled:opacity-50"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-[15px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {t(
                  'মেমো সংরক্ষণ করুন ও প্রিন্ট ভিউ দেখুন',
                  'Save Memo & Open Print View'
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Right Summary ({component.product-tile-dark} #272729) */}
        <div className="space-y-4">
          <div className="tile-dark p-5 sm:p-6 space-y-4">
            <h3 className="font-semibold text-[19px] sm:text-[20px] text-white border-b border-white/10 pb-3">
              {t('মেমোর মোট বিল হিসাব', 'Invoice Summary')}
            </h3>
            <div className="space-y-2.5 text-[13px] text-white/75">
              <div className="flex justify-between">
                <span>{t('সাবটোটাল:', 'Subtotal:')}</span>
                <span className="text-white font-semibold">{formatTaka(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-300">
                  <span>{t('ছাড় (Discount):', 'Discount:')}</span>
                  <span>- {formatTaka(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[16px] font-semibold text-white border-t border-white/10 pt-3">
                <span>{t('মোট বিল:', 'Net Total:')}</span>
                <span className="font-semibold text-[22px] text-[#2997ff]">
                  {formatTaka(netTotal)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>{t('জমা প্রদান:', 'Paid Amount:')}</span>
                <span className="font-semibold">{formatTaka(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-white font-semibold border-t border-white/10 pt-2.5 text-[14px]">
                <span>{t('চলতি বকেয়া:', 'Balance Due:')}</span>
                <span>{formatTaka(dueAmount)}</span>
              </div>
            </div>
          </div>

          {/* Recent Sales List */}
          <div className="card-apple p-4 sm:p-5 space-y-3">
            <h4 className="text-[12px] font-semibold text-[#7a7a7a] uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>{t('সাম্প্রতিক মেমো তালিকা', 'Recent Sales Memos')}</span>
            </h4>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {sales.length === 0 ? (
                <div className="text-xs text-[#7a7a7a] text-center py-4">
                  {t('এখনো কোনো মেমো তৈরি হয়নি', 'No sales memos created yet')}
                </div>
              ) : (
                sales.slice(0, 6).map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customer_id);
                  return (
                    <div
                      key={inv.id}
                      className="p-3 bg-[#f5f5f7] rounded-[12px] border border-[#e0e0e0] hover:border-[#0066cc] text-xs flex justify-between items-center transition"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#1d1d1f] flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#0066cc] font-mono">{inv.invoice_code}</span>
                          <span className="text-[#7a7a7a] truncate">
                            ({cust?.name || t('নগদ কাস্টমার', 'Walk-in')})
                          </span>
                        </div>
                        <div className="text-[11px] text-[#7a7a7a] mt-0.5">
                          {t('বিল:', 'Total:')} {formatTaka(inv.net_total)} |{' '}
                          {t('বকেয়া:', 'Due:')} {formatTaka(inv.due_amount)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {cust && (
                          <button
                            type="button"
                            onClick={() => shareInvoiceWhatsApp(inv, cust, company)}
                            title={t('WhatsApp এ পাঠান', 'Share via WhatsApp')}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[#4e4e4e] hover:text-[#0066cc] hover:bg-white transition"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectInvoiceForPrint(inv)}
                          title={t('প্রিন্ট করুন', 'Print Memo')}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#4e4e4e] hover:text-[#0066cc] hover:bg-white transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
