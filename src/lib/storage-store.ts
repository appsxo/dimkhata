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
  CustomerDueCollection,
  Expense,
  PartnerDrawing,
  CashbookTransaction,
  AuditLog,
  PayrollRecord,
  SalaryAdvance,
  UserProfile,
} from '../types';
import { calculateWeightedAverageCost } from './egg-units';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  verifyUserPin,
  sha256Hex,
  DEFAULT_ADMIN_PIN_HASH,
  DEFAULT_STAFF_PIN_HASH,
} from './security';

export type CloudSyncStatus =
  | 'INITIALIZING'
  | 'NOT_CONFIGURED'
  | 'NEEDS_SQL'
  | 'ONLINE'
  | 'OFFLINE';

const todayStr = new Date().toISOString().split('T')[0];

const DEFAULT_COMPANY: CompanySettings = {
  id: 'comp-01',
  company_name_bn: 'শরিফ এন্ড ইমান এন্টারপ্রাইজ',
  company_name_en: 'Sharif & Eman Enterprise',
  tagline: 'ডিমের নির্ভরযোগ্য পাইকারি ও খুচরা আড়ৎ',
  phone: '01711-223344',
  email: 'sharifeman.enterprise@gmail.com',
  address: 'তেজগাঁও ডিমের আড়ৎ, ঢাকা-১২০৮',
  logo_url: '',
  invoice_footer_note: 'বিকাশ/নগদ/ব্যাংকের মাধ্যমে পরিশোধযোগ্য। কোনো ডিম পরিবর্তনের দাবি ৭২ ঘণ্টার মধ্যে প্রযোজ্য।',
  currency_symbol: '৳',
};

const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'br-01',
    branch_code: 'SE-BR-001',
    name: 'প্রধান আড়ৎ (তেজগাঁও সদর)',
    address: 'তেজগাঁও ডিমের আড়ৎ, ঢাকা-১২০৮',
    phone: '01711-223344',
    is_main: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

const DEFAULT_PARTNERS: Partner[] = [
  { id: 'part-01', name: 'শরিফ (Sharif)', phone: '01711-000001', share_weight: 2.0, is_active: true },
  { id: 'part-02', name: 'ইমান (Eman)', phone: '01711-000002', share_weight: 1.0, is_active: true },
];

const DEFAULT_CATEGORIES: EggCategory[] = [
  { id: 'cat-01', code: 'RED_FARM', name_bn: 'লাল ডিম (ফার্মের)', name_en: 'Brown Farm Layer Egg', pcs_per_crate: 30, sort_order: 1, is_active: true },
  { id: 'cat-02', code: 'PARAGON', name_bn: 'প্যারাগন ডিম', name_en: 'Paragon Branded Egg', pcs_per_crate: 30, sort_order: 2, is_active: true },
  { id: 'cat-03', code: 'DUCK', name_bn: 'হাঁসের ডিম', name_en: 'Duck Egg', pcs_per_crate: 30, sort_order: 3, is_active: true },
  { id: 'cat-04', code: 'QUAIL', name_bn: 'কোয়েল পাখির ডিম', name_en: 'Quail Egg', pcs_per_crate: 50, sort_order: 4, is_active: true },
  { id: 'cat-05', code: 'DESHI_HEN', name_bn: 'দেশি মুরগির ডিম', name_en: 'Indigenous Deshi Hen Egg', pcs_per_crate: 30, sort_order: 5, is_active: true },
];

const DEFAULT_RATES: DailyMarketRate[] = [
  { id: 'rate-01', rate_date: todayStr, branch_id: 'br-01', category_id: 'cat-01', buying_rate_pc: 10.5, wholesale_rate_pc: 11.2, retail_rate_pc: 12.0, updated_at: new Date().toISOString() },
  { id: 'rate-02', rate_date: todayStr, branch_id: 'br-01', category_id: 'cat-02', buying_rate_pc: 10.8, wholesale_rate_pc: 11.5, retail_rate_pc: 12.5, updated_at: new Date().toISOString() },
  { id: 'rate-03', rate_date: todayStr, branch_id: 'br-01', category_id: 'cat-03', buying_rate_pc: 14.0, wholesale_rate_pc: 15.0, retail_rate_pc: 16.5, updated_at: new Date().toISOString() },
  { id: 'rate-04', rate_date: todayStr, branch_id: 'br-01', category_id: 'cat-04', buying_rate_pc: 3.0, wholesale_rate_pc: 3.4, retail_rate_pc: 4.0, updated_at: new Date().toISOString() },
  { id: 'rate-05', rate_date: todayStr, branch_id: 'br-01', category_id: 'cat-05', buying_rate_pc: 14.5, wholesale_rate_pc: 15.5, retail_rate_pc: 17.0, updated_at: new Date().toISOString() },
];

const DEFAULT_STOCKS: InventoryStock[] = [
  { id: 'stock-01', branch_id: 'br-01', category_id: 'cat-01', qty_pcs: 0, avg_landed_cost_per_pc: 10.5, updated_at: new Date().toISOString() },
  { id: 'stock-02', branch_id: 'br-01', category_id: 'cat-02', qty_pcs: 0, avg_landed_cost_per_pc: 10.8, updated_at: new Date().toISOString() },
  { id: 'stock-03', branch_id: 'br-01', category_id: 'cat-03', qty_pcs: 0, avg_landed_cost_per_pc: 14.0, updated_at: new Date().toISOString() },
  { id: 'stock-04', branch_id: 'br-01', category_id: 'cat-04', qty_pcs: 0, avg_landed_cost_per_pc: 3.0, updated_at: new Date().toISOString() },
  { id: 'stock-05', branch_id: 'br-01', category_id: 'cat-05', qty_pcs: 0, avg_landed_cost_per_pc: 14.5, updated_at: new Date().toISOString() },
];

