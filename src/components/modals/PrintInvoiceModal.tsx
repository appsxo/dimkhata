// ====================================================================
// DIMKHATA (ডিমখাতা) — Printable Invoice & Delivery Challan Modal
// High-Fidelity 80mm POS & A4 Printable View with WhatsApp Share
// ====================================================================

import React, { useState } from 'react';
import { X, Printer, Share2, Truck, Receipt } from 'lucide-react';
import { SalesInvoice, Customer, CompanySettings, EggCategory } from '../../types';
import { formatTaka, toBengaliNumber } from '../../lib/egg-units';
import { shareInvoiceWhatsApp } from '../../lib/whatsapp-share';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SalesInvoice | null;
  customer: Customer | null;
  company: CompanySettings;
  categories: EggCategory[];
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customer,
  company,
  categories,
}) => {
  if (!isOpen || !invoice || !customer) return null;

  const [activeTab, setActiveTab] = useState<'INVOICE' | 'CHALLAN'>('INVOICE');

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    shareInvoiceWhatsApp(invoice, customer, company);
  };

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name_bn || 'ডিম';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Controls Bar (Hidden during print) */}
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('INVOICE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'INVOICE'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>বিক্রয় মেমো (Invoice)</span>
            </button>
            {invoice.challan && (
              <button
                onClick={() => setActiveTab('CHALLAN')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'CHALLAN'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>ডেলিভারি চালান (Challan)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp পাঠান</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-slate-200 max-w-xl w-full text-slate-900 font-sans print-card">
            {/* Header: Company Info */}
            <div className="text-center border-b pb-4 border-slate-300">
              <div className="text-2xl font-black text-amber-800 tracking-tight">
                {company.company_name_bn}
              </div>
              <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                {company.company_name_en}
              </div>
              <div className="text-xs text-slate-600 mt-1">{company.tagline}</div>
              <div className="text-xs text-slate-600">{company.address}</div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">
                মোবাইল: {toBengaliNumber(company.phone)}
              </div>
            </div>

            {/* Document Title Badge */}
            <div className="my-3 text-center">
              <span className="inline-block px-4 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-full font-bold text-sm">
                {activeTab === 'INVOICE' ? 'বিক্রয় মেমো (Cash / Credit Memo)' : 'ডেলিভারি চালান (Delivery Challan)'}
              </span>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-slate-200">
              <div>
                <div>
                  <span className="text-slate-500 font-medium">কাস্টমার আইডি: </span>
                  <span className="font-bold text-slate-800">{customer.customer_code}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">নাম: </span>
                  <span className="font-bold text-slate-900">{customer.name}</span>
                </div>
                {customer.business_name && (
                  <div>
                    <span className="text-slate-500 font-medium">প্রতিষ্ঠান: </span>
                    <span className="font-medium text-slate-700">{customer.business_name}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 font-medium">মোবাইল: </span>
                  <span>{toBengaliNumber(customer.phone)}</span>
                </div>
              </div>

              <div className="text-right">
                <div>
                  <span className="text-slate-500 font-medium">মেমো নং: </span>
                  <span className="font-bold text-amber-800">{invoice.invoice_code}</span>
                </div>
                {invoice.challan && (
                  <div>
                    <span className="text-slate-500 font-medium">চালান নং: </span>
                    <span className="font-bold text-blue-800">{invoice.challan.challan_code}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 font-medium">তারিখ: </span>
                  <span className="font-semibold text-slate-800">
                    {toBengaliNumber(invoice.invoice_date)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">ধরন: </span>
                  <span className="font-bold text-slate-800">
                    {invoice.sale_type === 'WHOLESALE' ? 'পাইকারি বিক্রয়' : 'খুচরা বিক্রয়'}
                  </span>
                </div>
              </div>
            </div>

            {/* If Challan tab active, show vehicle details */}
            {activeTab === 'CHALLAN' && invoice.challan && (
              <div className="my-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                <div className="font-bold text-blue-900">গাড়ি ও ডেলিভারি বিবরণ:</div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>গাড়ির নম্বর: {invoice.challan.vehicle_number || 'ভ্যান / পিকআপ'}</div>
                  <div>ড্রাইভারের নাম: {invoice.challan.driver_name || 'নির্ধারিত নয়'}</div>
                  <div>ড্রাইভারের ফোন: {invoice.challan.driver_phone || '---'}</div>
                  <div>গন্তব্য ঠিকানা: {invoice.challan.destination_address || customer.present_address || 'দোকান'}</div>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="mt-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-600 bg-slate-50">
                    <th className="py-1.5 px-2 text-left font-bold">ক্রঃ</th>
                    <th className="py-1.5 px-2 text-left font-bold">ডিমের বিবরণ</th>
                    <th className="py-1.5 px-2 text-center font-bold">পরিমাণ (পিস)</th>
                    {activeTab === 'INVOICE' && (
                      <>
                        <th className="py-1.5 px-2 text-right font-bold">দর (টাকা)</th>
                        <th className="py-1.5 px-2 text-right font-bold">মোট বিল</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2 text-slate-500">{toBengaliNumber(idx + 1)}</td>
                      <td className="py-2 px-2 font-medium text-slate-900">
                        {getCategoryName(item.category_id)}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-800">
                        {toBengaliNumber(item.qty_pcs)}
                      </td>
                      {activeTab === 'INVOICE' && (
                        <>
                          <td className="py-2 px-2 text-right text-slate-700">
                            {formatTaka(item.unit_price_pc)}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900">
                            {formatTaka(item.total_price)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Due Summary (Invoice only) */}
            {activeTab === 'INVOICE' && (
              <div className="mt-4 pt-3 border-t-2 border-slate-300 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>সাবটোটাল:</span>
                    <span className="font-semibold">{formatTaka(invoice.subtotal)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>ছাড় / ডিসকাউন্ট:</span>
                      <span className="font-semibold">- {formatTaka(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-1 text-slate-900">
                    <span>মোট প্রদেয় বিল:</span>
                    <span className="text-amber-800">{formatTaka(invoice.net_total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>জমা / পরিশোধ:</span>
                    <span>{formatTaka(invoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1">
                    <span>চলতি মেমোর বকেয়া:</span>
                    <span>{formatTaka(invoice.due_amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-bold bg-amber-50 p-1.5 rounded border border-amber-200">
                    <span>সর্বমোট বর্তমান বকেয়া:</span>
                    <span>{formatTaka(customer.current_due)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Signatures */}
            <div className="mt-12 pt-4 grid grid-cols-2 text-center text-xs text-slate-600 border-t border-dashed border-slate-300">
              <div>
                <div className="border-t border-slate-400 w-36 mx-auto mb-1"></div>
                <span>গ্রহীতার স্বাক্ষর</span>
              </div>
              <div>
                <div className="border-t border-slate-400 w-36 mx-auto mb-1"></div>
                <span>কর্তৃপক্ষের স্বাক্ষর</span>
              </div>
            </div>

            <div className="mt-6 text-center text-[10px] text-slate-400 border-t pt-2">
              {company.invoice_footer_note}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
