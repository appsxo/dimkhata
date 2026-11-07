import React, { useState, useEffect } from 'react';
import { DimKhataStore } from './lib/storage-store';
import { useLanguage } from './lib/i18n';
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
import { PrintInvoiceModal } from './components/modals/PrintInvoiceModal';
import { SecurityPinModal } from './components/modals/SecurityPinModal';
import { AdminBackupModal } from './components/modals/AdminBackupModal';

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
import { AuthGateView } from './features/AuthGateView';
import { SupabaseSetupGateView } from './features/SupabaseSetupGateView';
import { CloudSyncStatus } from './lib/storage-store';

export const App: React.FC = () => {
  const { t } = useLanguage();

  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(DimKhataStore.getCloudStatus());
  const [authSession, setAuthSession] = useState(DimKhataStore.getAuthSession());
  const [currentUser, setCurrentUser] = useState<UserProfile>(DimKhataStore.getActiveUser());
  const [currentTab, setCurrentTab] = useState<NavTabId>('dashboard');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(DimKhataStore.getSelectedBranchId());

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

  const [printInvoice, setPrintInvoice] = useState<SalesInvoice | null>(null);
  const [securityModalMode, setSecurityModalMode] = useState<'UNLOCK_ADMIN' | 'MANAGE_SECURITY' | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

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
    setCloudStatus(DimKhataStore.getCloudStatus());
  };

  useEffect(() => {
    DimKhataStore.initNetworkMonitoring();
    DimKhataStore.syncWithSupabase().then(() => {
      setCloudStatus(DimKhataStore.getCloudStatus());
    });
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const session = DimKhataStore.getAuthSession();
      setAuthSession(session);
      if (session.isAuthenticated && session.user) {
        setCurrentUser(session.user);
      }
    };
    window.addEventListener('dimkhata_auth_change', handleAuthChange);
    return () => window.removeEventListener('dimkhata_auth_change', handleAuthChange);
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



  const handleLogout = () => {
    DimKhataStore.logout();
    setAuthSession(DimKhataStore.getAuthSession());
    setCurrentUser(DimKhataStore.getActiveUser());
  };

  // 1. Initial Cloud Handshake:
  if (cloudStatus === 'INITIALIZING') {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-center items-center p-4 font-sans select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center mb-4">
          <div className="w-8 h-8 border-3 border-[#0066cc]/30 border-t-[#0066cc] rounded-full animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-[#1d1d1f] mb-1">
          {t('ক্লাউড সংযোগ স্থাপন করা হচ্ছে...', 'Connecting to Cloud Database...')}
        </h2>
        <p className="text-[13px] text-[#7a7a7a]">
          {t('রিয়েল-টাইম সিঙ্ক ভেরিফিকেশন চলছে', 'Verifying real-time Supabase synchronization')}
        </p>
      </div>
    );
  }

  // 2. Mandatory Supabase Connection Gate:
  // The system refuses to operate without a healthy Supabase connection to prevent data loss.
  if (cloudStatus !== 'ONLINE') {
    return (
      <SupabaseSetupGateView
        status={cloudStatus}
        onConnected={() => {
          setCloudStatus(DimKhataStore.getCloudStatus());
          reloadData();
        }}
      />
    );
  }

  // 2. Zero-Trust User Secret Authentication Gate:
  if (!authSession.isAuthenticated || !authSession.user) {
    return (
      <AuthGateView
        onLoginSuccess={(user) => {
          setAuthSession(DimKhataStore.getAuthSession());
          setCurrentUser(user);
          reloadData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col font-sans overflow-x-clip">
      <Navbar
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={handleSelectBranch}
        currentUser={currentUser}
        onRequestBackup={() => setIsBackupModalOpen(true)}
        onOpenSecurityModal={() => setSecurityModalMode('MANAGE_SECURITY')}
        onLogout={handleLogout}
        onRefresh={reloadData}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
          currentUser={currentUser}
          onLogout={handleLogout}
          onRequestBackup={() => setIsBackupModalOpen(true)}
          onOpenSecurityModal={() => setSecurityModalMode('MANAGE_SECURITY')}
        />

        <main className="flex-1 p-3 sm:p-5 pb-24 md:pb-8 max-w-7xl w-full mx-auto min-w-0">
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

      {securityModalMode && (
        <SecurityPinModal
          mode={securityModalMode}
          onClose={() => setSecurityModalMode(null)}
        />
      )}

      <AdminBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};
