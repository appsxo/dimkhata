// ====================================================================
// DIMKHATA (ডিমখাতা) — Clean Production System Defaults (Zero Dummy Data)
// Business: Sharif & Eman Enterprise (শরিফ এন্ড ইমান এন্টারপ্রাইজ)
// Source of Truth: Supabase PostgreSQL Database
// ====================================================================

import {
  CompanySettings,
  Branch,
  Partner,
  EggCategory,
  DailyMarketRate,
  InventoryStock,
  Customer,
  Supplier,
  Employee,
  FinancialAccount,
  SalesInvoice,
  Purchase,
  StockAdjustment,
  Expense,
  CashbookTransaction,
  AuditLog,
} from '../types';
import { DEFAULT_ADMIN_PIN_HASH, DEFAULT_STAFF_PIN_HASH } from './security';

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  id: 'comp-01',
  company_name_bn: 'শরিফ এন্ড ইমান এন্টারপ্রাইজ',
  company_name_en: 'Sharif & Eman Enterprise',
  tagline: 'ডিমের নির্ভরযোগ্য পাইকারি ও খুচরা আড়ৎ',
  phone: '01700-000000',
  email: 'info@sharifeman.com',
  address: 'পাইকারি ডিমের আড়ৎ, ঢাকা',
  logo_url: '',
  invoice_footer_note:
    'বিকাশ/নগদ/ব্যাংকের মাধ্যমে পরিশোধযোগ্য। ধন্যবাদান্তে — শরিফ এন্ড ইমান এন্টারপ্রাইজ।',
  currency_symbol: '৳',
  admin_pin_hash: DEFAULT_ADMIN_PIN_HASH,
  staff_pin_hash: DEFAULT_STAFF_PIN_HASH,
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br-01',
    branch_code: 'SE-BR-001',
    name: 'প্রধান আড়ৎ ও গোডাউন (Main Depot)',
    address: 'প্রধান ডিমের আড়ৎ, ঢাকা',
    phone: '',
    is_main: true,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_PARTNERS: Partner[] = [
  {
    id: 'part-01',
    name: 'শরিফ (Sharif)',
    phone: '',
    share_weight: 2.0, // 2/3 = 66.67%
    is_active: true,
  },
  {
    id: 'part-02',
    name: 'ইমান (Eman)',
    phone: '',
    share_weight: 1.0, // 1/3 = 33.33%
    is_active: true,
  },
];

// Requirement 6: 5 Default Egg Categories
export const INITIAL_EGG_CATEGORIES: EggCategory[] = [
  {
    id: 'cat-01',
    code: 'CAT-RED',
    name_bn: 'লাল ডিম (ফার্মের)',
    name_en: 'Brown Farm Layer Egg',
    pcs_per_crate: 30,
    color_hex: '#0066cc',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'cat-02',
    code: 'CAT-PAR',
    name_bn: 'প্যারাগন ডিম',
    name_en: 'Paragon Egg',
    pcs_per_crate: 30,
    color_hex: '#0066cc',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'cat-03',
    code: 'CAT-DUCK',
    name_bn: 'হাঁসের ডিম',
    name_en: 'Duck Egg',
    pcs_per_crate: 30,
    color_hex: '#0066cc',
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'cat-04',
    code: 'CAT-QUAIL',
    name_bn: 'কোয়েল পাখির ডিম',
    name_en: 'Quail Egg',
    pcs_per_crate: 50,
    color_hex: '#0066cc',
    is_active: true,
    sort_order: 4,
  },
  {
    id: 'cat-05',
    code: 'CAT-DESHI',
    name_bn: 'দেশি মুরগির ডিম',
    name_en: 'Deshi Hen Egg',
    pcs_per_crate: 30,
    color_hex: '#0066cc',
    is_active: true,
    sort_order: 5,
  },
];

const TODAY = new Date().toISOString().split('T')[0];

export const INITIAL_DAILY_RATES: DailyMarketRate[] = [
  {
    id: 'rate-01',
    rate_date: TODAY,
    branch_id: 'br-01',
    category_id: 'cat-01',
    buying_rate_pc: 0,
    wholesale_rate_pc: 0,
    retail_rate_pc: 0,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rate-02',
    rate_date: TODAY,
    branch_id: 'br-01',
    category_id: 'cat-02',
    buying_rate_pc: 0,
    wholesale_rate_pc: 0,
    retail_rate_pc: 0,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rate-03',
    rate_date: TODAY,
    branch_id: 'br-01',
    category_id: 'cat-03',
    buying_rate_pc: 0,
    wholesale_rate_pc: 0,
    retail_rate_pc: 0,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rate-04',
    rate_date: TODAY,
    branch_id: 'br-01',
    category_id: 'cat-04',
    buying_rate_pc: 0,
    wholesale_rate_pc: 0,
    retail_rate_pc: 0,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rate-05',
    rate_date: TODAY,
    branch_id: 'br-01',
    category_id: 'cat-05',
    buying_rate_pc: 0,
    wholesale_rate_pc: 0,
    retail_rate_pc: 0,
    updated_at: new Date().toISOString(),
  },
];

// Clean 0-stock initialization
export const INITIAL_INVENTORY_STOCKS: InventoryStock[] = [
  {
    id: 'stock-01',
    branch_id: 'br-01',
    category_id: 'cat-01',
    qty_pcs: 0,
    avg_landed_cost_per_pc: 0,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stock-02',
    branch_id: 'br-01',
    category_id: 'cat-02',
    qty_pcs: 0,
    avg_landed_cost_per_pc: 0,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stock-03',
    branch_id: 'br-01',
    category_id: 'cat-03',
    qty_pcs: 0,
    avg_landed_cost_per_pc: 0,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stock-04',
    branch_id: 'br-01',
    category_id: 'cat-04',
    qty_pcs: 0,
    avg_landed_cost_per_pc: 0,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stock-05',
    branch_id: 'br-01',
    category_id: 'cat-05',
    qty_pcs: 0,
    avg_landed_cost_per_pc: 0,
    updated_at: new Date().toISOString(),
  },
];

// Requirement 5: Default Accounts with 0 initial balance
export const INITIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'acc-01',
    name: 'দোকানের ক্যাশ ড্রয়ার (Main Cash)',
    account_type: 'CASH',
    account_number: 'CASH-01',
    branch_id: 'br-01',
    current_balance: 0,
    is_default: true,
    is_active: true,
  },
  {
    id: 'acc-02',
    name: 'বিকাশ একাউন্ট (bKash)',
    account_type: 'MFS',
    account_number: '',
    current_balance: 0,
    is_default: false,
    is_active: true,
  },
  {
    id: 'acc-03',
    name: 'নগদ একাউন্ট (Nagad)',
    account_type: 'MFS',
    account_number: '',
    current_balance: 0,
    is_default: false,
    is_active: true,
  },
  {
    id: 'acc-04',
    name: 'ব্যাংক একাউন্ট (Bank Account)',
    account_type: 'BANK',
    account_number: '',
    bank_name: '',
    current_balance: 0,
    is_default: false,
    is_active: true,
  },
];

// Zero dummy party or transactional records
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_PURCHASES: Purchase[] = [];
export const INITIAL_SALES: SalesInvoice[] = [];
export const INITIAL_ADJUSTMENTS: StockAdjustment[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_CASHBOOK: CashbookTransaction[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
