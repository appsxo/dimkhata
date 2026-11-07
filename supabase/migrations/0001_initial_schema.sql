-- ====================================================================
-- DIMKHATA (ডিমখাতা) — Supabase PostgreSQL Enterprise Schema
-- Business: Sharif & Eman Enterprise (শরিফ এন্ড ইমান এন্টারপ্রাইজ)
-- Zero-Cost ($0) Scalable Database Architecture
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Atomic Sequential Unique ID Generator
CREATE TABLE IF NOT EXISTS public.entity_sequences (
    seq_key TEXT PRIMARY KEY,
    current_val BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.next_unique_code(
    p_prefix TEXT,
    p_include_year BOOLEAN DEFAULT FALSE,
    p_pad_length INTEGER DEFAULT 3
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_year TEXT := to_char(NOW() AT TIME ZONE 'Asia/Dhaka', 'YYYY');
    v_key TEXT := CASE WHEN p_include_year THEN p_prefix || '-' || v_year ELSE p_prefix END;
    v_next BIGINT;
BEGIN
    INSERT INTO public.entity_sequences (seq_key, current_val, updated_at)
    VALUES (v_key, 1, NOW())
    ON CONFLICT (seq_key)
    DO UPDATE SET current_val = public.entity_sequences.current_val + 1, updated_at = NOW()
    RETURNING current_val INTO v_next;

    RETURN v_key || '-' || lpad(v_next::TEXT, p_pad_length, '0');
END;
$$;

-- 3. Company Settings
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name_bn TEXT NOT NULL DEFAULT 'শরিফ এন্ড ইমান এন্টারপ্রাইজ',
    company_name_en TEXT NOT NULL DEFAULT 'Sharif & Eman Enterprise',
    tagline TEXT DEFAULT 'ডিমের পাইকারি ও খুচরা আড়ৎ',
    phone TEXT NOT NULL DEFAULT '01700-000000',
    email TEXT DEFAULT 'contact@sharifeman.com',
    address TEXT NOT NULL DEFAULT 'পাইকারি বাজার, ঢাকা, বাংলাদেশ',
    logo_url TEXT,
    invoice_footer_note TEXT DEFAULT 'বিকাশ/নগদ/ব্যাংকের মাধ্যমে পরিশোধযোগ্য। কোনো ডিম পরিবর্তনের দাবি ৭২ ঘণ্টার মধ্যে প্রযোজ্য।',
    currency_symbol TEXT DEFAULT '৳',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Branches / Multi-Godown Support (Req 3)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. User Profiles & Role-Based Access Control (Req 4)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_code TEXT UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
    branch_id UUID REFERENCES public.branches(id),
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Egg Categories & Daily Market Rates (Req 6)
CREATE TABLE IF NOT EXISTS public.egg_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name_bn TEXT NOT NULL,
    name_en TEXT NOT NULL,
    pcs_per_crate INTEGER NOT NULL DEFAULT 30,
    color_hex TEXT DEFAULT '#f59e0b',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_market_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate_date DATE NOT NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.egg_categories(id) ON DELETE CASCADE,
    buying_rate_pc NUMERIC(10,2) NOT NULL DEFAULT 0,
    wholesale_rate_pc NUMERIC(10,2) NOT NULL DEFAULT 0,
    retail_rate_pc NUMERIC(10,2) NOT NULL DEFAULT 0,
    updated_by UUID REFERENCES public.user_profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (rate_date, branch_id, category_id)
);

-- 7. Live Stock & Landed Cost Valuation (Req 6, 7)
CREATE TABLE IF NOT EXISTS public.inventory_stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.egg_categories(id) ON DELETE CASCADE,
    qty_pcs BIGINT NOT NULL DEFAULT 0,
    avg_landed_cost_per_pc NUMERIC(12,4) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, category_id)
);

