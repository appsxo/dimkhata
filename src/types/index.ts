// ====================================================================
// DIMKHATA (ডিমখাতা) — Core TypeScript Types & Models
// Business: Sharif & Eman Enterprise (শরিফ এন্ড ইমান এন্টারপ্রাইজ)
// ====================================================================

export type UserRole = 'ADMIN' | 'STAFF';

export interface UserProfile {
  id: string;
  employee_code?: string;
  full_name: string;
  role: UserRole;
  branch_id?: string;
  phone?: string;
  is_active: boolean;
}

export type AppLanguage = 'bn' | 'en';

export interface CompanySettings {
  id: string;
  company_name_bn: string;
  company_name_en: string;
  tagline: string;
  phone: string;
  email?: string;
  address: string;
  logo_url?: string;
  invoice_footer_note: string;
  currency_symbol: string;
  admin_pin_hash?: string;
  staff_pin_hash?: string;
}

export interface Branch {
  id: string;
  branch_code: string; // e.g., SE-BR-001
  name: string;
  address: string;
  phone?: string;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
}

export interface EggCategory {
  id: string;
  code: string; // CAT-RED, CAT-PAR, CAT-DUCK, etc.
  name_bn: string; // লাল ডিম (ফার্মের), প্যারাগন ডিম, etc.
  name_en: string;
  pcs_per_crate: number; // 30 default, 50 for quail
  color_hex: string;
  is_active: boolean;
  sort_order: number;
}

export interface DailyMarketRate {
  id: string;
  rate_date: string; // YYYY-MM-DD
  branch_id: string;
  category_id: string;
  buying_rate_pc: number;
  wholesale_rate_pc: number;
  retail_rate_pc: number;
  updated_at: string;
}

export interface InventoryStock {
  id: string;
  branch_id: string;
  category_id: string;
  qty_pcs: number;
  avg_landed_cost_per_pc: number;
  updated_at: string;
}

export interface KycDocument {
  id: string;
  doc_type: 'NID_FRONT' | 'NID_BACK' | 'PASSPORT' | 'BIRTH_CERT' | 'PHOTO' | 'TRADE_LICENSE';
  file_name: string;
  data_url: string; // WebP compressed base64 or Supabase Storage URL
  uploaded_at: string;
}

