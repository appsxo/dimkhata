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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white rounded-t-[20px] sm:rounded-[18px] border border-[#e0e0e0] max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Controls Bar (Hidden during print) */}
        <div className="px-4 sm:px-5 py-3 bg-[#f5f5f7] border-b border-[#e0e0e0] text-[#1d1d1f] flex items-center justify-between gap-2 flex-wrap no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('INVOICE')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[980px] text-[12px] font-semibold transition ${
                activeTab === 'INVOICE'
                  ? 'bg-[#0066cc] text-white'
                  : 'bg-white text-[#1d1d1f] border border-[#d2d2d7] hover:border-[#0066cc]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>বিক্রয় মেমো (Invoice)</span>
            </button>
            {invoice.challan && (
              <button
                onClick={() => setActiveTab('CHALLAN')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[980px] text-[12px] font-semibold transition ${
                  activeTab === 'CHALLAN'
                    ? 'bg-[#0066cc] text-white'
                    : 'bg-white text-[#1d1d1f] border border-[#d2d2d7] hover:border-[#0066cc]'
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
              className="btn-outline px-3.5 py-1.5 text-[12px] min-h-[38px]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp পাঠান</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary px-4 py-1.5 text-[12px] min-h-[38px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="btn-icon-circle text-[#1d1d1f]"
              aria-label="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-[#f5f5f7] flex justify-center">
          <div className="bg-white p-6 sm:p-8 rounded-[18px] border border-[#e0e0e0] max-w-xl w-full text-[#1d1d1f] font-sans print-card">
            {/* Header: Company Info */}
            <div className="text-center border-b pb-4 border-[#e0e0e0]">
              <div className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">
                {company.company_name_bn}
              </div>
              <div className="text-xs font-sans font-semibold text-[#7a7a7a] tracking-wider uppercase mt-0.5">
                {company.company_name_en}
              </div>
              <div className="text-xs text-[#4e4e4e] mt-1">{company.tagline}</div>
              <div className="text-xs text-[#7a7a7a]">{company.address}</div>
              <div className="text-xs font-semibold text-[#1d1d1f] mt-0.5">
                মোবাইল: {toBengaliNumber(company.phone)}
              </div>
            </div>

            {/* Document Title Badge */}
            <div className="my-3 text-center">
              <span className="badge-blue px-4 py-1 text-xs">
                {activeTab === 'INVOICE' ? 'বিক্রয় মেমো (Cash / Credit Memo)' : 'ডেলিভারি চালান (Delivery Challan)'}
              </span>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-[#e0e0e0]">
              <div>
                <div>
                  <span className="text-[#7a7a7a]">কাস্টমার আইডি: </span>
                  <span className="font-semibold text-[#0066cc] font-mono">{customer.customer_code}</span>
                </div>
                <div>
                  <span className="text-[#7a7a7a]">নাম: </span>
                  <span className="font-semibold text-[#1d1d1f]">{customer.name}</span>
                </div>
                {customer.business_name && (
                  <div>
                    <span className="text-[#7a7a7a]">প্রতিষ্ঠান: </span>
                    <span className="font-semibold text-[#4e4e4e]">{customer.business_name}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#7a7a7a]">মোবাইল: </span>
                  <span>{toBengaliNumber(customer.phone)}</span>
                </div>
              </div>

              <div className="text-right">
                <div>
                  <span className="text-[#7a7a7a]">মেমো নং: </span>
                  <span className="font-semibold text-[#1d1d1f] font-mono">{invoice.invoice_code}</span>
                </div>
                {invoice.challan && (
                  <div>
                    <span className="text-[#7a7a7a]">চালান নং: </span>
                    <span className="font-semibold text-[#1d1d1f] font-mono">{invoice.challan.challan_code}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#7a7a7a]">তারিখ: </span>
                  <span className="font-semibold text-[#1d1d1f]">
                    {toBengaliNumber(invoice.invoice_date)}
                  </span>
                </div>
                <div>
                  <span className="text-[#7a7a7a]">ধরন: </span>
                  <span className="font-semibold text-[#0066cc]">
                    {invoice.sale_type === 'WHOLESALE' ? 'পাইকারি বিক্রয়' : 'খুচরা বিক্রয়'}
                  </span>
                </div>
              </div>
            </div>

            {/* If Challan tab active, show vehicle details */}
            {activeTab === 'CHALLAN' && invoice.challan && (
              <div className="my-3 p-3 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[12px] text-xs space-y-1">
                <div className="font-semibold text-[#1d1d1f]">গাড়ি ও ডেলিভারি বিবরণ:</div>
                <div className="grid grid-cols-2 gap-2 text-[#4e4e4e]">
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
                  <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] bg-[#f5f5f7]">
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
                <tbody className="divide-y divide-[#e0e0e0]">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 px-2 text-[#7a7a7a]">{toBengaliNumber(idx + 1)}</td>
                      <td className="py-2 px-2 font-semibold text-[#1d1d1f]">
                        {getCategoryName(item.category_id)}
                      </td>
                      <td className="py-2 px-2 text-center font-semibold text-[#1d1d1f]">
                        {toBengaliNumber(item.qty_pcs)}
                      </td>
                      {activeTab === 'INVOICE' && (
                        <>
                          <td className="py-2 px-2 text-right text-[#4e4e4e] font-mono">
                            {formatTaka(item.unit_price_pc)}
                          </td>
                          <td className="py-2 px-2 text-right font-semibold text-[#1d1d1f] font-mono">
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
              <div className="mt-4 pt-3 border-t border-[#e0e0e0] flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#4e4e4e]">
                    <span>সাবটোটাল:</span>
                    <span className="font-semibold font-mono">{formatTaka(invoice.subtotal)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-[#4e4e4e]">
                      <span>ছাড় / ডিসকাউন্ট:</span>
                      <span className="font-semibold font-mono">- {formatTaka(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold border-t border-[#e0e0e0] pt-1.5 text-[#1d1d1f]">
                    <span>মোট প্রদেয় বিল:</span>
                    <span className="font-mono text-[#0066cc]">{formatTaka(invoice.net_total)}</span>
                  </div>
                  <div className="flex justify-between text-[#15803d] font-semibold">
                    <span>জমা / পরিশোধ:</span>
                    <span className="font-mono">{formatTaka(invoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[#1d1d1f] font-semibold border-t border-[#e0e0e0] pt-1.5">
                    <span>চলতি মেমোর বকেয়া:</span>
                    <span className="font-mono">{formatTaka(invoice.due_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[#1d1d1f] font-semibold bg-[#f5f5f7] p-2 rounded-[10px] border border-[#e0e0e0] mt-1">
                    <span>সর্বমোট বর্তমান বকেয়া:</span>
                    <span className="font-mono">{formatTaka(customer.current_due)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Signatures */}
            <div className="mt-12 pt-4 grid grid-cols-2 text-center text-xs text-[#7a7a7a] border-t border-dashed border-[#d2d2d7]">
              <div>
                <div className="border-t border-[#7a7a7a] w-36 mx-auto mb-1"></div>
                <span>গ্রহীতার স্বাক্ষর</span>
              </div>
              <div>
                <div className="border-t border-[#7a7a7a] w-36 mx-auto mb-1"></div>
                <span>কর্তৃপক্ষের স্বাক্ষর</span>
              </div>
            </div>

            <div className="mt-6 text-center text-[11px] text-[#7a7a7a] border-t border-[#e0e0e0] pt-2">
              {company.invoice_footer_note}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