-- 8. KYC Profiles: Customers & Suppliers (Req 1, 2)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    business_name TEXT,
    phone TEXT NOT NULL,
    emergency_phone TEXT,
    customer_type TEXT NOT NULL DEFAULT 'WHOLESALE' CHECK (customer_type IN ('WHOLESALE', 'RETAIL', 'BOTH')),
    present_address TEXT,
    permanent_address TEXT,
    nid_number TEXT,
    kyc_doc_urls JSONB DEFAULT '[]'::jsonb,
    credit_limit NUMERIC(12,2) NOT NULL DEFAULT 50000,
    current_due NUMERIC(12,2) NOT NULL DEFAULT 0,
    due_alert_days INTEGER NOT NULL DEFAULT 7,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    farm_name TEXT,
    phone TEXT NOT NULL,
    emergency_phone TEXT,
    present_address TEXT,
    permanent_address TEXT,
    nid_number TEXT,
    kyc_doc_urls JSONB DEFAULT '[]'::jsonb,
    current_payable NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Employees, Advances & Payroll (Req 11)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    designation TEXT NOT NULL DEFAULT 'স্টাফ / বিক্রয়কর্মী',
    phone TEXT NOT NULL,
    emergency_contact TEXT,
    present_address TEXT,
    permanent_address TEXT,
    nid_number TEXT,
    kyc_doc_urls JSONB DEFAULT '[]'::jsonb,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    salary_type TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (salary_type IN ('MONTHLY', 'DAILY')),
    base_salary NUMERIC(12,2) NOT NULL DEFAULT 15000,
    branch_id UUID REFERENCES public.branches(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.salary_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    advance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12,2) NOT NULL,
    purpose TEXT,
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_code TEXT NOT NULL UNIQUE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    salary_month TEXT NOT NULL, -- e.g. '2026-11'
    base_salary NUMERIC(12,2) NOT NULL,
    bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
    deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    advances_deducted NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_payable NUMERIC(12,2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PENDING', 'PAID')),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Financial Accounts & Live Cashbook (Req 5)
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- 'দোকানের ক্যাশ ড্রয়ার', 'বিকাশ মার্চেন্ট', 'ইসলামী ব্যাংক'
    account_type TEXT NOT NULL CHECK (account_type IN ('CASH', 'BANK', 'MFS')),
    account_number TEXT,
    bank_name TEXT,
    branch_id UUID REFERENCES public.branches(id),
    current_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cashbook_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id),
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('CASH_IN', 'CASH_OUT', 'CONTRA_TRANSFER')),
    category TEXT NOT NULL, -- 'SALE_COLLECTION', 'DUE_COLLECTION', 'PURCHASE_PAYMENT', 'EXPENSE', 'SALARY', 'PARTNER_DRAWING', 'CAPITAL_ASSET'
    amount NUMERIC(14,2) NOT NULL,
    reference_id TEXT, -- Invoice code, Purchase code, etc.
    description TEXT,
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Purchases & Landed Cost Engine (Req 9)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_code TEXT NOT NULL UNIQUE,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    total_eggs_pcs BIGINT NOT NULL DEFAULT 0,
    raw_subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    truck_fare NUMERIC(12,2) NOT NULL DEFAULT 0,
    labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    other_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_landed_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    due_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_account_id UUID REFERENCES public.financial_accounts(id),
    notes TEXT,
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.egg_categories(id),
    qty_pcs BIGINT NOT NULL,
    raw_rate_per_pc NUMERIC(10,2) NOT NULL,
    raw_total NUMERIC(14,2) NOT NULL,
    landed_cost_share NUMERIC(12,2) NOT NULL DEFAULT 0,
    effective_landed_cost_per_pc NUMERIC(12,4) NOT NULL
);

-- 12. Sales Invoices & Delivery Challans (Req 9, 10)
CREATE TABLE IF NOT EXISTS public.sales_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_code TEXT NOT NULL UNIQUE,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    sale_type TEXT NOT NULL CHECK (sale_type IN ('WHOLESALE', 'RETAIL')),
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    due_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_account_id UUID REFERENCES public.financial_accounts(id),
    payment_method TEXT NOT NULL DEFAULT 'CASH',
    has_challan BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.egg_categories(id),
    qty_pcs BIGINT NOT NULL,
    unit_price_pc NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(14,2) NOT NULL,
    cogs_landed_cost_per_pc NUMERIC(12,4) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.delivery_challans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challan_code TEXT NOT NULL UNIQUE,
    invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
    challan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vehicle_type TEXT,
    vehicle_number TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    destination_address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Wastage & Courtesy Stock Deductions (Req 7, 8)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_code TEXT NOT NULL UNIQUE,
    adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    category_id UUID NOT NULL REFERENCES public.egg_categories(id),
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('WASTAGE_BROKEN', 'WASTAGE_ROTTEN', 'COURTESY_GIFT', 'BRANCH_TRANSFER')),
    qty_pcs BIGINT NOT NULL,
    unit_landed_cost NUMERIC(12,4) NOT NULL,
    total_cost_value NUMERIC(14,2) NOT NULL,
    recipient_or_reason TEXT,
    target_branch_id UUID REFERENCES public.branches(id),
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Customer Due Collections & Supplier Payments
CREATE TABLE IF NOT EXISTS public.customer_due_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_code TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(14,2) NOT NULL,
    payment_account_id UUID NOT NULL REFERENCES public.financial_accounts(id),
    note TEXT,
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_code TEXT NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(14,2) NOT NULL,
    payment_account_id UUID NOT NULL REFERENCES public.financial_accounts(id),
    note TEXT,
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Operational Expenses & Capital Assets (Req 12)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_code TEXT NOT NULL UNIQUE,
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    expense_category TEXT NOT NULL CHECK (expense_category IN ('FIXED', 'VARIABLE', 'CAPITAL_ASSET', 'MISC')),
    title TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_capital_asset BOOLEAN NOT NULL DEFAULT FALSE,
    receipt_doc_url TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Partner Profit Distribution (Req 14: Sharif & Eman 2:1 Configurable)
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    share_weight NUMERIC(5,2) NOT NULL, -- Sharif: 2.00, Eman: 1.00
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_drawings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.partners(id),
    drawing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(14,2) NOT NULL,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id),
    notes TEXT,
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.monthly_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_month TEXT NOT NULL UNIQUE, -- e.g. '2026-11'
    total_sales_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_cogs NUMERIC(14,2) NOT NULL DEFAULT 0,
    gross_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_operating_expenses NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_salaries NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_wastage_loss NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_courtesy_loss NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
    distribution_details JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Immutable Digital Audit Trail (Req 3)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    actor_code TEXT,
    actor_name TEXT,
    entity_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    client_ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Unified Cloud State Store for Serverless GitHub Pages + Supabase Real-Time Sync
CREATE TABLE IF NOT EXISTS public.dimkhata_kv_store (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

