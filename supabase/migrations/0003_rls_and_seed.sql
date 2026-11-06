-- ====================================================================
-- DIMKHATA (ডিমখাতা) — Seed Data & Row-Level Security (RLS)
-- ====================================================================

-- 1. Enable RLS on Tables
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egg_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_market_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_due_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbook_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to check if current user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = TRUE
    );
$$;

-- 3. RLS Policies: Authenticated users have operational access; Admins have full access
-- Public / Staff can read egg categories, branches, daily rates, stock
CREATE POLICY "Allow authenticated read categories" ON public.egg_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read daily rates" ON public.daily_market_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read stock" ON public.inventory_stocks FOR SELECT TO authenticated USING (true);

-- Sales & POS: Staff & Admin can create and view
CREATE POLICY "Allow authenticated read sales" ON public.sales_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert sales" ON public.sales_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated read sales items" ON public.sales_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert sales items" ON public.sales_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated read challans" ON public.delivery_challans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert challans" ON public.delivery_challans FOR INSERT TO authenticated WITH CHECK (true);

-- Customers & Due:
CREATE POLICY "Allow authenticated read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage customers" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read collections" ON public.customer_due_collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert collections" ON public.customer_due_collections FOR INSERT TO authenticated WITH CHECK (true);

-- Sourcing & Suppliers:
CREATE POLICY "Allow authenticated read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read purchases" ON public.purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert purchases" ON public.purchases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated read purchase items" ON public.purchase_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert purchase items" ON public.purchase_items FOR INSERT TO authenticated WITH CHECK (true);

-- Stock Adjustments (Wastage & Courtesy):
CREATE POLICY "Allow authenticated read adjustments" ON public.stock_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert adjustments" ON public.stock_adjustments FOR INSERT TO authenticated WITH CHECK (true);

-- Expenses:
CREATE POLICY "Allow authenticated read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);

-- Financial Accounts & Cashbook:
CREATE POLICY "Allow authenticated read accounts" ON public.financial_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read cashbook" ON public.cashbook_transactions FOR SELECT TO authenticated USING (true);

-- Restricted Admin Only Tables:
CREATE POLICY "Admin full access company settings" ON public.company_settings FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access employees" ON public.employees FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access salary advances" ON public.salary_advances FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access payroll" ON public.payroll_records FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access partners" ON public.partners FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access drawings" ON public.partner_drawings FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access settlements" ON public.monthly_settlements FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());

-- 4. Initial Seed Data
-- Main Company
INSERT INTO public.company_settings (id, company_name_bn, company_name_en, tagline, phone, address)
VALUES ('00000000-0000-0000-0000-000000000001', 'শরিফ এন্ড ইমান এন্টারপ্রাইজ', 'Sharif & Eman Enterprise', 'ডিমের পাইকারি ও খুচরা আড়ৎ', '01711-223344', 'পাইকারি ডিম বাজার, তেজগাঁও/আড়ৎ, ঢাকা')
ON CONFLICT (id) DO NOTHING;

-- Main Branch
INSERT INTO public.branches (id, branch_code, name, address, phone, is_main, is_active)
VALUES ('00000000-0000-0000-0000-000000000010', 'SE-BR-001', 'প্রধান আড়ৎ ও গোডাউন (হেড অফিস)', 'তেজগাঁও ডিম মার্কেট, ঢাকা', '01711-223344', TRUE, TRUE)
ON CONFLICT (branch_code) DO NOTHING;

-- 5 Default Egg Categories (Req 6)
INSERT INTO public.egg_categories (code, name_bn, name_en, pcs_per_crate, color_hex, sort_order)
VALUES 
    ('CAT-RED', 'লাল ডিম (ফার্মের)', 'Brown Farm Layer Egg', 30, '#b45309', 1),
    ('CAT-PAR', 'প্যারাগন ডিম', 'Paragon Egg', 30, '#d97706', 2),
    ('CAT-DUCK', 'হাঁসের ডিম', 'Duck Egg', 30, '#0284c7', 3),
    ('CAT-QUAIL', 'কোয়েল পাখির ডিম', 'Quail Egg', 50, '#10b981', 4),
    ('CAT-DESHI', 'দেশি মুরগির ডিম', 'Deshi Hen Egg', 30, '#8b5cf6', 5)
ON CONFLICT (code) DO NOTHING;

-- Default Partners with 2:1 Ratio (Req 14: Sharif 2, Eman 1)
INSERT INTO public.partners (name, phone, share_weight, is_active)
VALUES 
    ('শরিফ (Sharif)', '01711-000001', 2.00, TRUE),
    ('ইমান (Eman)', '01711-000002', 1.00, TRUE);

-- Default Financial Accounts (Req 5)
INSERT INTO public.financial_accounts (name, account_type, account_number, current_balance, is_default, is_active)
VALUES 
    ('দোকানের ক্যাশ ড্রয়ার (Main Cash)', 'CASH', 'CASH-01', 50000.00, TRUE, TRUE),
    ('বিকাশ মার্চেন্ট (bKash)', 'MFS', '01700-112233', 25000.00, FALSE, TRUE),
    ('নগদ পার্সোনাল (Nagad)', 'MFS', '01700-445566', 15000.00, FALSE, TRUE),
    ('ইসলামী ব্যাংক বাংলাদেশ (IBBL)', 'BANK', '2050-12345678', 120000.00, FALSE, TRUE);
