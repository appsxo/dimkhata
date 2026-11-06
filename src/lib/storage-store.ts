// ====================================================================
// DIMKHATA (ডিমখাতা) — Universal Enterprise Data & State Management
// Handles Local Persistence, Auto-Sequences, Accounting Triggers & Audit
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
  CustomerDueCollection,
  Expense,
  PartnerDrawing,
  CashbookTransaction,
  AuditLog,
  PayrollRecord,
  SalaryAdvance,
  UserProfile,
} from '../types';
import {
  INITIAL_COMPANY_SETTINGS,
  INITIAL_BRANCHES,
  INITIAL_PARTNERS,
  INITIAL_EGG_CATEGORIES,
  INITIAL_DAILY_RATES,
  INITIAL_INVENTORY_STOCKS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_EMPLOYEES,
  INITIAL_ACCOUNTS,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
} from './mock-data';
import { calculateWeightedAverageCost } from './egg-units';

const STORAGE_KEYS = {
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

// Safe LocalStorage helpers
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('dimkhata_storage_change'));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

export class DimKhataStore {
  // Current active user (Admin vs Staff)
  static getActiveUser(): UserProfile {
    return getStored<UserProfile>(STORAGE_KEYS.ACTIVE_USER, {
      id: 'admin-sharif',
      full_name: 'শরিফ (মালিক)',
      role: 'ADMIN',
      phone: '01711-100001',
      is_active: true,
    });
  }

  static setActiveUser(user: UserProfile): void {
    setStored(STORAGE_KEYS.ACTIVE_USER, user);
  }

  // Current active branch filter ('ALL' or branch_id)
  static getSelectedBranchId(): string {
    return getStored<string>(STORAGE_KEYS.SELECTED_BRANCH, 'ALL');
  }

  static setSelectedBranchId(branchId: string): void {
    setStored(STORAGE_KEYS.SELECTED_BRANCH, branchId);
  }

  // Atomic Sequential Unique ID Generator
  static getNextCode(prefix: 'EMP' | 'CUST' | 'SUP' | 'INV' | 'CHL' | 'PUR' | 'ADJ' | 'EXP' | 'REC' | 'PAY'): string {
    const seqs = getStored<Record<string, number>>(STORAGE_KEYS.SEQUENCES, {
      EMP: 2,
      CUST: 3,
      SUP: 2,
      INV: 0,
      CHL: 0,
      PUR: 0,
      ADJ: 0,
      EXP: 3,
      REC: 0,
      PAY: 0,
    });

    const currentYear = new Date().getFullYear();
    const nextVal = (seqs[prefix] || 0) + 1;
    seqs[prefix] = nextVal;
    setStored(STORAGE_KEYS.SEQUENCES, seqs);

    if (prefix === 'EMP') return `SE-EMP-${String(nextVal).padStart(3, '0')}`;
    if (prefix === 'CUST') return `SE-CUST-${String(nextVal).padStart(3, '0')}`;
    if (prefix === 'SUP') return `SE-SUP-${String(nextVal).padStart(3, '0')}`;
    if (prefix === 'INV') return `SE-INV-${currentYear}-${String(nextVal).padStart(4, '0')}`;
    if (prefix === 'CHL') return `SE-CHL-${currentYear}-${String(nextVal).padStart(4, '0')}`;
    if (prefix === 'PUR') return `SE-PUR-${currentYear}-${String(nextVal).padStart(4, '0')}`;
    if (prefix === 'ADJ') return `SE-ADJ-${currentYear}-${String(nextVal).padStart(4, '0')}`;
    if (prefix === 'EXP') return `SE-EXP-${currentYear}-${String(nextVal).padStart(4, '0')}`;
    if (prefix === 'REC') return `SE-REC-${currentYear}-${String(nextVal).padStart(4, '0')}`;
    if (prefix === 'PAY') return `SE-PAY-${currentYear}-${String(nextVal).padStart(4, '0')}`;

    return `SE-${prefix}-${nextVal}`;
  }

