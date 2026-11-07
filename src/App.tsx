// ====================================================================
// DIMKHATA (ডিমখাতা) — Main Application Root
// Business: Sharif & Eman Enterprise (শরিফ এন্ড ইমান এন্টারপ্রাইজ)
// ====================================================================

import React, { useState, useEffect } from 'react';
import { DimKhataStore } from './lib/storage-store';
import {
  UserProfile,
  Branch,
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
  Partner,
  PartnerDrawing,
  CashbookTransaction,
  AuditLog,
  PayrollRecord,
  SalaryAdvance,
} from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTabId } from './components/layout/Sidebar';
import { DailyRateModal } from './components/modals/DailyRateModal';
import { PrintInvoiceModal } from './components/modals/PrintInvoiceModal';

// Feature Views
import { DashboardView } from './features/DashboardView';
import { DailyPricingView } from './features/DailyPricingView';
import { SourcingPurchasesView } from './features/SourcingPurchasesView';
import { SalesPosView } from './features/SalesPosView';
import { WastageCourtesyView } from './features/WastageCourtesyView';
import { PartiesKycView } from './features/PartiesKycView';
import { CashbookBankingView } from './features/CashbookBankingView';
import { PayrollHrView } from './features/PayrollHrView';
import { ExpensesAssetsView } from './features/ExpensesAssetsView';
import { ProfitSettlementView } from './features/ProfitSettlementView';
import { AuditLogBranchesView } from './features/AuditLogBranchesView';

