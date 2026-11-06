// ====================================================================
// DIMKHATA (ডিমখাতা) — Sales POS Memo & Delivery Challan Engine (Req 9, 10)
// ====================================================================

import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Printer,
  Share2,
  Truck,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Search,
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
import { formatQuantityPcs, formatTaka, toBengaliNumber } from '../lib/egg-units';
import { shareInvoiceWhatsApp } from '../lib/whatsapp-share';

interface SalesPosViewProps {
  customers: Customer[];
  categories: EggCategory[];
  rates: DailyMarketRate[];
  stocks: InventoryStock[];
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
  branches,
  accounts,
  sales,
  company,
  onRefresh,
  onSelectInvoiceForPrint,
}) => {
  // Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [saleType, setSaleType] = useState<'WHOLESALE' | 'RETAIL'>('WHOLESALE');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Items
  const [items, setItems] = useState<
    { categoryId: string; inputType: 'CRATE' | 'PCS'; qtyInput: number; unitPrice: number }[]
  >([
    {
      categoryId: categories[0]?.id || '',
      inputType: 'CRATE',
      qtyInput: 10, // 10 crates = 300 pcs
      unitPrice: rates.find((r) => r.category_id === categories[0]?.id)?.wholesale_rate_pc || 10.80,
    },
  ]);

  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<SalesInvoice['payment_method']>('CASH');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Delivery Challan toggle & details
  const [includeChallan, setIncludeChallan] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Helper to calculate total pieces for an item row
  const getItemPcs = (item: { categoryId: string; inputType: 'CRATE' | 'PCS'; qtyInput: number }) => {
    const cat = categories.find((c) => c.id === item.categoryId);
    const crateSize = cat?.pcs_per_crate || 30;
    return item.inputType === 'CRATE' ? item.qtyInput * crateSize : item.qtyInput;
  };

  // Subtotal calculation
  const subtotal = items.reduce((sum, item) => {
    const pcs = getItemPcs(item);
    return sum + pcs * (Number(item.unitPrice) || 0);
  }, 0);

  const netTotal = Math.max(0, subtotal - discount);
  const dueAmount = Math.max(0, netTotal - paidAmount);

  // Credit limit calculation & warning
  const newProjectedDue = (selectedCustomer?.current_due || 0) + dueAmount;
  const isCreditExceeded = selectedCustomer && newProjectedDue > selectedCustomer.credit_limit;

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
    // update rates in all item rows
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

    // Check stock availability
    for (const item of items) {
      const pcs = getItemPcs(item);
      const stock = stocks.find((s) => s.category_id === item.categoryId && s.branch_id === branchId);
      const cat = categories.find((c) => c.id === item.categoryId);
      if (!stock || stock.qty_pcs < pcs) {
        const proceed = confirm(
          `সতর্কবার্তা: "${cat?.name_bn}" এর স্টক ঘাটতি রয়েছে। আপনি কি ঘাটতি সত্ত্বেও বিক্রয় সম্পন্ন করতে চান?`
        );
        if (!proceed) return;
      }
    }

    const invoiceCode = DimKhataStore.getNextCode('INV');

    // Build items with Landed Cost snapshot for exact COGS calculation
    const salesItems: SalesItem[] = items.map((item, idx) => {
      const pcs = getItemPcs(item);
      const stock = stocks.find((s) => s.category_id === item.categoryId && s.branch_id === branchId);
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

    // Prompt user to print or view invoice
    onSelectInvoiceForPrint(newInvoice);

    // Reset items
    setPaidAmount(0);
    setDiscount(0);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-700" />
            <span>বিক্রয় মেমো ও ডেলিভারি চালান (POS System)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            পাইকারি ও খুচরা রেটে দ্রুত মেমো তৈরি, বাকির লিমিট সতর্কতা ও ১-ক্লিকে চালান প্রিন্ট
          </p>
        </div>

        {/* Wholesale vs Retail Toggle */}
        <div className="flex items-center bg-slate-200 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => handleSaleTypeChange('WHOLESALE')}
            className={`px-4 py-1.5 rounded-lg transition ${
              saleType === 'WHOLESALE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            পাইকারি বিক্রয়
          </button>
          <button
            type="button"
            onClick={() => handleSaleTypeChange('RETAIL')}
            className={`px-4 py-1.5 rounded-lg transition ${
              saleType === 'RETAIL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            খুচরা বিক্রয়
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Memo Form (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কাস্টমার নির্বাচন (SE-CUST)
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customer_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শাখা / গোডাউন
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  তারিখ
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Credit Limit Alert Banner (Req 10) */}
            {selectedCustomer && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  isCreditExceeded
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-amber-50/60 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCreditExceeded ? (
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>
                    বর্তমান বকেয়া: <strong>{formatTaka(selectedCustomer.current_due)}</strong> | বাকির সীমা (Credit Limit): <strong>{formatTaka(selectedCustomer.credit_limit)}</strong>
                  </span>
                </div>
                {isCreditExceeded && (
                  <span className="font-bold text-rose-700 text-[11px] animate-pulse">
                    ⚠️ বাকির সীমা অতিক্রম করেছে!
                  </span>
                )}
              </div>
            )}

            {/* Item Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  বিক্রয়কৃত ডিমের তালিকা (Egg Items)
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
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
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-4">
                        <select
                          value={item.categoryId}
                          onChange={(e) => handleCategoryChange(idx, e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
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
                          className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
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
                          className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                        >
                          <option value="CRATE">খাঁচি ({cat?.pcs_per_crate || 30})</option>
                          <option value="PCS">পিস</option>
                        </select>
                        <span className="text-[11px] text-slate-400 font-mono">
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
                            className="w-full p-1.5 pl-6 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                          />
                          <span className="absolute left-2 top-1.5 text-xs text-slate-400">৳</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {formatTaka(pcs * item.unitPrice)}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs px-1"
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

            {/* Challan Section Checkbox (Req 9) */}
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeChallan}
                  onChange={(e) => setIncludeChallan(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-700" />
                  <span>এই অর্ডারের জন্য আলাদা ডেলিভারি চালান প্রিন্ট করুন (Challan)</span>
                </span>
              </label>

              {includeChallan && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="গাড়ি / ভ্যান নম্বর"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="p-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="ড্রাইভারের নাম"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="p-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="ড্রাইভারের ফোন"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="p-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>

            {/* Payment & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিশেষ ছাড় / ডিসকাউন্ট
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">৳</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নগদ জমা / পেইড
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">৳</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পেমেন্ট মাধ্যম
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                >
                  <option value="CASH">ক্যাশ নগদ</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                  <option value="BANK">ব্যাংক একাউন্ট</option>
                  <option value="DUE">সম্পূর্ণ বাকি</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>মেমো তৈরি করুন ও প্রিন্ট ভিউ দেখুন</span>
            </button>
          </form>
        </div>

        {/* Right Summary & Recent Invoices List */}
        <div className="space-y-4">
          {/* Bill Summary */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="font-bold text-base text-amber-300 border-b border-slate-800 pb-2">
              মেমোর মোট বিল হিসাব
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>সাবটোটাল:</span>
                <span className="font-semibold">{formatTaka(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>ছাড় (Discount):</span>
                  <span>- {formatTaka(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white border-t border-slate-800 pt-2">
                <span>মোট বিল:</span>
                <span className="text-amber-400">{formatTaka(netTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>জমা প্রদান:</span>
                <span>{formatTaka(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-bold border-t border-slate-800 pt-2 text-sm">
                <span>চলতি বকেয়া:</span>
                <span>{formatTaka(dueAmount)}</span>
              </div>
            </div>
          </div>

          {/* Recent Sales List */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span>আজকের মেমো তালিকা</span>
            </h4>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {sales.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">
                  কোনো মেমো তৈরি হয়নি
                </div>
              ) : (
                sales.slice(0, 6).map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customer_id);
                  return (
                    <div
                      key={inv.id}
                      className="p-2.5 bg-slate-50 hover:bg-amber-50/40 rounded-xl border border-slate-200 text-xs flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{inv.invoice_code}</span>
                          <span className="text-[10px] text-slate-400">({cust?.name})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          বিল: {formatTaka(inv.net_total)} | বকেয়া: {formatTaka(inv.due_amount)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (cust) shareInvoiceWhatsApp(inv, cust, company);
                          }}
                          title="WhatsApp এ পাঠান"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectInvoiceForPrint(inv)}
                          title="প্রিন্ট করুন"
                          className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
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
