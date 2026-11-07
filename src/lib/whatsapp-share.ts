import { Customer, SalesInvoice, CompanySettings } from '../types';
import { formatTaka, toBengaliNumber } from './egg-units';

export function shareDueReminderWhatsApp(customer: Customer, company: CompanySettings): void {
  const phone = (customer.phone || '').replace(/[^0-9]/g, '');
  const target = phone ? (phone.startsWith('88') ? phone : `88${phone}`) : '';

  const message = `আসসালামু আলাইকুম ${customer.name},
${company.company_name_bn}
কাস্টমার আইডি: ${customer.customer_code}
বর্তমান বকেয়া: ${formatTaka(customer.current_due)}

অনুগ্রহ করে সুবিধাজনক সময়ে বকেয়া পরিশোধ করার অনুরোধ রইল।
মোবাইল: ${company.phone}`;

  window.open(`https://wa.me/${target}?text=${encodeURIComponent(message)}`, '_blank');
}

export function shareInvoiceWhatsApp(
  invoice: SalesInvoice,
  customer: Customer | null,
  company: CompanySettings
): void {
  const custName = customer?.name || 'নগদ ক্রেতা';
  const phone = (customer?.phone || '').replace(/[^0-9]/g, '');
  const target = phone ? (phone.startsWith('88') ? phone : `88${phone}`) : '';

  const itemsSummary = invoice.items
    .map(
      (item, idx) =>
        `${toBengaliNumber(idx + 1)}. ${toBengaliNumber(item.qty_pcs)} পিস @ ${formatTaka(item.unit_price_pc)} = ${formatTaka(item.total_price)}`
    )
    .join('\n');

  const message = `${company.company_name_bn}
মেমো: ${invoice.invoice_code} (${invoice.invoice_date})
গ্রাহক: ${custName}

${itemsSummary}
-----------------
মোট বিল: ${formatTaka(invoice.net_total)}
জমা: ${formatTaka(invoice.paid_amount)}
বকেয়া: ${formatTaka(invoice.due_amount)}
মোবাইল: ${company.phone}`;

  window.open(`https://wa.me/${target}?text=${encodeURIComponent(message)}`, '_blank');
}