export interface Customer {
  id: string;
  customer_code: string; // SE-CUST-001
  name: string;
  business_name?: string;
  phone: string;
  emergency_phone?: string;
  customer_type: 'WHOLESALE' | 'RETAIL' | 'BOTH';
  present_address?: string;
  permanent_address?: string;
  nid_number?: string;
  kyc_docs: KycDocument[];
  credit_limit: number;
  current_due: number;
  due_alert_days: number;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  supplier_code: string; // SE-SUP-001
  name: string;
  farm_name?: string;
  phone: string;
  emergency_phone?: string;
  present_address?: string;
  permanent_address?: string;
  nid_number?: string;
  kyc_docs: KycDocument[];
  current_payable: number;
  is_active: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_code: string; // SE-EMP-001
  full_name: string;
  designation: string;
  phone: string;
  emergency_contact?: string;
  present_address?: string;
  permanent_address?: string;
  nid_number?: string;
  kyc_docs: KycDocument[];
  joining_date: string;
  salary_type: 'MONTHLY' | 'DAILY';
  base_salary: number;
  branch_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface SalaryAdvance {
  id: string;
  employee_id: string;
  advance_date: string;
  amount: number;
  purpose?: string;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  payroll_code: string; // SE-PAY-2026-0001
  employee_id: string;
  salary_month: string; // '2026-11'
  base_salary: number;
  bonus: number;
  deductions: number;
  advances_deducted: number;
  net_payable: number;
  payment_status: 'PENDING' | 'PAID';
  payment_date: string;
  created_at: string;
}

export interface FinancialAccount {
  id: string;
  name: string; // ক্যাশ ড্রয়ার, বিকাশ মার্চেন্ট, ইসলামী ব্যাংক
  account_type: 'CASH' | 'BANK' | 'MFS';
  account_number?: string;
  bank_name?: string;
  branch_id?: string;
  current_balance: number;
  is_default: boolean;
  is_active: boolean;
}

export interface CashbookTransaction {
  id: string;
  transaction_date: string;
  account_id: string;
  branch_id: string;
  transaction_type: 'CASH_IN' | 'CASH_OUT' | 'CONTRA_TRANSFER';
  category: 
    | 'SALE_COLLECTION' 
    | 'DUE_COLLECTION' 
    | 'PURCHASE_PAYMENT' 
    | 'EXPENSE' 
    | 'SALARY' 
    | 'PARTNER_DRAWING' 
    | 'CAPITAL_ASSET' 
    | 'INITIAL_BALANCE';
  amount: number;
  reference_id?: string; // Invoice code, Purchase code
  description?: string;
  recorded_by?: string;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  category_id: string;
  qty_pcs: number;
  raw_rate_per_pc: number;
  raw_total: number;
  landed_cost_share: number;
  effective_landed_cost_per_pc: number;
}

export interface Purchase {
  id: string;
  purchase_code: string; // SE-PUR-2026-0001
  purchase_date: string;
  supplier_id: string;
  branch_id: string;
  total_eggs_pcs: number;
  raw_subtotal: number;
  truck_fare: number;
  labor_cost: number;
  other_cost: number;
  total_landed_cost: number;
  paid_amount: number;
  due_amount: number;
  payment_account_id?: string;
  notes?: string;
  items: PurchaseItem[];
  created_at: string;
}

export interface SalesItem {
  id: string;
  invoice_id: string;
  category_id: string;
  qty_pcs: number;
  unit_price_pc: number;
  total_price: number;
  cogs_landed_cost_per_pc: number;
}

export interface DeliveryChallan {
  id: string;
  challan_code: string; // SE-CHL-2026-0001
  invoice_id: string;
  challan_date: string;
  vehicle_type?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  destination_address?: string;
  notes?: string;
  created_at: string;
}

export interface SalesInvoice {
  id: string;
  invoice_code: string; // SE-INV-2026-0001
  invoice_date: string;
  customer_id: string;
  branch_id: string;
  sale_type: 'WHOLESALE' | 'RETAIL';
  subtotal: number;
  discount: number;
  net_total: number;
  paid_amount: number;
  due_amount: number;
  payment_account_id?: string;
  payment_method: 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | 'DUE';
  has_challan?: boolean;
  notes?: string;
  items: SalesItem[];
  challan?: DeliveryChallan;
  created_at: string;
}

export interface StockAdjustment {
  id: string;
  adjustment_code: string; // SE-ADJ-2026-0001
  adjustment_date: string;
  branch_id: string;
  category_id: string;
  adjustment_type: 'WASTAGE_BROKEN' | 'WASTAGE_ROTTEN' | 'COURTESY_GIFT' | 'BRANCH_TRANSFER';
  qty_pcs: number;
  unit_landed_cost: number;
  total_cost_value: number;
  recipient_or_reason?: string;
  target_branch_id?: string;
  created_at: string;
}

export interface CustomerDueCollection {
  id: string;
  receipt_code: string; // SE-REC-2026-0001
  customer_id: string;
  branch_id: string;
  collection_date: string;
  amount: number;
  payment_account_id: string;
  note?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_code: string; // SE-EXP-2026-0001
  branch_id: string;
  expense_category: 'FIXED' | 'VARIABLE' | 'CAPITAL_ASSET' | 'MISC';
  title: string;
  amount: number;
  account_id: string;
  expense_date: string;
  is_capital_asset: boolean;
  notes?: string;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string; // শরিফ (Sharif), ইমান (Eman)
  phone?: string;
  share_weight: number; // e.g. Sharif: 2, Eman: 1
  is_active: boolean;
}

export interface PartnerDrawing {
  id: string;
  partner_id: string;
  drawing_date: string;
  amount: number;
  account_id: string;
  notes?: string;
  created_at: string;
}

export interface MonthlySettlement {
  id: string;
  settlement_month: string; // '2026-11'
  total_sales_revenue: number;
  total_cogs: number;
  gross_profit: number;
  total_operating_expenses: number;
  total_salaries: number;
  total_wastage_loss: number;
  total_courtesy_loss: number;
  net_profit: number;
  distribution: {
    partner_id: string;
    partner_name: string;
    weight: number;
    share_percentage: number;
    gross_share: number;
    drawings_deducted: number;
    net_payable: number;
  }[];
  is_locked: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_name: string;
  actor_role: string;
  entity_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  summary: string;
  timestamp: string;
}
