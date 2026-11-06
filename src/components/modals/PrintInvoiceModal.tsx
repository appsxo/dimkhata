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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Controls Bar (Hidden during print) */}
        <div className="px-5 py-3 bg-[#f5f5f5] border-b border-stone-200 text-stone-900 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('INVOICE')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                activeTab === 'INVOICE'
                  ? 'bg-[#292524] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>বিক্রয় মেমো (Invoice)</span>
            </button>
            {invoice.challan && (
              <button
                onClick={() => setActiveTab('CHALLAN')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  activeTab === 'CHALLAN'
                    ? 'bg-[#292524] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-50'
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
              className="btn-outline flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp পাঠান</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-200/60 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-6 overflow-y-auto bg-stone-100 flex justify-center">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-stone-200 max-w-xl w-full text-stone-900 font-sans print-card">
            {/* Header: Company Info */}
            <div className="text-center border-b pb-4 border-stone-200">
              <div className="text-2xl font-serif font-light text-[#0c0a09] tracking-tight">
                {company.company_name_bn}
              </div>
              <div className="text-xs font-sans font-medium text-stone-500 tracking-wider uppercase mt-0.5">
                {company.company_name_en}
              </div>
              <div className="text-xs text-stone-600 mt-1">{company.tagline}</div>
              <div className="text-xs text-stone-500">{company.address}</div>
              <div className="text-xs font-medium text-stone-700 mt-0.5">
                মোবাইল: {toBengaliNumber(company.phone)}
              </div>
            </div>

            {/* Document Title Badge */}
            <div className="my-3 text-center">
              <span className="inline-block px-4 py-1 bg-stone-100 border border-stone-300 text-stone-800 rounded-full font-medium text-xs tracking-wide">
                {activeTab === 'INVOICE' ? 'বিক্রয় মেমো (Cash / Credit Memo)' : 'ডেলিভারি চালান (Delivery Challan)'}
              </span>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-stone-200">
              <div>
                <div>
                  <span className="text-stone-500 font-normal">কাস্টমার আইডি: </span>
                  <span className="font-semibold text-stone-800 font-mono">{customer.customer_code}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-normal">নাম: </span>
                  <span className="font-semibold text-stone-900">{customer.name}</span>
                </div>
                {customer.business_name && (
                  <div>
                    <span className="text-stone-500 font-normal">প্রতিষ্ঠান: </span>
                    <span className="font-medium text-stone-700">{customer.business_name}</span>
                  </div>
                )}
                <div>
                  <span className="text-stone-500 font-normal">মোবাইল: </span>
                  <span>{toBengaliNumber(customer.phone)}</span>
                </div>
              </div>

              <div className="text-right">
                <div>
                  <span className="text-stone-500 font-normal">মেমো নং: </span>
                  <span className="font-semibold text-stone-900 font-mono">{invoice.invoice_code}</span>
                </div>
                {invoice.challan && (
                  <div>
                    <span className="text-stone-500 font-normal">চালান নং: </span>
                    <span className="font-semibold text-stone-900 font-mono">{invoice.challan.challan_code}</span>
                  </div>
                )}
                <div>
                  <span className="text-stone-500 font-normal">তারিখ: </span>
                  <span className="font-medium text-stone-800">
                    {toBengaliNumber(invoice.invoice_date)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 font-normal">ধরন: </span>
                  <span className="font-semibold text-stone-800">
                    {invoice.sale_type === 'WHOLESALE' ? 'পাইকারি বিক্রয়' : 'খুচরা বিক্রয়'}
                  </span>
                </div>
              </div>
            </div>

            {/* If Challan tab active, show vehicle details */}
            {activeTab === 'CHALLAN' && invoice.challan && (
              <div className="my-3 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-stone-900">গাড়ি ও ডেলিভারি বিবরণ:</div>
                <div className="grid grid-cols-2 gap-2 text-stone-700">
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
                  <tr className="border-b border-stone-300 text-stone-600 bg-stone-50/60">
                    <th className="py-2 px-2 text-left font-semibold">ক্রঃ</th>
                    <th className="py-2 px-2 text-left font-semibold">ডিমের বিবরণ</th>
                    <th className="py-2 px-2 text-center font-semibold">পরিমাণ (পিস)</th>
                    {activeTab === 'INVOICE' && (
                      <>
                        <th className="py-2 px-2 text-right font-semibold">দর (টাকা)</th>
                        <th className="py-2 px-2 text-right font-semibold">মোট বিল</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-stone-50/50">
                      <td className="py-2 px-2 text-stone-400">{toBengaliNumber(idx + 1)}</td>
                      <td className="py-2 px-2 font-medium text-stone-900">
                        {getCategoryName(item.category_id)}
                      </td>
                      <td className="py-2 px-2 text-center font-semibold text-stone-800">
                        {toBengaliNumber(item.qty_pcs)}
                      </td>
                      {activeTab === 'INVOICE' && (
                        <>
                          <td className="py-2 px-2 text-right text-stone-600 font-mono">
                            {formatTaka(item.unit_price_pc)}
                          </td>
                          <td className="py-2 px-2 text-right font-semibold text-stone-900 font-mono">
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
              <div className="mt-4 pt-3 border-t border-stone-300 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>সাবটোটাল:</span>
                    <span className="font-medium font-mono">{formatTaka(invoice.subtotal)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>ছাড় / ডিসকাউন্ট:</span>
                      <span className="font-medium font-mono">- {formatTaka(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold border-t border-stone-200 pt-1.5 text-stone-900">
                    <span>মোট প্রদেয় বিল:</span>
                    <span className="font-mono text-[#0c0a09]">{formatTaka(invoice.net_total)}</span>
                  </div>
                  <div className="flex justify-between text-stone-700 font-medium">
                    <span>জমা / পরিশোধ:</span>
                    <span className="font-mono">{formatTaka(invoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-stone-900 font-semibold border-t border-stone-200 pt-1.5">
                    <span>চলতি মেমোর বকেয়া:</span>
                    <span className="font-mono">{formatTaka(invoice.due_amount)}</span>
                  </div>
                  <div className="flex justify-between text-stone-900 font-semibold bg-stone-100 p-2 rounded-lg border border-stone-200 mt-1">
                    <span>সর্বমোট বর্তমান বকেয়া:</span>
                    <span className="font-mono">{formatTaka(customer.current_due)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Signatures */}
            <div className="mt-12 pt-4 grid grid-cols-2 text-center text-xs text-stone-500 border-t border-dashed border-stone-300">
              <div>
                <div className="border-t border-stone-300 w-36 mx-auto mb-1"></div>
                <span>গ্রহীতার স্বাক্ষর</span>
              </div>
              <div>
                <div className="border-t border-stone-300 w-36 mx-auto mb-1"></div>
                <span>কর্তৃপক্ষের স্বাক্ষর</span>
              </div>
            </div>

            <div className="mt-6 text-center text-[11px] text-stone-400 border-t border-stone-100 pt-2">
              {company.invoice_footer_note}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