const DEFAULT_ACCOUNTS: FinancialAccount[] = [
  { id: 'acc-01', name: 'দোকানের ক্যাশ ড্রয়ার (Main Cash)', account_type: 'CASH', account_number: 'CASH-01', branch_id: 'br-01', current_balance: 0, is_default: true, is_active: true },
  { id: 'acc-02', name: 'বিকাশ মার্চেন্ট (bKash)', account_type: 'MFS', account_number: '01711-223344', branch_id: 'br-01', current_balance: 0, is_default: false, is_active: true },
  { id: 'acc-03', name: 'নগদ পার্সোনাল (Nagad)', account_type: 'MFS', account_number: '01711-223344', branch_id: 'br-01', current_balance: 0, is_default: false, is_active: true },
];

export interface AuthSession {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loginTime: string | null;
}

export const AUTH_SESSION_KEY = 'dimkhata_auth_session';

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user-sharif',
    username: 'sharif',
    full_name: 'শরিফ (মালিক)',
    role: 'ADMIN',
    phone: '01711-000001',
    pin_hash: DEFAULT_ADMIN_PIN_HASH,
    is_active: true,
  },
  {
    id: 'user-eman',
    username: 'eman',
    full_name: 'ইমান (মালিক)',
    role: 'ADMIN',
    phone: '01711-000002',
    pin_hash: DEFAULT_ADMIN_PIN_HASH,
    is_active: true,
  },
  {
    id: 'user-staff',
    username: 'staff',
    full_name: 'স্টাফ / ক্যাশিয়ার',
    role: 'STAFF',
    phone: '01711-000003',
    pin_hash: DEFAULT_STAFF_PIN_HASH,
    is_active: true,
  },
];

const STORAGE_KEYS = {
  USERS: 'dimkhata_users',
  COMPANY: 'dimkhata_company',
  BRANCHES: 'dimkhata_branches',
  PARTNERS: 'dimkhata_partners',
  CATEGORIES: 'dimkhata_categories',
  DAILY_RATES: 'dimkhata_daily_rates',
  STOCKS: 'dimkhata_stocks',
  CUSTOMERS: 'dimkhata_customers',
  SUPPLIERS: 'dimkhata_suppliers',
  EMPLOYEES: 'dimkhata_employees',
  ACCOUNTS: 'dimkhata_accounts',
  PURCHASES: 'dimkhata_purchases',
  SALES: 'dimkhata_sales',
  ADJUSTMENTS: 'dimkhata_adjustments',
  DUE_COLLECTIONS: 'dimkhata_due_collections',
  EXPENSES: 'dimkhata_expenses',
  PARTNER_DRAWINGS: 'dimkhata_partner_drawings',
  SALARY_ADVANCES: 'dimkhata_salary_advances',
  PAYROLLS: 'dimkhata_payrolls',
  CASHBOOK: 'dimkhata_cashbook',
  AUDIT_LOGS: 'dimkhata_audit_logs',
  SEQUENCES: 'dimkhata_sequences',
  ACTIVE_USER: 'dimkhata_active_user',
  SELECTED_BRANCH: 'dimkhata_selected_branch',
};

const SESSION_ONLY_KEYS = new Set<string>([STORAGE_KEYS.ACTIVE_USER, STORAGE_KEYS.SELECTED_BRANCH]);
const MEMORY_DB = new Map<string, unknown>();

function cloneDefault<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function getStored<T>(key: string, defaultValue: T): T {
  if (SESSION_ONLY_KEYS.has(key)) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : cloneDefault(defaultValue);
    } catch {
      return cloneDefault(defaultValue);
    }
  }
  return MEMORY_DB.has(key) ? cloneDefault(MEMORY_DB.get(key) as T) : cloneDefault(defaultValue);
}

function pushKeyToSupabase(key: string, value: unknown): void {
  if (!isSupabaseConfigured() || !supabase || SESSION_ONLY_KEYS.has(key)) return;
  supabase
    .from('dimkhata_kv_store')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .then(
      ({ error }) => {
        if (error) {
          if (error.message.includes('dimkhata_kv_store') || error.code === '42P01' || error.code === 'PGRST205') {
            DimKhataStore.setCloudStatus('NEEDS_SQL');
          } else {
            DimKhataStore.setCloudStatus('OFFLINE');
          }
        } else {
          DimKhataStore.setCloudStatus('ONLINE');
        }
      },
      () => {
        DimKhataStore.setCloudStatus('OFFLINE');
      }
    );
}

