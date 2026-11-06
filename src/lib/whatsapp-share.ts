// ====================================================================
// DIMKHATA (ডিমখাতা) — WhatsApp & SMS Bangla Share Utility
// Zero cost customer communication via WhatsApp Click-to-Chat
// ====================================================================

import { Customer, SalesInvoice, DeliveryChallan, CompanySettings } from '../types';
import { formatTaka, toBengaliNumber } from './egg-units';

export function shareDueReminderWhatsApp(
  customer: Customer,
  company: CompanySettings
): void {
  const phone = customer.phone.replace(/[^0-9]/g, '');
  const internationalPhone = phone.startsWith('88') ? phone : `88${phone}`;

  const message = `আসসালামু আলাইকুম ${customer.name} ভাই,
${company.company_name_bn}-এর পক্ষ থেকে সালাম।

আপনার কাস্টমার আইডি: ${customer.customer_code}
বর্তমান মোট বকেয়া: ${formatTaka(customer.current_due)}

অনুগ্রহ করে সুবিধাজনক সময়ে উক্ত বকেয়া পরিশোধ করার জন্য অনুরোধ করা হলো।
বিকাশ/নগদ/ব্যাংক অথবা সরাসরি দোকানে পরিশোধ করতে পারেন।

ধন্যবাদান্তে,
${company.company_name_bn}
মোবাইল: ${company.phone}`;

  const encodedUrl = `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, '_blank');
}

export function shareInvoiceWhatsApp(
  invoice: SalesInvoice,
  customer: Customer,
  company: CompanySettings
): void {
  const phone = customer.phone.replace(/[^0-9]/g, '');
  const internationalPhone = phone.startsWith('88') ? phone : `88${phone}`;

  const itemsSummary = invoice.items
    .map((item, idx) => `${toBengaliNumber(idx + 1)}. ${toBengaliNumber(item.qty_pcs)} পিস @ ${formatTaka(item.unit_price_pc)} = ${formatTaka(item.total_price)}`)
    .join('\n');

  const message = `আসসালামু আলাইকুম ${customer.name} ভাই,
${company.company_name_bn} থেকে আপনার বিক্রয় মেমো:

মেমো নং: ${invoice.invoice_code}
তারিখ: ${invoice.invoice_date}
ধরন: ${invoice.sale_type === 'WHOLESALE' ? 'পাইকারি' : 'খুচরা'}

বিবরণ:
${itemsSummary}

-------------------------
মোট বিল: ${formatTaka(invoice.net_total)}
জমা: ${formatTaka(invoice.paid_amount)}
বকেয়া: ${formatTaka(invoice.due_amount)}
-------------------------
বর্তমান অবশিষ্ট বকেয়া: ${formatTaka(customer.current_due)}

ধন্যবাদান্তে,
${company.company_name_bn}
মোবাইল: ${company.phone}`;

  const encodedUrl = `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, '_blank');
}
