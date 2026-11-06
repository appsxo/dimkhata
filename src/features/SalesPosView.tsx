// ====================================================================
// DIMKHATA (ডিমখাতা) — Sales POS & Delivery Challan (ElevenLabs Design)
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
  const rawBranchStocks = allBranchStocks || stocks;
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [saleType, setSaleType] = useState<'WHOLESALE' | 'RETAIL'>('WHOLESALE');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  const [items, setItems] = useState<
    { categoryId: string; inputType: 'CRATE' | 'PCS'; qtyInput: number; unitPrice: number }[]
  >([
    {
      categoryId: categories[0]?.id || '',
      inputType: 'CRATE',
      qtyInput: 10,
      unitPrice: rates.find((r) => r.category_id === categories[0]?.id)?.wholesale_rate_pc || 10.80,
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

  // Sync item unit prices if daily market rates are updated from the Navbar modal
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

    if (!selectedCustomer) {
      alert('দয়া করে একজন কাস্টমার নির্বাচন করুন!');
      return;
    }

    if (items.length === 0 || subtotal <= 0) {
      alert('অন্তত একটি ডিমের আইটেম যোগ করুন!');
      return;
    }

    for (const item of items) {
      const pcs = getItemPcs(item);
      const stock = rawBranchStocks.find((s) => s.category_id === item.categoryId && s.branch_id === branchId);
      const cat = categories.find((c) => c.id === item.categoryId);
      if (!stock || stock.qty_pcs < pcs) {
        const proceed = confirm(
          `সতর্কবার্তা: "${cat?.name_bn}" এর স্টক ঘাটতি রয়েছে (বর্তমান মজুদ: ${toBengaliNumber(stock?.qty_pcs || 0)} পিস)। আপনি কি ঘাটতি সত্ত্বেও বিক্রয় সম্পন্ন করতে চান?`
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
        vehicle_type: 'পিকআপ / ভ্যান',
        vehicle_number: vehicleNumber,
        driver_name: driverName,
        driver_phone: driverPhone,
        destination_address: selectedCustomer.present_address,
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
      notes,
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
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-light text-3xl text-[#0c0a09] tracking-tight">
            বিক্রয় মেমো ও ডেলিভারি চালান (POS System)
          </h2>
          <p className="text-xs text-[#777169] mt-0.5">
            পাইকারি ও খুচরা রেটে দ্রুত মেমো তৈরি, বাকির লিমিট সতর্কতা ও ১-ক্লিকে চালান প্রিন্ট
          </p>
        </div>

        {/* Wholesale vs Retail Toggle (Pill Geometry) */}
        <div className="flex items-center bg-[#f0efed] p-1 rounded-full text-xs font-medium">
          <button
            type="button"
            onClick={() => handleSaleTypeChange('WHOLESALE')}
            className={`px-4 py-1.5 rounded-full transition ${
              saleType === 'WHOLESALE'
                ? 'bg-[#292524] text-white shadow-xs'
                : 'text-[#4e4e4e] hover:text-[#0c0a09]'
            }`}
          >
            পাইকারি বিক্রয়
          </button>
          <button
            type="button"
            onClick={() => handleSaleTypeChange('RETAIL')}
            className={`px-4 py-1.5 rounded-full transition ${
              saleType === 'RETAIL'
                ? 'bg-[#292524] text-white shadow-xs'
                : 'text-[#4e4e4e] hover:text-[#0c0a09]'
            }`}
          >
            খুচরা বিক্রয়
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Memo Form (2 Cols) */}
        <div className="lg:col-span-2 card-editorial space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  কাস্টমার নির্বাচন (SE-CUST)
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="input-editorial w-full text-xs"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customer_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  শাখা / গোডাউন
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="input-editorial w-full text-xs"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  তারিখ
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="input-editorial w-full text-xs"
                />
              </div>
            </div>

            {/* Credit Limit Alert Banner */}
            {selectedCustomer && (
              <div className="p-3 bg-[#fafafa] border border-[#e7e5e4] rounded-xl text-xs flex items-center justify-between text-[#4e4e4e]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#777169] shrink-0" />
                  <span>
                    বর্তমান বকেয়া: <strong className="text-[#0c0a09]">{formatTaka(selectedCustomer.current_due)}</strong> | বাকির সীমা: <strong className="text-[#0c0a09]">{formatTaka(selectedCustomer.credit_limit)}</strong>
                  </span>
                </div>
                {isCreditExceeded && (
                  <span className="text-[#dc2626] font-semibold text-[11px]">
                    ⚠️ বাকির সীমা অতিক্রম
                  </span>
                )}
              </div>
            )}

            {/* Item Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#0c0a09]">
                  বিক্রয়কৃত ডিমের তালিকা (Egg Items)
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn-outline text-xs h-8 px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>আইটেম যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => {
                  const pcs = getItemPcs(item);
                  const cat = categories.find((c) => c.id === item.categoryId);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-[#fafafa] border border-[#e7e5e4] rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-4">
                        <select
                          value={item.categoryId}
                          onChange={(e) => handleCategoryChange(idx, e.target.value)}
                          className="input-editorial w-full text-xs py-1.5"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name_bn}
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
                          className="input-editorial w-20 text-xs font-semibold py-1.5"
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
                          className="input-editorial text-xs py-1.5"
                        >
                          <option value="CRATE">খাঁচি ({cat?.pcs_per_crate || 30})</option>
                          <option value="PCS">পিস</option>
                        </select>
                        <span className="text-[11px] text-[#777169] font-mono">
                          ={toBengaliNumber(pcs)}
                        </span>
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
                            className="input-editorial w-full pl-6 text-xs font-semibold py-1.5"
                          />
                          <span className="absolute left-2.5 top-2 text-xs text-[#777169]">৳</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-[#0c0a09]">
                          {formatTaka(pcs * item.unitPrice)}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-[#a8a29e] hover:text-[#dc2626] text-xs px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Challan Section Checkbox */}
            <div className="p-3 bg-[#fafafa] border border-[#e7e5e4] rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeChallan}
                  onChange={(e) => setIncludeChallan(e.target.checked)}
                  className="rounded text-[#0c0a09] focus:ring-[#0c0a09] w-4 h-4"
                />
                <span className="text-xs font-medium text-[#0c0a09] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#777169]" />
                  <span>আলাদা ডেলিভারি চালান প্রিন্ট করুন (Delivery Challan)</span>
                </span>
              </label>

              {includeChallan && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="গাড়ি / ভ্যান নম্বর"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="input-editorial text-xs py-1.5"
                  />
                  <input
                    type="text"
                    placeholder="ড্রাইভারের নাম"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="input-editorial text-xs py-1.5"
                  />
                  <input
                    type="text"
                    placeholder="ড্রাইভারের ফোন"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="input-editorial text-xs py-1.5"
                  />
                </div>
              )}
            </div>

            {/* Payment & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#f0efed]">
              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  বিশেষ ছাড় / ডিসকাউন্ট
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-[#777169]">৳</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="input-editorial w-full pl-6 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#292524]">
                    নগদ জমা / পেইড
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPaidAmount(netTotal);
                      if (paymentMethod === 'DUE') handlePaymentMethodChange('CASH');
                    }}
                    className="text-[10px] font-semibold text-[#292524] bg-[#f0efed] hover:bg-[#e7e5e4] px-2 py-0.5 rounded-full transition"
                  >
                    পূর্ণ বিল
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-[#777169]">৳</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className="input-editorial w-full pl-6 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  পেমেন্ট মাধ্যম
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
                  className="input-editorial w-full text-xs"
                >
                  <option value="CASH">ক্যাশ নগদ</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                  <option value="BANK">ব্যাংক একাউন্ট</option>
                  <option value="DUE">সম্পূর্ণ বাকি</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292524] mb-1">
                  জমা একাউন্ট (সিঙ্ক)
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={paymentMethod === 'DUE' || paidAmount <= 0}
                  className="input-editorial w-full text-xs disabled:opacity-50"
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
              className="btn-primary w-full h-11"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>মেমো তৈরি করুন ও প্রিন্ট ভিউ দেখুন</span>
            </button>
          </form>
        </div>

        {/* Right Summary (Dark-Inverted Surface Card: #0c0a09) */}
        <div className="space-y-4">
          <div className="bg-[#0c0a09] text-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-serif font-light text-xl text-white border-b border-white/10 pb-3">
              মেমোর মোট বিল হিসাব
            </h3>
            <div className="space-y-2.5 text-xs text-[#a8a29e]">
              <div className="flex justify-between">
                <span>সাবটোটাল:</span>
                <span className="text-white font-medium">{formatTaka(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-300">
                  <span>ছাড় (Discount):</span>
                  <span>- {formatTaka(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-medium text-white border-t border-white/10 pt-3">
                <span>মোট বিল:</span>
                <span className="font-serif font-light text-xl text-white">{formatTaka(netTotal)}</span>
              </div>
              <div className="flex justify-between text-[#16a34a]">
                <span>জমা প্রদান:</span>
                <span className="font-medium">{formatTaka(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-white font-medium border-t border-white/10 pt-2 text-sm">
                <span>চলতি বকেয়া:</span>
                <span>{formatTaka(dueAmount)}</span>
              </div>
            </div>
          </div>

          {/* Recent Sales List */}
          <div className="card-editorial p-4 space-y-3">
            <h4 className="text-xs font-medium text-[#777169] uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>আজকের মেমো তালিকা</span>
            </h4>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {sales.length === 0 ? (
                <div className="text-xs text-[#a8a29e] text-center py-4">
                  কোনো মেমো তৈরি হয়নি
                </div>
              ) : (
                sales.slice(0, 6).map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customer_id);
                  return (
                    <div
                      key={inv.id}
                      className="p-3 bg-[#fafafa] rounded-lg border border-[#e7e5e4] hover:border-[#0c0a09] text-xs flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-medium text-[#0c0a09] flex items-center gap-1.5">
                          <span>{inv.invoice_code}</span>
                          <span className="text-[#a8a29e]">({cust?.name})</span>
                        </div>
                        <div className="text-[11px] text-[#777169] mt-0.5">
                          বিল: {formatTaka(inv.net_total)} | বকেয়া: {formatTaka(inv.due_amount)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (cust) shareInvoiceWhatsApp(inv, cust, company);
                          }}
                          title="WhatsApp এ পাঠান"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[#777169] hover:text-[#0c0a09] hover:bg-white transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectInvoiceForPrint(inv)}
                          title="প্রিন্ট করুন"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[#777169] hover:text-[#0c0a09] hover:bg-white transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
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
