import React, { useState } from 'react';
import { X, Printer, Share2, Truck, Receipt } from 'lucide-react';
import { SalesInvoice, Customer, CompanySettings, EggCategory } from '../../types';
import { formatTaka, toBengaliNumber } from '../../lib/egg-units';
import { useLanguage, getCategoryDisplayName } from '../../lib/i18n';
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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'INVOICE' | 'CHALLAN'>('INVOICE');

  if (!isOpen || !invoice) return null;

  const displayCustomer: Customer = customer || {
    id: 'WALK_IN',
    customer_code: 'WALK-IN',
    name: t('নগদ / খুচরা ক্রেতা', 'Walk-in Cash Customer'),
    phone: '---',
    customer_type: invoice.sale_type,
    present_address: '',
    kyc_docs: [],
    credit_limit: 0,
    current_due: 0,
    due_alert_days: 0,
    is_active: true,
    created_at: invoice.created_at,
  };

  const getCategoryName = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    return found ? getCategoryDisplayName(found) : t('ডিম', 'Eggs');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white rounded-t-[20px] sm:rounded-[18px] border border-[#e0e0e0] max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-4 py-3 bg-[#f5f5f7] border-b border-[#e0e0e0] flex items-center justify-between gap-2 flex-wrap no-print">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('INVOICE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition ${
                activeTab === 'INVOICE'
                  ? 'bg-[#0066cc] text-white'
                  : 'bg-white text-[#1d1d1f] border border-[#d2d2d7]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t('বিক্রয় মেমো', 'Invoice')}</span>
            </button>
            {invoice.challan && (
              <button
                type="button"
                onClick={() => setActiveTab('CHALLAN')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition ${
                  activeTab === 'CHALLAN'
                    ? 'bg-[#0066cc] text-white'
                    : 'bg-white text-[#1d1d1f] border border-[#d2d2d7]'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{t('ডেলিভারি চালান', 'Challan')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => shareInvoiceWhatsApp(invoice, displayCustomer, company)}
              className="btn-outline px-3 py-1.5 text-[12px] min-h-[36px]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary px-3.5 py-1.5 text-[12px] min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('প্রিন্ট', 'Print')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon-circle text-[#1d1d1f]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto bg-[#f5f5f7] flex justify-center">
          <div className="bg-white p-5 sm:p-7 rounded-[18px] border border-[#e0e0e0] max-w-xl w-full text-[#1d1d1f] font-sans print-card">
            <div className="text-center border-b pb-3 border-[#e0e0e0]">
              <div className="text-[22px] font-semibold text-[#1d1d1f]">
                {company.company_name_bn}
              </div>
              <div className="text-[11px] font-semibold text-[#7a7a7a] uppercase">
                {company.company_name_en}
              </div>
              <div className="text-xs text-[#7a7a7a] mt-0.5">{company.address}</div>
              <div className="text-xs font-semibold text-[#1d1d1f] mt-0.5">
                {t('মোবাইল:', 'Phone:')} {toBengaliNumber(company.phone)}
              </div>
            </div>

            <div className="my-2.5 text-center">
              <span className="badge-blue px-3.5 py-0.5 text-xs">
                {activeTab === 'INVOICE'
                  ? t('বিক্রয় মেমো (Invoice)', 'Sales Invoice')
                  : t('ডেলিভারি চালান (Challan)', 'Delivery Challan')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs py-2 border-b border-[#e0e0e0]">
              <div>
                <div>
                  <span className="text-[#7a7a7a]">{t('আইডি:', 'ID:')} </span>
                  <span className="font-semibold text-[#0066cc] font-mono">
                    {displayCustomer.customer_code}
                  </span>
                </div>
                <div>
                  <span className="text-[#7a7a7a]">{t('গ্রাহক:', 'Customer:')} </span>
                  <span className="font-semibold text-[#1d1d1f]">{displayCustomer.name}</span>
                </div>
                <div>
                  <span className="text-[#7a7a7a]">{t('মোবাইল:', 'Phone:')} </span>
                  <span>{toBengaliNumber(displayCustomer.phone)}</span>
                </div>
              </div>

              <div className="text-right">
                <div>
                  <span className="text-[#7a7a7a]">{t('মেমো নং:', 'Memo:')} </span>
                  <span className="font-semibold text-[#1d1d1f] font-mono">
                    {invoice.invoice_code}
                  </span>
                </div>
                {invoice.challan && (
                  <div>
                    <span className="text-[#7a7a7a]">{t('চালান নং:', 'Challan:')} </span>
                    <span className="font-semibold text-[#1d1d1f] font-mono">
                      {invoice.challan.challan_code}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[#7a7a7a]">{t('তারিখ:', 'Date:')} </span>
                  <span className="font-semibold text-[#1d1d1f]">
                    {toBengaliNumber(invoice.invoice_date)}
                  </span>
                </div>
              </div>
            </div>

            {activeTab === 'CHALLAN' && invoice.challan && (
              <div className="my-2.5 p-2.5 bg-[#f5f5f7] border border-[#e0e0e0] rounded-[10px] text-xs grid grid-cols-2 gap-1.5 text-[#4e4e4e]">
                <div>{t('গাড়ি:', 'Vehicle:')} {invoice.challan.vehicle_number || '---'}</div>
                <div>{t('ড্রাইভার:', 'Driver:')} {invoice.challan.driver_name || '---'}</div>
                <div>{t('ফোন:', 'Phone:')} {invoice.challan.driver_phone || '---'}</div>
                <div>{t('গন্তব্য:', 'Address:')} {invoice.challan.destination_address || displayCustomer.present_address || '---'}</div>
              </div>
            )}

            <div className="mt-2.5">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e0e0e0] text-[#7a7a7a] bg-[#f5f5f7]">
                    <th className="py-1.5 px-2 text-left font-semibold">#</th>
                    <th className="py-1.5 px-2 text-left font-semibold">{t('ডিমের বিবরণ', 'Item')}</th>
                    <th className="py-1.5 px-2 text-center font-semibold">{t('পিস', 'Qty (Pcs)')}</th>
                    {activeTab === 'INVOICE' && (
                      <>
                        <th className="py-1.5 px-2 text-right font-semibold">{t('দর', 'Rate')}</th>
                        <th className="py-1.5 px-2 text-right font-semibold">{t('মোট', 'Total')}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-1.5 px-2 text-[#7a7a7a]">{toBengaliNumber(idx + 1)}</td>
                      <td className="py-1.5 px-2 font-semibold text-[#1d1d1f]">
                        {getCategoryName(item.category_id)}
                      </td>
                      <td className="py-1.5 px-2 text-center font-semibold text-[#1d1d1f]">
                        {toBengaliNumber(item.qty_pcs)}
                      </td>
                      {activeTab === 'INVOICE' && (
                        <>
                          <td className="py-1.5 px-2 text-right text-[#4e4e4e] font-mono">
                            {formatTaka(item.unit_price_pc)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-semibold text-[#1d1d1f] font-mono">
                            {formatTaka(item.total_price)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {activeTab === 'INVOICE' && (
              <div className="mt-3 pt-2.5 border-t border-[#e0e0e0] flex justify-end">
                <div className="w-60 space-y-1 text-xs">
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-[#4e4e4e]">
                      <span>{t('ছাড়:', 'Discount:')}</span>
                      <span className="font-mono">- {formatTaka(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold text-[#1d1d1f]">
                    <span>{t('মোট বিল:', 'Net Total:')}</span>
                    <span className="font-mono text-[#0066cc]">{formatTaka(invoice.net_total)}</span>
                  </div>
                  <div className="flex justify-between text-[#15803d] font-semibold">
                    <span>{t('জমা:', 'Paid:')}</span>
                    <span className="font-mono">{formatTaka(invoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[#1d1d1f] font-semibold border-t border-[#e0e0e0] pt-1">
                    <span>{t('চলতি বকেয়া:', 'Invoice Due:')}</span>
                    <span className="font-mono">{formatTaka(invoice.due_amount)}</span>
                  </div>
                  {displayCustomer.current_due > 0 && (
                    <div className="flex justify-between text-[#1d1d1f] font-semibold bg-[#f5f5f7] p-1.5 rounded-[8px] border border-[#e0e0e0]">
                      <span>{t('মোট বকেয়া:', 'Total Due:')}</span>
                      <span className="font-mono">{formatTaka(displayCustomer.current_due)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-10 pt-3 grid grid-cols-2 text-center text-xs text-[#7a7a7a] border-t border-dashed border-[#d2d2d7]">
              <div>
                <div className="border-t border-[#7a7a7a] w-32 mx-auto mb-1" />
                <span>{t('গ্রহীতার স্বাক্ষর', 'Customer Signature')}</span>
              </div>
              <div>
                <div className="border-t border-[#7a7a7a] w-32 mx-auto mb-1" />
                <span>{t('কর্তৃপক্ষের স্বাক্ষর', 'Authorized Signature')}</span>
              </div>
            </div>

            <div className="mt-4 text-center text-[10px] text-[#7a7a7a] border-t border-[#e0e0e0] pt-2">
              {company.invoice_footer_note}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