  // Audit Logger
  static logAudit(entityName: string, action: 'INSERT' | 'UPDATE' | 'DELETE', recordId: string, summary: string): void {
    const user = this.getActiveUser();
    const logs = getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actor_name: user.full_name,
      actor_role: user.role,
      entity_name: entityName,
      action,
      record_id: recordId,
      summary,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop(); // keep last 500 audit logs
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Getters
  static getCompany(): CompanySettings {
    return getStored<CompanySettings>(STORAGE_KEYS.COMPANY, INITIAL_COMPANY_SETTINGS);
  }

  static updateCompany(settings: CompanySettings): void {
    setStored(STORAGE_KEYS.COMPANY, settings);
    this.logAudit('Company Settings', 'UPDATE', settings.id, 'প্রতিষ্ঠানের তথ্য আপডেট করা হয়েছে');
  }

  static getBranches(): Branch[] {
    return getStored<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  }

  static addBranch(branch: Omit<Branch, 'id' | 'created_at'>): Branch {
    const branches = this.getBranches();
    const newBranch: Branch = {
      ...branch,
      id: `br-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    branches.push(newBranch);
    setStored(STORAGE_KEYS.BRANCHES, branches);
    this.logAudit('Branches', 'INSERT', newBranch.branch_code, `নতুন শাখা যোগ করা হয়েছে: ${newBranch.name}`);
    return newBranch;
  }

  static getPartners(): Partner[] {
    return getStored<Partner[]>(STORAGE_KEYS.PARTNERS, INITIAL_PARTNERS);
  }

  static updatePartnerWeight(partnerId: string, newWeight: number): void {
    const partners = this.getPartners();
    const partner = partners.find((p) => p.id === partnerId);
    if (partner) {
      partner.share_weight = Number(newWeight) || 1;
      setStored(STORAGE_KEYS.PARTNERS, partners);
      this.logAudit('Partners', 'UPDATE', partnerId, `${partner.name}-এর লভ্যাংশ অনুপাত পরিবর্তিত হয়ে ${newWeight} করা হয়েছে`);
    }
  }

  static getCategories(): EggCategory[] {
    return getStored<EggCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_EGG_CATEGORIES);
  }

  static getDailyRates(dateStr?: string): DailyMarketRate[] {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const rates = getStored<DailyMarketRate[]>(STORAGE_KEYS.DAILY_RATES, INITIAL_DAILY_RATES);
    return rates.filter((r) => r.rate_date === targetDate);
  }

  static setDailyRates(newRates: DailyMarketRate[]): void {
    const rates = getStored<DailyMarketRate[]>(STORAGE_KEYS.DAILY_RATES, INITIAL_DAILY_RATES);
    // Remove existing for those (date + branch + category)
    const filtered = rates.filter((r) => !newRates.some((nr) => nr.rate_date === r.rate_date && nr.branch_id === r.branch_id && nr.category_id === r.category_id));
    const merged = [...newRates, ...filtered];
    setStored(STORAGE_KEYS.DAILY_RATES, merged);
    this.logAudit('Daily Market Rates', 'UPDATE', newRates[0]?.rate_date || 'TODAY', 'দৈনিক ডিমের বাজার দর আপডেট করা হয়েছে');
  }

  static getStocks(branchId?: string): InventoryStock[] {
    const stocks = getStored<InventoryStock[]>(STORAGE_KEYS.STOCKS, INITIAL_INVENTORY_STOCKS);
    if (branchId && branchId !== 'ALL') {
      return stocks.filter((s) => s.branch_id === branchId);
    }
    return stocks;
  }

  static getCustomers(): Customer[] {
    return getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  static saveCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
      this.logAudit('Customers', 'UPDATE', customer.customer_code, `কাস্টমার তথ্য আপডেট: ${customer.name}`);
    } else {
      customers.push(customer);
      this.logAudit('Customers', 'INSERT', customer.customer_code, `নতুন কাস্টমার নিবন্ধন: ${customer.name}`);
    }
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
  }

  static getSuppliers(): Supplier[] {
    return getStored<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }

  static saveSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      suppliers[idx] = supplier;
      this.logAudit('Suppliers', 'UPDATE', supplier.supplier_code, `খামারী/মহাজন তথ্য আপডেট: ${supplier.name}`);
    } else {
      suppliers.push(supplier);
      this.logAudit('Suppliers', 'INSERT', supplier.supplier_code, `নতুন খামারী নিবন্ধন: ${supplier.name}`);
    }
    setStored(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  static getEmployees(): Employee[] {
    return getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  }

  static saveEmployee(employee: Employee): void {
    const employees = this.getEmployees();
    const idx = employees.findIndex((e) => e.id === employee.id);
    if (idx >= 0) {
      employees[idx] = employee;
      this.logAudit('Employees', 'UPDATE', employee.employee_code, `কর্মচারী তথ্য আপডেট: ${employee.full_name}`);
    } else {
      employees.push(employee);
      this.logAudit('Employees', 'INSERT', employee.employee_code, `নতুন কর্মচারী নিয়োগ: ${employee.full_name}`);
    }
    setStored(STORAGE_KEYS.EMPLOYEES, employees);
  }

  static getAccounts(): FinancialAccount[] {
    return getStored<FinancialAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  }

  static getCashbook(): CashbookTransaction[] {
    return getStored<CashbookTransaction[]>(STORAGE_KEYS.CASHBOOK, []);
  }

  static getExpenses(): Expense[] {
    return getStored<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
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
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  // ====================================================================
  // ACCOUNTING TRANSACTIONS & BUSINESS TRIGGERS
  // ====================================================================

  /**
   * Post entry to Cashbook and update account balance
   */
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

    if (type === 'CASH_IN') {
      account.current_balance += amount;
    } else if (type === 'CASH_OUT') {
      account.current_balance -= amount;
    }

    setStored(STORAGE_KEYS.ACCOUNTS, accounts);

    const cashbook = this.getCashbook();
    const newTx: CashbookTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
    };
    cashbook.unshift(newTx);
    setStored(STORAGE_KEYS.CASHBOOK, cashbook);
  }

  /**
   * Process Purchase (Req 9: Sourcing + Landed Cost + WAC + Stock + Supplier Payable + Cashbook)
   */
  static recordPurchase(purchase: Purchase): void {
    // 1. Save purchase record
    const purchases = this.getPurchases();
    purchases.unshift(purchase);
    setStored(STORAGE_KEYS.PURCHASES, purchases);

    // 2. Update stock & WAC for each item
    const stocks = this.getStocks();
    purchase.items.forEach((item) => {
      let stock = stocks.find((s) => s.branch_id === purchase.branch_id && s.category_id === item.category_id);
      if (!stock) {
        stock = {
          id: `stock-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          branch_id: purchase.branch_id,
          category_id: item.category_id,
          qty_pcs: 0,
          avg_landed_cost_per_pc: item.effective_landed_cost_per_pc,
          updated_at: new Date().toISOString(),
        };
        stocks.push(stock);
      }

      const newWac = calculateWeightedAverageCost(
        stock.qty_pcs,
        stock.avg_landed_cost_per_pc,
        item.qty_pcs,
        item.effective_landed_cost_per_pc
      );

      stock.qty_pcs += item.qty_pcs;
      stock.avg_landed_cost_per_pc = newWac;
      stock.updated_at = new Date().toISOString();
    });
    setStored(STORAGE_KEYS.STOCKS, stocks);

    // 3. Update Supplier Payable if due exists
    if (purchase.due_amount > 0) {
      const suppliers = this.getSuppliers();
      const sup = suppliers.find((s) => s.id === purchase.supplier_id);
      if (sup) {
        sup.current_payable += purchase.due_amount;
        setStored(STORAGE_KEYS.SUPPLIERS, suppliers);
      }
    }

    // 4. Post Cash Out if paid from account
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

    this.logAudit('Purchases', 'INSERT', purchase.purchase_code, `ডিম কেনা ভাউচার সম্পন্ন: ${purchase.total_eggs_pcs} পিস, মোট ল্যান্ডেড কস্ট: ৳${purchase.total_landed_cost}`);
  }

  /**
   * Process Sales Invoice (Req 10: POS + Stock Deduction + COGS + Customer Due + Cashbook)
   */
  static recordSalesInvoice(invoice: SalesInvoice): void {
    // 1. Save invoice
    const sales = this.getSales();
    sales.unshift(invoice);
    setStored(STORAGE_KEYS.SALES, sales);

    // 2. Deduct inventory stock
    const stocks = this.getStocks();
    invoice.items.forEach((item) => {
      const stock = stocks.find((s) => s.branch_id === invoice.branch_id && s.category_id === item.category_id);
      if (stock) {
        stock.qty_pcs = Math.max(0, stock.qty_pcs - item.qty_pcs);
        stock.updated_at = new Date().toISOString();
      }
    });
    setStored(STORAGE_KEYS.STOCKS, stocks);

    // 3. Update Customer Due
    if (invoice.due_amount > 0) {
      const customers = this.getCustomers();
      const cust = customers.find((c) => c.id === invoice.customer_id);
      if (cust) {
        cust.current_due += invoice.due_amount;
        setStored(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    // 4. Post Cash In if paid amount > 0
    if (invoice.paid_amount > 0 && invoice.payment_account_id) {
      this.postCashbook(
        invoice.payment_account_id,
        invoice.branch_id,
        'CASH_IN',
        'SALE_COLLECTION',
        invoice.paid_amount,
        invoice.invoice_code,
        `বিক্রয় মেমো বাবদ আদায় (মেমো: ${invoice.invoice_code})`
      );
    }

    this.logAudit('Sales Invoices', 'INSERT', invoice.invoice_code, `বিক্রয় মেমো জেনারেট: বিল ৳${invoice.net_total}, জমা ৳${invoice.paid_amount}, বকেয়া ৳${invoice.due_amount}`);
  }

  /**
   * Process Stock Adjustments (Req 7: Wastage & Req 8: Courtesy)
   */
  static recordStockAdjustment(adj: StockAdjustment): void {
    const adjustments = this.getAdjustments();
    adjustments.unshift(adj);
    setStored(STORAGE_KEYS.ADJUSTMENTS, adjustments);

    // Deduct stock from origin branch
    const stocks = this.getStocks();
    const sourceStock = stocks.find((s) => s.branch_id === adj.branch_id && s.category_id === adj.category_id);
    if (sourceStock) {
      sourceStock.qty_pcs = Math.max(0, sourceStock.qty_pcs - adj.qty_pcs);
      sourceStock.updated_at = new Date().toISOString();
    }

    // If branch transfer, add to target branch
    if (adj.adjustment_type === 'BRANCH_TRANSFER' && adj.target_branch_id) {
      let targetStock = stocks.find((s) => s.branch_id === adj.target_branch_id && s.category_id === adj.category_id);
      if (!targetStock) {
        targetStock = {
          id: `stock-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          branch_id: adj.target_branch_id,
          category_id: adj.category_id,
          qty_pcs: 0,
          avg_landed_cost_per_pc: adj.unit_landed_cost,
          updated_at: new Date().toISOString(),
        };
        stocks.push(targetStock);
      }
      targetStock.qty_pcs += adj.qty_pcs;
      targetStock.updated_at = new Date().toISOString();
    }
    setStored(STORAGE_KEYS.STOCKS, stocks);

    const typeLabels = {
      WASTAGE_BROKEN: 'ভাঙা ডিমের ক্ষতি',
      WASTAGE_ROTTEN: 'পচা ডিমের ক্ষতি',
      COURTESY_GIFT: 'সৌজন্যে/গিফটে দেওয়া ডিম',
      BRANCH_TRANSFER: 'শাখা স্থানান্তর',
    };

    this.logAudit(
      'Stock Adjustments',
      'INSERT',
      adj.adjustment_code,
      `${typeLabels[adj.adjustment_type]}: ${adj.qty_pcs} পিস (মূল্য: ৳${adj.total_cost_value})`
    );
  }

  /**
   * Collect Customer Due (Req 10)
   */
  static recordCustomerDueCollection(collection: CustomerDueCollection): void {
    const collections = this.getDueCollections();
    collections.unshift(collection);
    setStored(STORAGE_KEYS.DUE_COLLECTIONS, collections);

    // Deduct due
    const customers = this.getCustomers();
    const cust = customers.find((c) => c.id === collection.customer_id);
    if (cust) {
      cust.current_due = Math.max(0, cust.current_due - collection.amount);
      setStored(STORAGE_KEYS.CUSTOMERS, customers);
    }

    // Post Cash In
    this.postCashbook(
      collection.payment_account_id,
      collection.branch_id,
      'CASH_IN',
      'DUE_COLLECTION',
      collection.amount,
      collection.receipt_code,
      `বকেয়া কালেকশন: ${cust?.name || ''} (রসিদ: ${collection.receipt_code})`
    );

    this.logAudit('Due Collections', 'INSERT', collection.receipt_code, `বকেয়া আদায়: ${cust?.name} থেকে ৳${collection.amount}`);
  }

  /**
   * Record Operational & Asset Expense (Req 12)
   */
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

  /**
   * Record Salary Advance (Req 11)
   */
  static recordSalaryAdvance(advance: SalaryAdvance, accountId: string, branchId: string): void {
    const advances = this.getSalaryAdvances();
    advances.unshift(advance);
    setStored(STORAGE_KEYS.SALARY_ADVANCES, advances);

    const emp = this.getEmployees().find((e) => e.id === advance.employee_id);

    this.postCashbook(
      accountId,
      branchId,
      'CASH_OUT',
      'SALARY',
      advance.amount,
      `ADV-${advance.id}`,
      `অগ্রিম বেতন প্রদান: ${emp?.full_name || ''}`
    );

    this.logAudit('Salary Advance', 'INSERT', advance.id, `বেতন অগ্রিম: ${emp?.full_name} কে ৳${advance.amount}`);
  }

  /**
   * Record Payroll Record (Req 11)
   */
  static recordPayroll(record: PayrollRecord, accountId: string, branchId: string): void {
    const payrolls = this.getPayrolls();
    payrolls.unshift(record);
    setStored(STORAGE_KEYS.PAYROLLS, payrolls);

    const emp = this.getEmployees().find((e) => e.id === record.employee_id);

    this.postCashbook(
      accountId,
      branchId,
      'CASH_OUT',
      'SALARY',
      record.net_payable,
      record.payroll_code,
      `মাসিক বেতন পরিশোধ (${record.salary_month}): ${emp?.full_name || ''}`
    );

    this.logAudit('Payroll', 'INSERT', record.payroll_code, `বেতন পরিশোধ: ${emp?.full_name} (মাস: ${record.salary_month}, নীট: ৳${record.net_payable})`);
  }

  /**
   * Record Partner Drawing / Withdrawal (Req 14)
   */
  static recordPartnerDrawing(drawing: PartnerDrawing, branchId: string): void {
    const drawings = this.getPartnerDrawings();
    drawings.unshift(drawing);
    setStored(STORAGE_KEYS.PARTNER_DRAWINGS, drawings);

    const partner = this.getPartners().find((p) => p.id === drawing.partner_id);

    this.postCashbook(
      drawing.account_id,
      branchId,
      'CASH_OUT',
      'PARTNER_DRAWING',
      drawing.amount,
      `DRAW-${drawing.id}`,
      `মালিকের ব্যক্তিগত উত্তোলন: ${partner?.name || ''}`
    );

    this.logAudit('Partner Drawings', 'INSERT', drawing.id, `ব্যক্তিগত উত্তোলন: ${partner?.name} তুলেছেন ৳${drawing.amount}`);
  }

  // ====================================================================
  // 1-CLICK MONTHLY NET PROFIT & 2:1 PROFIT DISTRIBUTION (Req 13, 14)
  // ====================================================================
  static calculateMonthlySettlement(targetMonth: string): {
    totalSalesRevenue: number;
    totalCogs: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    totalSalaries: number;
    totalWastageLoss: number;
    totalCourtesyLoss: number;
    netProfit: number;
    distributions: {
      partnerId: string;
      partnerName: string;
      shareWeight: number;
      percentage: number;
      grossShare: number;
      drawingsDeducted: number;
      netPayable: number;
    }[];
  } {
    // 1. Sales & COGS for this month
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

    // 2. Operating Expenses (Excluding Capital Asset purchases from P&L per Req 12)
    const expenses = this.getExpenses().filter((e) => e.expense_date.startsWith(targetMonth) && !e.is_capital_asset);
    const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 3. Salaries paid this month
    const payrolls = this.getPayrolls().filter((p) => p.salary_month === targetMonth);
    const totalSalaries = payrolls.reduce((sum, p) => sum + p.net_payable + p.advances_deducted, 0);

    // 4. Wastage & Courtesy losses
    const adjustments = this.getAdjustments().filter((a) => a.adjustment_date.startsWith(targetMonth));
    const totalWastageLoss = adjustments
      .filter((a) => a.adjustment_type === 'WASTAGE_BROKEN' || a.adjustment_type === 'WASTAGE_ROTTEN')
      .reduce((sum, a) => sum + a.total_cost_value, 0);

    const totalCourtesyLoss = adjustments
      .filter((a) => a.adjustment_type === 'COURTESY_GIFT')
      .reduce((sum, a) => sum + a.total_cost_value, 0);

    // 5. Net Profit
    const netProfit = grossProfit - totalOperatingExpenses - totalSalaries - totalWastageLoss - totalCourtesyLoss;

    // 6. Partner Distributions (Configurable 2:1 Ratio & Drawings deduction)
    const partners = this.getPartners().filter((p) => p.is_active);
    const totalWeight = partners.reduce((sum, p) => sum + p.share_weight, 0) || 1;
    const drawings = this.getPartnerDrawings().filter((d) => d.drawing_date.startsWith(targetMonth));

    const distributions = partners.map((partner) => {
      const percentage = (partner.share_weight / totalWeight) * 100;
      const grossShare = Math.round(((netProfit * partner.share_weight) / totalWeight) * 100) / 100;
      const partnerDrawings = drawings
        .filter((d) => d.partner_id === partner.id)
        .reduce((sum, d) => sum + d.amount, 0);
      const netPayable = grossShare - partnerDrawings;

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        shareWeight: partner.share_weight,
        percentage: Math.round(percentage * 10) / 10,
        grossShare,
        drawingsDeducted: partnerDrawings,
        netPayable,
      };
    });

    return {
      totalSalesRevenue: Math.round(totalSalesRevenue * 100) / 100,
      totalCogs: Math.round(totalCogs * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
      totalSalaries: Math.round(totalSalaries * 100) / 100,
      totalWastageLoss: Math.round(totalWastageLoss * 100) / 100,
      totalCourtesyLoss: Math.round(totalCourtesyLoss * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      distributions,
    };
  }

  // Backup & Restore
  static exportFullBackupJson(): string {
    const backupData: Record<string, unknown> = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      try {
        const val = localStorage.getItem(key);
        if (val) backupData[name] = JSON.parse(val);
      } catch (err) {
        console.error(err);
      }
    });
    return JSON.stringify(backupData, null, 2);
  }

  static importFullBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        if (data[name] !== undefined) {
          localStorage.setItem(key, JSON.stringify(data[name]));
        }
      });
      window.dispatchEvent(new Event('dimkhata_storage_change'));
      return true;
    } catch (err) {
      console.error('Import backup failed:', err);
      return false;
    }
  }

  static resetToDemoData(): void {
    localStorage.clear();
    setStored(STORAGE_KEYS.COMPANY, INITIAL_COMPANY_SETTINGS);
    setStored(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    setStored(STORAGE_KEYS.PARTNERS, INITIAL_PARTNERS);
    setStored(STORAGE_KEYS.CATEGORIES, INITIAL_EGG_CATEGORIES);
    setStored(STORAGE_KEYS.DAILY_RATES, INITIAL_DAILY_RATES);
    setStored(STORAGE_KEYS.STOCKS, INITIAL_INVENTORY_STOCKS);
    setStored(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setStored(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    setStored(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    setStored(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    setStored(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    setStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    window.dispatchEvent(new Event('dimkhata_storage_change'));
  }
}