export const App: React.FC = () => {
  // State from DimKhataStore
  const [currentUser, setCurrentUser] = useState<UserProfile>(DimKhataStore.getActiveUser());
  const [currentTab, setCurrentTab] = useState<NavTabId>('dashboard');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(DimKhataStore.getSelectedBranchId());

  // Data collections
  const [company, setCompany] = useState(DimKhataStore.getCompany());
  const [branches, setBranches] = useState<Branch[]>(DimKhataStore.getBranches());
  const [categories, setCategories] = useState<EggCategory[]>(DimKhataStore.getCategories());
  const [rates, setRates] = useState<DailyMarketRate[]>(DimKhataStore.getDailyRates());
  const [stocks, setStocks] = useState<InventoryStock[]>(DimKhataStore.getStocks(selectedBranchId));
  const [allBranchStocks, setAllBranchStocks] = useState<InventoryStock[]>(DimKhataStore.getAllBranchStocks());
  const [customers, setCustomers] = useState<Customer[]>(DimKhataStore.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(DimKhataStore.getSuppliers());
  const [employees, setEmployees] = useState<Employee[]>(DimKhataStore.getEmployees());
  const [accounts, setAccounts] = useState<FinancialAccount[]>(DimKhataStore.getAccounts());
  const [sales, setSales] = useState<SalesInvoice[]>(DimKhataStore.getSales());
  const [purchases, setPurchases] = useState<Purchase[]>(DimKhataStore.getPurchases());
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(DimKhataStore.getAdjustments());
  const [expenses, setExpenses] = useState<Expense[]>(DimKhataStore.getExpenses());
  const [partners, setPartners] = useState<Partner[]>(DimKhataStore.getPartners());
  const [drawings, setDrawings] = useState<PartnerDrawing[]>(DimKhataStore.getPartnerDrawings());
  const [cashbook, setCashbook] = useState<CashbookTransaction[]>(DimKhataStore.getCashbook());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(DimKhataStore.getAuditLogs());
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(DimKhataStore.getPayrolls());
  const [advances, setAdvances] = useState<SalaryAdvance[]>(DimKhataStore.getSalaryAdvances());

  // Modals state
  const [isDailyRateModalOpen, setIsDailyRateModalOpen] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<SalesInvoice | null>(null);

  // Reload all state from Store
  const reloadData = () => {
    setCompany(DimKhataStore.getCompany());
    setBranches(DimKhataStore.getBranches());
    setCategories(DimKhataStore.getCategories());
    setRates(DimKhataStore.getDailyRates());
    setStocks(DimKhataStore.getStocks(selectedBranchId));
    setAllBranchStocks(DimKhataStore.getAllBranchStocks());
    setCustomers(DimKhataStore.getCustomers());
    setSuppliers(DimKhataStore.getSuppliers());
    setEmployees(DimKhataStore.getEmployees());
    setAccounts(DimKhataStore.getAccounts());
    setSales(DimKhataStore.getSales());
    setPurchases(DimKhataStore.getPurchases());
    setAdjustments(DimKhataStore.getAdjustments());
    setExpenses(DimKhataStore.getExpenses());
    setPartners(DimKhataStore.getPartners());
    setDrawings(DimKhataStore.getPartnerDrawings());
    setCashbook(DimKhataStore.getCashbook());
    setAuditLogs(DimKhataStore.getAuditLogs());
    setPayrolls(DimKhataStore.getPayrolls());
    setAdvances(DimKhataStore.getSalaryAdvances());
  };

  useEffect(() => {
    // Initial cloud sync + real-time subscription with Supabase
    DimKhataStore.syncWithSupabase();
  }, []);

  useEffect(() => {
    window.addEventListener('dimkhata_storage_change', reloadData);
    return () => window.removeEventListener('dimkhata_storage_change', reloadData);
  }, [selectedBranchId]);

  const handleSelectBranch = (bId: string) => {
    setSelectedBranchId(bId);
    DimKhataStore.setSelectedBranchId(bId);
    setStocks(DimKhataStore.getStocks(bId));
  };

  // Toggle user role between Admin (Sharif) and Staff (Kawsar Ahmed)
  const handleToggleUserRole = () => {
    if (currentUser.role === 'ADMIN') {
      const staffUser: UserProfile = {
        id: 'staff-kawsar',
        employee_code: 'SE-EMP-001',
        full_name: 'কাওসার আহমেদ (ক্যাশিয়ার)',
        role: 'STAFF',
        phone: '01822-112233',
        is_active: true,
      };
      DimKhataStore.setActiveUser(staffUser);
      setCurrentUser(staffUser);
      // If current tab was admin only, redirect to dashboard
      if (
        currentTab === 'profit-settlement' ||
        currentTab === 'audit-branches' ||
        currentTab === 'cashbook' ||
        currentTab === 'payroll'
      ) {
        setCurrentTab('dashboard');
      }
    } else {
      const adminUser: UserProfile = {
        id: 'admin-sharif',
        full_name: 'শরিফ (মালিক)',
        role: 'ADMIN',
        phone: '01711-100001',
        is_active: true,
      };
      DimKhataStore.setActiveUser(adminUser);
      setCurrentUser(adminUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col font-sans">
      {/* Apple Two-Row Top Navbar */}
      <Navbar
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={handleSelectBranch}
        currentUser={currentUser}
        onToggleUserRole={handleToggleUserRole}
        onOpenRatesModal={() => setIsDailyRateModalOpen(true)}
        onRefresh={reloadData}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Desktop Rail & Mobile Sticky Dock */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 pb-24 md:pb-10 overflow-y-auto max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              categories={categories}
              stocks={stocks}
              rates={rates}
              customers={customers}
              sales={sales}
              accounts={accounts}
              userRole={currentUser.role}
              onNavigate={setCurrentTab}
              onOpenRateModal={() => setIsDailyRateModalOpen(true)}
              onSelectInvoiceForPrint={setPrintInvoice}
            />
          )}

          {currentTab === 'daily-pricing' && (
            <DailyPricingView
              categories={categories}
              stocks={stocks}
              rates={rates}
              branchId={selectedBranchId}
              onRefresh={reloadData}
            />
          )}

          {currentTab === 'sourcing' && (
            <SourcingPurchasesView
              suppliers={suppliers}
              categories={categories}
              branches={branches}
              accounts={accounts}
              purchases={purchases}
              onRefresh={reloadData}
            />
          )}

          {currentTab === 'sales-pos' && (
            <SalesPosView
              customers={customers}
              categories={categories}
              rates={rates}
              stocks={stocks}
              allBranchStocks={allBranchStocks}
              branches={branches}
              accounts={accounts}
              sales={sales}
              company={company}
              onRefresh={reloadData}
              onSelectInvoiceForPrint={setPrintInvoice}
            />
          )}

          {currentTab === 'wastage-courtesy' && (
            <WastageCourtesyView
              categories={categories}
              stocks={stocks}
              allBranchStocks={allBranchStocks}
              branches={branches}
              adjustments={adjustments}
              onRefresh={reloadData}
            />
          )}

          {currentTab === 'parties' && (
            <PartiesKycView
              customers={customers}
              suppliers={suppliers}
              accounts={accounts}
              company={company}
              onRefresh={reloadData}
            />
          )}

          {currentTab === 'cashbook' && currentUser.role === 'ADMIN' && (
            <CashbookBankingView
              accounts={accounts}
              cashbook={cashbook}
              branches={branches}
              onRefresh={reloadData}
            />
          )}

          {currentTab === 'payroll' && currentUser.role === 'ADMIN' && (
            <PayrollHrView
              employees={employees}
              advances={advances}
              payrolls={payrolls}
              accounts={accounts}
              branches={branches}
              onRefresh={reloadData}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesAssetsView
              expenses={expenses}
              accounts={accounts}
              branches={branches}
              onRefresh={reloadData}
            />
          )}

          {currentTab === 'profit-settlement' && currentUser.role === 'ADMIN' && (
            <ProfitSettlementView
              partners={partners}
              drawings={drawings}
              accounts={accounts}
              onRefresh={reloadData}
            />
          )}

          {currentTab === 'audit-branches' && currentUser.role === 'ADMIN' && (
            <AuditLogBranchesView
              branches={branches}
              auditLogs={auditLogs}
              onRefresh={reloadData}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <DailyRateModal
        isOpen={isDailyRateModalOpen}
        onClose={() => setIsDailyRateModalOpen(false)}
        categories={categories}
        branchId={selectedBranchId}
        onSaved={reloadData}
      />

      {printInvoice && (
        <PrintInvoiceModal
          isOpen={Boolean(printInvoice)}
          onClose={() => setPrintInvoice(null)}
          invoice={printInvoice}
          customer={customers.find((c) => c.id === printInvoice.customer_id) || null}
          company={company}
          categories={categories}
        />
      )}
    </div>
  );
};