function setStored<T>(key: string, value: T): void {
  try {
    if (SESSION_ONLY_KEYS.has(key)) {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new Event('dimkhata_storage_change'));
      return;
    }
    MEMORY_DB.set(key, cloneDefault(value));
    window.dispatchEvent(new Event('dimkhata_storage_change'));
    pushKeyToSupabase(key, value);
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

export class DimKhataStore {
  private static cloudStatus: CloudSyncStatus = isSupabaseConfigured() ? 'INITIALIZING' : 'NOT_CONFIGURED';
  private static lastSyncTimestamp: string | null = null;
  private static realtimeSubscribed = false;

  static getCloudStatus(): CloudSyncStatus {
    return this.cloudStatus;
  }

  static getLastSyncTimestamp(): string | null {
    return this.lastSyncTimestamp;
  }

  static setCloudStatus(status: CloudSyncStatus): void {
    const changed = this.cloudStatus !== status;
    this.cloudStatus = status;
    if (status === 'ONLINE') this.lastSyncTimestamp = new Date().toISOString();
    if (changed && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dimkhata_storage_change'));
    }
  }

  static getAuthSession(): AuthSession {
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, user: null, loginTime: null };
    }
    try {
      const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return { isAuthenticated: false, user: null, loginTime: null };
      const parsed = JSON.parse(raw) as AuthSession;
      if (parsed && parsed.isAuthenticated && parsed.user) {
        return parsed;
      }
      return { isAuthenticated: false, user: null, loginTime: null };
    } catch {
      return { isAuthenticated: false, user: null, loginTime: null };
    }
  }

  static getActiveUser(): UserProfile {
    const session = this.getAuthSession();
    if (session.isAuthenticated && session.user) {
      return session.user;
    }
    // Return unauthenticated fallback - never auto-elevates to Admin
    return {
      id: 'unauthenticated',
      full_name: 'অননুমোদিত ব্যবহারকারী',
      role: 'STAFF',
      is_active: false,
    };
  }

  static setActiveUser(user: UserProfile): void {
    if (typeof window !== 'undefined') {
      const session: AuthSession = {
        isAuthenticated: true,
        user,
        loginTime: new Date().toISOString(),
      };
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setStored(STORAGE_KEYS.ACTIVE_USER, user);
      window.dispatchEvent(new Event('dimkhata_auth_change'));
      window.dispatchEvent(new Event('dimkhata_storage_change'));
    }
  }

  static getUsers(): UserProfile[] {
    return getStored<UserProfile[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }

  static saveUser(user: UserProfile): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    setStored(STORAGE_KEYS.USERS, users);
    const session = this.getAuthSession();
    if (session.isAuthenticated && session.user?.id === user.id) {
      this.setActiveUser({ ...session.user, ...user });
    }
  }

  static async updateUserPin(userId: string, newPin: string): Promise<boolean> {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return false;
    const pinHash = await sha256Hex(newPin.trim());
    target.pin_hash = pinHash;
    this.saveUser(target);
    this.logAudit('Security', 'UPDATE', userId, `${target.full_name}-এর পিন সিক্রেট পরিবর্তন করা হয়েছে`);
    return true;
  }

  static async loginWithPin(
    userId: string,
    enteredPin: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId && u.is_active);
    if (!user) {
      return { success: false, error: 'ব্যবহারকারী পাওয়া যায়নি বা নিষ্ক্রিয়' };
    }

    const isValid = await verifyUserPin(user, enteredPin);
    if (!isValid) {
      return { success: false, error: 'ভুল পিন কোড! পুনরায় চেষ্টা করুন' };
    }

    this.setActiveUser(user);
    this.logAudit('Auth', 'UPDATE', user.id, `${user.full_name} (${user.role}) সফলভাবে লগইন করেছেন`);
    return { success: true, user };
  }

  static logout(): void {
    if (typeof window !== 'undefined') {
      const prevUser = this.getActiveUser();
      if (prevUser && prevUser.id !== 'unauthenticated') {
        this.logAudit('Auth', 'UPDATE', prevUser.id, `${prevUser.full_name} লগআউট করেছেন`);
      }
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
      window.dispatchEvent(new Event('dimkhata_auth_change'));
      window.dispatchEvent(new Event('dimkhata_storage_change'));
    }
  }

  static async verifyAdminPin(enteredPin: string): Promise<UserProfile | null> {
    const users = this.getUsers().filter((u) => u.role === 'ADMIN' && u.is_active);
    for (const admin of users) {
      if (await verifyUserPin(admin, enteredPin)) {
        return admin;
      }
    }
    const company = this.getCompany();
    const hash = await sha256Hex(enteredPin);
    const targetHash = company.admin_pin_hash || DEFAULT_ADMIN_PIN_HASH;
    if (hash === targetHash) {
      return users[0] || null;
    }
    return null;
  }

  static getSelectedBranchId(): string {
    return getStored<string>(STORAGE_KEYS.SELECTED_BRANCH, 'ALL');
  }

  static setSelectedBranchId(branchId: string): void {
    setStored(STORAGE_KEYS.SELECTED_BRANCH, branchId);
  }

  static getNextCode(prefix: 'EMP' | 'CUST' | 'SUP' | 'INV' | 'CHL' | 'PUR' | 'ADJ' | 'EXP' | 'REC' | 'PAY' | 'SPAY'): string {
    const seqs = getStored<Record<string, number>>(STORAGE_KEYS.SEQUENCES, {});
    const currentYear = new Date().getFullYear();
    const nextVal = (seqs[prefix] || 0) + 1;
    seqs[prefix] = nextVal;
    setStored(STORAGE_KEYS.SEQUENCES, seqs);

    if (prefix === 'EMP' || prefix === 'CUST' || prefix === 'SUP') {
      return `SE-${prefix}-${String(nextVal).padStart(3, '0')}`;
    }
    return `SE-${prefix}-${currentYear}-${String(nextVal).padStart(4, '0')}`;
  }

  static logAudit(entityName: string, action: 'INSERT' | 'UPDATE' | 'DELETE', recordId: string, summary: string): void {
    const user = this.getActiveUser();
    const logs = getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    logs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actor_name: user.full_name,
      actor_role: user.role,
      entity_name: entityName,
      action,
      record_id: recordId,
      summary,
      timestamp: new Date().toISOString(),
    });
    if (logs.length > 500) logs.pop();
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  static getCompany(): CompanySettings {
    return getStored<CompanySettings>(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
  }

  static updateCompany(settings: CompanySettings): void {
    setStored(STORAGE_KEYS.COMPANY, settings);
    this.logAudit('Company Settings', 'UPDATE', settings.id, 'প্রতিষ্ঠানের তথ্য আপডেট করা হয়েছে');
  }

  static getBranches(): Branch[] {
    return getStored<Branch[]>(STORAGE_KEYS.BRANCHES, DEFAULT_BRANCHES);
  }

  static addBranch(branch: Omit<Branch, 'id' | 'created_at'>): Branch {
    const branches = this.getBranches();
    const newBranch: Branch = { ...branch, id: `br-${Date.now()}`, created_at: new Date().toISOString() };
    branches.push(newBranch);
    setStored(STORAGE_KEYS.BRANCHES, branches);
    this.logAudit('Branches', 'INSERT', newBranch.branch_code, `নতুন শাখা যোগ: ${newBranch.name}`);
    return newBranch;
  }

  static getPartners(): Partner[] {
    return getStored<Partner[]>(STORAGE_KEYS.PARTNERS, DEFAULT_PARTNERS);
  }

  static updatePartnerWeight(partnerId: string, newWeight: number): void {
    const partners = this.getPartners();
    const partner = partners.find((p) => p.id === partnerId);
    if (partner) {
      partner.share_weight = Number(newWeight) || 1;
      setStored(STORAGE_KEYS.PARTNERS, partners);
      this.logAudit('Partners', 'UPDATE', partnerId, `${partner.name}-এর লভ্যাংশ অনুপাত: ${newWeight}`);
    }
  }

  static getCategories(): EggCategory[] {
    return getStored<EggCategory[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }

  static getDailyRates(dateStr?: string): DailyMarketRate[] {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const rates = getStored<DailyMarketRate[]>(STORAGE_KEYS.DAILY_RATES, DEFAULT_RATES);
    const todayMatches = rates.filter((r) => r.rate_date === targetDate);
    if (todayMatches.length > 0) return todayMatches;
    return rates.length > 0 ? rates.slice(0, 5) : DEFAULT_RATES;
  }

  static setDailyRates(newRates: DailyMarketRate[]): void {
    const rates = getStored<DailyMarketRate[]>(STORAGE_KEYS.DAILY_RATES, DEFAULT_RATES);
    const filtered = rates.filter(
      (r) => !newRates.some((nr) => nr.rate_date === r.rate_date && nr.branch_id === r.branch_id && nr.category_id === r.category_id)
    );
    setStored(STORAGE_KEYS.DAILY_RATES, [...newRates, ...filtered]);
    this.logAudit('Daily Market Rates', 'UPDATE', newRates[0]?.rate_date || 'TODAY', 'দৈনিক বাজার দর আপডেট');
  }

  static getAllBranchStocks(): InventoryStock[] {
    return getStored<InventoryStock[]>(STORAGE_KEYS.STOCKS, DEFAULT_STOCKS);
  }

  static getStocks(branchId?: string): InventoryStock[] {
    const allStocks = this.getAllBranchStocks();
    if (branchId && branchId !== 'ALL') {
      return allStocks.filter((s) => s.branch_id === branchId);
    }
    const byCat = new Map<string, InventoryStock>();
    allStocks.forEach((s) => {
      const existing = byCat.get(s.category_id);
      if (!existing) {
        byCat.set(s.category_id, { ...s, branch_id: 'ALL' });
      } else {
        existing.avg_landed_cost_per_pc = calculateWeightedAverageCost(
          existing.qty_pcs,
          existing.avg_landed_cost_per_pc,
          s.qty_pcs,
          s.avg_landed_cost_per_pc
        );
        existing.qty_pcs += s.qty_pcs;
      }
    });
    return Array.from(byCat.values());
  }

  static getCustomers(): Customer[] {
    return getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  }

  static saveCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
      this.logAudit('Customers', 'UPDATE', customer.customer_code, `কাস্টমার আপডেট: ${customer.name}`);
    } else {
      customers.push(customer);
      this.logAudit('Customers', 'INSERT', customer.customer_code, `নতুন কাস্টমার: ${customer.name}`);
    }
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
  }

  static getSuppliers(): Supplier[] {
    return getStored<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
  }

  static saveSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      suppliers[idx] = supplier;
      this.logAudit('Suppliers', 'UPDATE', supplier.supplier_code, `মহাজন আপডেট: ${supplier.name}`);
    } else {
      suppliers.push(supplier);
      this.logAudit('Suppliers', 'INSERT', supplier.supplier_code, `নতুন মহাজন: ${supplier.name}`);
    }
    setStored(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  static getEmployees(): Employee[] {
    return getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
  }

  static saveEmployee(employee: Employee): void {
    const employees = this.getEmployees();
    const idx = employees.findIndex((e) => e.id === employee.id);
    if (idx >= 0) {
      employees[idx] = employee;
      this.logAudit('Employees', 'UPDATE', employee.employee_code, `কর্মচারী আপডেট: ${employee.full_name}`);
    } else {
      employees.push(employee);
      this.logAudit('Employees', 'INSERT', employee.employee_code, `নতুন কর্মচারী: ${employee.full_name}`);
    }
    setStored(STORAGE_KEYS.EMPLOYEES, employees);
  }

  static getAccounts(): FinancialAccount[] {
    return getStored<FinancialAccount[]>(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
  }

  static addAccount(account: Omit<FinancialAccount, 'id'>): FinancialAccount {
    const accounts = this.getAccounts();
    const newAcc: FinancialAccount = { ...account, id: `acc-${Date.now()}` };
    accounts.push(newAcc);
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);
    this.logAudit('Financial Accounts', 'INSERT', newAcc.id, `নতুন একাউন্ট যুক্ত: ${newAcc.name}`);
    return newAcc;
  }

  static getCashbook(): CashbookTransaction[] {
    return getStored<CashbookTransaction[]>(STORAGE_KEYS.CASHBOOK, []);
  }

  static getExpenses(): Expense[] {
    return getStored<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  }

  static getPurchases(): Purchase[] {
    return getStored<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  }

  static getSales(): SalesInvoice[] {
    return getStored<SalesInvoice[]>(STORAGE_KEYS.SALES, []);
  }

  static getAdjustments(): StockAdjustment[] {
    return getStored<StockAdjustment[]>(STORAGE_KEYS.ADJUSTMENTS, []);
  }

  static getDueCollections(): CustomerDueCollection[] {
    return getStored<CustomerDueCollection[]>(STORAGE_KEYS.DUE_COLLECTIONS, []);
  }

  static getSalaryAdvances(): SalaryAdvance[] {
    return getStored<SalaryAdvance[]>(STORAGE_KEYS.SALARY_ADVANCES, []);
  }

  static getPayrolls(): PayrollRecord[] {
    return getStored<PayrollRecord[]>(STORAGE_KEYS.PAYROLLS, []);
  }

  static getPartnerDrawings(): PartnerDrawing[] {
    return getStored<PartnerDrawing[]>(STORAGE_KEYS.PARTNER_DRAWINGS, []);
  }

  static getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  static postCashbook(
    accountId: string,
    branchId: string,
    type: 'CASH_IN' | 'CASH_OUT' | 'CONTRA_TRANSFER',
    category: CashbookTransaction['category'],
    amount: number,
    referenceId: string,
    description: string
  ): void {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    if (type === 'CASH_IN') account.current_balance += amount;
    else if (type === 'CASH_OUT') account.current_balance -= amount;
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);

    const cashbook = this.getCashbook();
    cashbook.unshift({
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      transaction_date: new Date().toISOString(),
      account_id: accountId,
      branch_id: branchId,
      transaction_type: type,
      category,
      amount,
      reference_id: referenceId,
      description,
      recorded_by: this.getActiveUser().full_name,
      created_at: new Date().toISOString(),
    });
    setStored(STORAGE_KEYS.CASHBOOK, cashbook);
  }

  static recordPurchase(purchase: Purchase): void {
    const purchases = this.getPurchases();
    purchases.unshift(purchase);
    setStored(STORAGE_KEYS.PURCHASES, purchases);

    const stocks = this.getAllBranchStocks();
    purchase.items.forEach((item) => {
      let stock = stocks.find((s) => s.branch_id === purchase.branch_id && s.category_id === item.category_id);
      if (!stock) {
        stock = {
          id: `stock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          branch_id: purchase.branch_id,
          category_id: item.category_id,
          qty_pcs: 0,
          avg_landed_cost_per_pc: item.effective_landed_cost_per_pc,
          updated_at: new Date().toISOString(),
        };
        stocks.push(stock);
      }
      stock.avg_landed_cost_per_pc = calculateWeightedAverageCost(
        stock.qty_pcs,
        stock.avg_landed_cost_per_pc,
        item.qty_pcs,
        item.effective_landed_cost_per_pc
      );
      stock.qty_pcs += item.qty_pcs;
      stock.updated_at = new Date().toISOString();
    });
    setStored(STORAGE_KEYS.STOCKS, stocks);

    if (purchase.due_amount > 0) {
      const suppliers = this.getSuppliers();
      const sup = suppliers.find((s) => s.id === purchase.supplier_id);
      if (sup) {
        sup.current_payable += purchase.due_amount;
        setStored(STORAGE_KEYS.SUPPLIERS, suppliers);
      }
    }

    if (purchase.paid_amount > 0 && purchase.payment_account_id) {
      this.postCashbook(
        purchase.payment_account_id,
        purchase.branch_id,
        'CASH_OUT',
        'PURCHASE_PAYMENT',
        purchase.paid_amount,
        purchase.purchase_code,
        `মহাজন থেকে ডিম কেনা বাবদ পেমেন্ট (চালান: ${purchase.purchase_code})`
      );
    }

    this.logAudit('Purchases', 'INSERT', purchase.purchase_code, `ডিম কেনা: ${purchase.total_eggs_pcs} পিস, মোট: ৳${purchase.total_landed_cost}`);
  }

  static recordSalesInvoice(invoice: SalesInvoice): void {
    const sales = this.getSales();
    sales.unshift(invoice);
    setStored(STORAGE_KEYS.SALES, sales);

    const stocks = this.getAllBranchStocks();
    invoice.items.forEach((item) => {
      const stock = stocks.find((s) => s.branch_id === invoice.branch_id && s.category_id === item.category_id);
      if (stock) {
        stock.qty_pcs = Math.max(0, stock.qty_pcs - item.qty_pcs);
        stock.updated_at = new Date().toISOString();
      }
    });
    setStored(STORAGE_KEYS.STOCKS, stocks);

    if (invoice.due_amount > 0) {
      const customers = this.getCustomers();
      const cust = customers.find((c) => c.id === invoice.customer_id);
      if (cust) {
        cust.current_due += invoice.due_amount;
        setStored(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    if (invoice.paid_amount > 0 && invoice.payment_account_id) {
      this.postCashbook(
        invoice.payment_account_id,
        invoice.branch_id,
        'CASH_IN',
        'SALE_COLLECTION',
        invoice.paid_amount,
        invoice.invoice_code,
        `বিক্রয় মেমো বাবদ আদায় (${invoice.invoice_code})`
      );
    }

    this.logAudit('Sales Invoices', 'INSERT', invoice.invoice_code, `বিক্রয় মেমো: বিল ৳${invoice.net_total}, জমা ৳${invoice.paid_amount}, বকেয়া ৳${invoice.due_amount}`);
  }

  static recordStockAdjustment(adj: StockAdjustment): void {
    const adjustments = this.getAdjustments();
    adjustments.unshift(adj);
    setStored(STORAGE_KEYS.ADJUSTMENTS, adjustments);

    const stocks = this.getAllBranchStocks();
    const sourceStock = stocks.find((s) => s.branch_id === adj.branch_id && s.category_id === adj.category_id);
    if (sourceStock) {
      sourceStock.qty_pcs = Math.max(0, sourceStock.qty_pcs - adj.qty_pcs);
      sourceStock.updated_at = new Date().toISOString();
    }

    if (adj.adjustment_type === 'BRANCH_TRANSFER' && adj.target_branch_id) {
      let targetStock = stocks.find((s) => s.branch_id === adj.target_branch_id && s.category_id === adj.category_id);
      if (!targetStock) {
        targetStock = {
          id: `stock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          branch_id: adj.target_branch_id,
          category_id: adj.category_id,
          qty_pcs: 0,
          avg_landed_cost_per_pc: adj.unit_landed_cost,
          updated_at: new Date().toISOString(),
        };
        stocks.push(targetStock);
      }
      targetStock.avg_landed_cost_per_pc = calculateWeightedAverageCost(
        targetStock.qty_pcs,
        targetStock.avg_landed_cost_per_pc,
        adj.qty_pcs,
        adj.unit_landed_cost
      );
      targetStock.qty_pcs += adj.qty_pcs;
      targetStock.updated_at = new Date().toISOString();
    }
    setStored(STORAGE_KEYS.STOCKS, stocks);

    const typeLabels = {
      WASTAGE_BROKEN: 'ভাঙা ডিমের ক্ষতি',
      WASTAGE_ROTTEN: 'পচা ডিমের ক্ষতি',
      COURTESY_GIFT: 'সৌজন্যে দেওয়া ডিম',
      BRANCH_TRANSFER: 'শাখা স্থানান্তর',
    };
    this.logAudit('Stock Adjustments', 'INSERT', adj.adjustment_code, `${typeLabels[adj.adjustment_type]}: ${adj.qty_pcs} পিস (৳${adj.total_cost_value})`);
  }

  static recordCustomerDueCollection(collection: CustomerDueCollection): void {
    const collections = this.getDueCollections();
    collections.unshift(collection);
    setStored(STORAGE_KEYS.DUE_COLLECTIONS, collections);

    const customers = this.getCustomers();
    const cust = customers.find((c) => c.id === collection.customer_id);
    if (cust) {
      cust.current_due = Math.max(0, cust.current_due - collection.amount);
      setStored(STORAGE_KEYS.CUSTOMERS, customers);
    }

    this.postCashbook(
      collection.payment_account_id,
      collection.branch_id,
      'CASH_IN',
      'DUE_COLLECTION',
      collection.amount,
      collection.receipt_code,
      `বকেয়া কালেকশন: ${cust?.name || ''} (${collection.receipt_code})`
    );
    this.logAudit('Due Collections', 'INSERT', collection.receipt_code, `বকেয়া আদায়: ${cust?.name} থেকে ৳${collection.amount}`);
  }

  static recordSupplierPayment(supplierId: string, amount: number, accountId: string, branchId: string, note?: string): string {
    const paymentCode = this.getNextCode('SPAY');
    const suppliers = this.getSuppliers();
    const sup = suppliers.find((s) => s.id === supplierId);
    if (sup) {
      sup.current_payable = Math.max(0, sup.current_payable - amount);
      setStored(STORAGE_KEYS.SUPPLIERS, suppliers);
    }

    this.postCashbook(
      accountId,
      branchId,
      'CASH_OUT',
      'PURCHASE_PAYMENT',
      amount,
      paymentCode,
      note || `মহাজন বকেয়া পরিশোধ: ${sup?.name || ''} (${paymentCode})`
    );
    this.logAudit('Supplier Payments', 'INSERT', paymentCode, `মহাজন পেমেন্ট: ${sup?.name} কে ৳${amount}`);
    return paymentCode;
  }

  static recordExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    expenses.unshift(expense);
    setStored(STORAGE_KEYS.EXPENSES, expenses);

    this.postCashbook(
      expense.account_id,
      expense.branch_id,
      'CASH_OUT',
      expense.is_capital_asset ? 'CAPITAL_ASSET' : 'EXPENSE',
      expense.amount,
      expense.expense_code,
      `খরচ: ${expense.title}`
    );
    this.logAudit('Expenses', 'INSERT', expense.expense_code, `খরচ এন্ট্রি: ${expense.title} (৳${expense.amount})`);
  }

  static recordSalaryAdvance(advance: SalaryAdvance, accountId: string, branchId: string): void {
    const advances = this.getSalaryAdvances();
    advances.unshift(advance);
    setStored(STORAGE_KEYS.SALARY_ADVANCES, advances);

    const emp = this.getEmployees().find((e) => e.id === advance.employee_id);
    this.postCashbook(accountId, branchId, 'CASH_OUT', 'SALARY', advance.amount, `ADV-${advance.id}`, `অগ্রিম বেতন: ${emp?.full_name || ''}`);
    this.logAudit('Salary Advance', 'INSERT', advance.id, `বেতন অগ্রিম: ${emp?.full_name} কে ৳${advance.amount}`);
  }

  static recordPayroll(record: PayrollRecord, accountId: string, branchId: string): void {
    const payrolls = this.getPayrolls();
    payrolls.unshift(record);
    setStored(STORAGE_KEYS.PAYROLLS, payrolls);

    const emp = this.getEmployees().find((e) => e.id === record.employee_id);
    if (record.net_payable > 0) {
      this.postCashbook(accountId, branchId, 'CASH_OUT', 'SALARY', record.net_payable, record.payroll_code, `বেতন পরিশোধ (${record.salary_month}): ${emp?.full_name || ''}`);
    }
    this.logAudit('Payroll', 'INSERT', record.payroll_code, `বেতন পরিশোধ: ${emp?.full_name} (${record.salary_month}, ৳${record.net_payable})`);
  }

  static recordPartnerDrawing(drawing: PartnerDrawing, branchId: string): void {
    const drawings = this.getPartnerDrawings();
    drawings.unshift(drawing);
    setStored(STORAGE_KEYS.PARTNER_DRAWINGS, drawings);

    const partner = this.getPartners().find((p) => p.id === drawing.partner_id);
    this.postCashbook(drawing.account_id, branchId, 'CASH_OUT', 'PARTNER_DRAWING', drawing.amount, `DRAW-${drawing.id}`, `মালিকের উত্তোলন: ${partner?.name || ''}`);
    this.logAudit('Partner Drawings', 'INSERT', drawing.id, `ব্যক্তিগত উত্তোলন: ${partner?.name} (৳${drawing.amount})`);
  }

  static calculateMonthlySettlement(targetMonth: string) {
    const sales = this.getSales().filter((s) => s.invoice_date.startsWith(targetMonth));
    let totalSalesRevenue = 0;
    let totalCogs = 0;

    sales.forEach((inv) => {
      totalSalesRevenue += inv.net_total;
      inv.items.forEach((item) => {
        totalCogs += item.qty_pcs * (item.cogs_landed_cost_per_pc || 0);
      });
    });

    const grossProfit = totalSalesRevenue - totalCogs;
    const totalOperatingExpenses = this.getExpenses()
      .filter((e) => e.expense_date.startsWith(targetMonth) && !e.is_capital_asset)
      .reduce((sum, e) => sum + e.amount, 0);

    const payrolls = this.getPayrolls().filter((p) => p.salary_month === targetMonth);
    const settledEmployeeIds = new Set(payrolls.map((p) => p.employee_id));
    const settledPayrollCost = payrolls.reduce((sum, p) => sum + p.net_payable + p.advances_deducted, 0);
    const unsettledAdvancesCost = this.getSalaryAdvances()
      .filter((a) => a.advance_date.startsWith(targetMonth) && !settledEmployeeIds.has(a.employee_id))
      .reduce((sum, a) => sum + a.amount, 0);
    const totalSalaries = settledPayrollCost + unsettledAdvancesCost;

    const adjustments = this.getAdjustments().filter((a) => a.adjustment_date.startsWith(targetMonth));
    const totalWastageLoss = adjustments
      .filter((a) => a.adjustment_type === 'WASTAGE_BROKEN' || a.adjustment_type === 'WASTAGE_ROTTEN')
      .reduce((sum, a) => sum + a.total_cost_value, 0);
    const totalCourtesyLoss = adjustments
      .filter((a) => a.adjustment_type === 'COURTESY_GIFT')
      .reduce((sum, a) => sum + a.total_cost_value, 0);

    const netProfit = grossProfit - totalOperatingExpenses - totalSalaries - totalWastageLoss - totalCourtesyLoss;

    const partners = this.getPartners().filter((p) => p.is_active);
    const totalWeight = partners.reduce((sum, p) => sum + p.share_weight, 0) || 1;
    const drawings = this.getPartnerDrawings().filter((d) => d.drawing_date.startsWith(targetMonth));

    const distributions = partners.map((partner) => {
      const percentage = (partner.share_weight / totalWeight) * 100;
      const grossShare = Math.round(((netProfit * partner.share_weight) / totalWeight) * 100) / 100;
      const drawingsDeducted = drawings.filter((d) => d.partner_id === partner.id).reduce((sum, d) => sum + d.amount, 0);
      return {
        partnerId: partner.id,
        partnerName: partner.name,
        shareWeight: partner.share_weight,
        percentage: Math.round(percentage * 10) / 10,
        grossShare,
        drawingsDeducted,
        netPayable: grossShare - drawingsDeducted,
      };
    });

    const r = (n: number) => Math.round(n * 100) / 100;
    return {
      totalSalesRevenue: r(totalSalesRevenue),
      totalCogs: r(totalCogs),
      grossProfit: r(grossProfit),
      totalOperatingExpenses: r(totalOperatingExpenses),
      totalSalaries: r(totalSalaries),
      totalWastageLoss: r(totalWastageLoss),
      totalCourtesyLoss: r(totalCourtesyLoss),
      netProfit: r(netProfit),
      distributions,
    };
  }

  static exportFullBackupJson(): string {
    return JSON.stringify(
      {
        COMPANY: this.getCompany(),
        BRANCHES: this.getBranches(),
        PARTNERS: this.getPartners(),
        CATEGORIES: this.getCategories(),
        DAILY_RATES: this.getDailyRates(),
        STOCKS: this.getAllBranchStocks(),
        CUSTOMERS: this.getCustomers(),
        SUPPLIERS: this.getSuppliers(),
        EMPLOYEES: this.getEmployees(),
        ACCOUNTS: this.getAccounts(),
        PURCHASES: this.getPurchases(),
        SALES: this.getSales(),
        ADJUSTMENTS: this.getAdjustments(),
        DUE_COLLECTIONS: this.getDueCollections(),
        EXPENSES: this.getExpenses(),
        PARTNER_DRAWINGS: this.getPartnerDrawings(),
        SALARY_ADVANCES: this.getSalaryAdvances(),
        PAYROLLS: this.getPayrolls(),
        CASHBOOK: this.getCashbook(),
        AUDIT_LOGS: this.getAuditLogs(),
        USERS: this.getUsers(),
        SEQUENCES: getStored(STORAGE_KEYS.SEQUENCES, {}),
        SELECTED_BRANCH: this.getSelectedBranchId(),
      },
      null,
      2
    );
  }

  static importFullBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        if (data[name] !== undefined) setStored(key, data[name]);
      });
      window.dispatchEvent(new Event('dimkhata_storage_change'));
      return true;
    } catch {
      return false;
    }
  }

  static async checkSupabaseHealth(): Promise<{
    status: CloudSyncStatus;
    message?: string;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      this.setCloudStatus('NOT_CONFIGURED');
      return { status: 'NOT_CONFIGURED', message: 'Supabase credentials missing' };
    }

    try {
      const { error } = await supabase
        .from('dimkhata_kv_store')
        .select('key')
        .limit(1);

      if (error) {
        if (
          error.message.includes('dimkhata_kv_store') ||
          error.code === '42P01' ||
          error.code === 'PGRST205'
        ) {
          this.setCloudStatus('NEEDS_SQL');
          return { status: 'NEEDS_SQL', message: 'SQL table setup required' };
        }
        if (
          error.code === 'PGRST301' ||
          error.message.includes('JWT') ||
          error.message.includes('apikey')
        ) {
          this.setCloudStatus('NOT_CONFIGURED');
          return { status: 'NOT_CONFIGURED', message: 'Invalid Supabase API key' };
        }
        this.setCloudStatus('OFFLINE');
        return { status: 'OFFLINE', message: error.message };
      }

      this.setCloudStatus('ONLINE');
      return { status: 'ONLINE' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      this.setCloudStatus('OFFLINE');
      return { status: 'OFFLINE', message: errorMsg };
    }
  }

  static async syncWithSupabase(): Promise<{
    synced: boolean;
    count: number;
    status: CloudSyncStatus;
    error?: string;
  }> {
    const health = await this.checkSupabaseHealth();
    if (health.status !== 'ONLINE') {
      return { synced: false, count: 0, status: health.status, error: health.message };
    }

    if (!supabase) {
      this.setCloudStatus('NOT_CONFIGURED');
      return { synced: false, count: 0, status: 'NOT_CONFIGURED' };
    }

    try {
      const { data, error } = await supabase.from('dimkhata_kv_store').select('key, value');
      if (error) {
        if (error.message.includes('dimkhata_kv_store') || error.code === '42P01' || error.code === 'PGRST205') {
          this.setCloudStatus('NEEDS_SQL');
          return { synced: false, count: 0, status: 'NEEDS_SQL' };
        }
        this.setCloudStatus('OFFLINE');
        return { synced: false, count: 0, status: 'OFFLINE', error: error.message };
      }

      if (data && data.length > 0) {
        data.forEach((row: { key: string; value: unknown }) => {
          if (row.key && !SESSION_ONLY_KEYS.has(row.key)) {
            MEMORY_DB.set(row.key, row.value);
          }
        });
        this.setCloudStatus('ONLINE');
        window.dispatchEvent(new Event('dimkhata_storage_change'));
      } else {
        const fullState = JSON.parse(this.exportFullBackupJson()) as Record<string, unknown>;
        const rowsToUpsert = Object.entries(STORAGE_KEYS)
          .filter(([, key]) => !SESSION_ONLY_KEYS.has(key))
          .map(([name, key]) => {
            const val = fullState[name] ?? {};
            MEMORY_DB.set(key, val);
            return { key, value: val, updated_at: new Date().toISOString() };
          });
        const { error: upsertErr } = await supabase.from('dimkhata_kv_store').upsert(rowsToUpsert, { onConflict: 'key' });
        if (!upsertErr) this.setCloudStatus('ONLINE');
      }

      if (!this.realtimeSubscribed) {
        this.realtimeSubscribed = true;
        supabase
          .channel('dimkhata-cloud-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'dimkhata_kv_store' }, (payload: { new?: { key?: string; value?: unknown } }) => {
            const row = payload.new;
            if (row && row.key && !SESSION_ONLY_KEYS.has(row.key)) {
              MEMORY_DB.set(row.key, row.value);
              this.setCloudStatus('ONLINE');
              window.dispatchEvent(new Event('dimkhata_storage_change'));
            }
          })
          .subscribe();
      }

      return { synced: true, count: data?.length || 19, status: 'ONLINE' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Sync network error';
      this.setCloudStatus('OFFLINE');
      return { synced: false, count: 0, status: 'OFFLINE', error: errorMsg };
    }
  }

  static resetToCleanProduction(): void {
    MEMORY_DB.clear();
    setStored(STORAGE_KEYS.USERS, DEFAULT_USERS);
    setStored(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
    setStored(STORAGE_KEYS.BRANCHES, DEFAULT_BRANCHES);
    setStored(STORAGE_KEYS.PARTNERS, DEFAULT_PARTNERS);
    setStored(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    setStored(STORAGE_KEYS.DAILY_RATES, DEFAULT_RATES);
    setStored(STORAGE_KEYS.STOCKS, DEFAULT_STOCKS);
    setStored(STORAGE_KEYS.CUSTOMERS, []);
    setStored(STORAGE_KEYS.SUPPLIERS, []);
    setStored(STORAGE_KEYS.EMPLOYEES, []);
    setStored(STORAGE_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    setStored(STORAGE_KEYS.PURCHASES, []);
    setStored(STORAGE_KEYS.SALES, []);
    setStored(STORAGE_KEYS.ADJUSTMENTS, []);
    setStored(STORAGE_KEYS.DUE_COLLECTIONS, []);
    setStored(STORAGE_KEYS.EXPENSES, []);
    setStored(STORAGE_KEYS.PARTNER_DRAWINGS, []);
    setStored(STORAGE_KEYS.SALARY_ADVANCES, []);
    setStored(STORAGE_KEYS.PAYROLLS, []);
    setStored(STORAGE_KEYS.CASHBOOK, []);
    setStored(STORAGE_KEYS.AUDIT_LOGS, []);
    setStored(STORAGE_KEYS.SEQUENCES, {});
    window.dispatchEvent(new Event('dimkhata_storage_change'));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('dimkhata_supabase_reconfigured', () => {
    DimKhataStore.syncWithSupabase();
  });
}
