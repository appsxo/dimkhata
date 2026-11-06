-- ====================================================================
-- DIMKHATA (ডিমখাতা) — Database Triggers & Stored Procedures
-- Implements WAC Calculation, Live Stock Sync, Live Cashbook & Audit
-- ====================================================================

-- 1. Helper function to update Cashbook and Account Balance
CREATE OR REPLACE FUNCTION public.fn_post_cashbook(
    p_account_id UUID,
    p_branch_id UUID,
    p_type TEXT,
    p_category TEXT,
    p_amount NUMERIC,
    p_reference_id TEXT,
    p_description TEXT,
    p_recorded_by UUID
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    -- Insert transaction
    INSERT INTO public.cashbook_transactions (
        account_id, branch_id, transaction_type, category, amount, reference_id, description, recorded_by
    ) VALUES (
        p_account_id, p_branch_id, p_type, p_category, p_amount, p_reference_id, p_description, p_recorded_by
    );

    -- Update account balance
    IF p_type = 'CASH_IN' THEN
        UPDATE public.financial_accounts
        SET current_balance = current_balance + p_amount
        WHERE id = p_account_id;
    ELSIF p_type = 'CASH_OUT' THEN
        UPDATE public.financial_accounts
        SET current_balance = current_balance - p_amount
        WHERE id = p_account_id;
    END IF;
END;
$$;

-- 2. Trigger: When Purchase Header is saved -> Update Supplier Payable & Cashbook
CREATE OR REPLACE FUNCTION public.fn_process_purchase()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Update Supplier Payable if due exists
    IF NEW.due_amount > 0 THEN
        UPDATE public.suppliers
        SET current_payable = current_payable + NEW.due_amount
        WHERE id = NEW.supplier_id;
    END IF;

    -- Post cash out if paid from an account
    IF NEW.paid_amount > 0 AND NEW.payment_account_id IS NOT NULL THEN
        PERFORM public.fn_post_cashbook(
            NEW.payment_account_id,
            NEW.branch_id,
            'CASH_OUT',
            'PURCHASE_PAYMENT',
            NEW.paid_amount,
            NEW.purchase_code,
            'খামারী/মহাজন থেকে ডিম কেনা বাবদ পেমেন্ট',
            NEW.recorded_by
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 2b. Trigger: When Purchase Item is saved -> Calculate WAC & Increase Stock
CREATE OR REPLACE FUNCTION public.fn_process_purchase_item()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_branch_id UUID;
    v_existing_qty BIGINT;
    v_existing_wac NUMERIC;
    v_new_qty BIGINT;
    v_new_wac NUMERIC;
BEGIN
    SELECT branch_id INTO v_branch_id FROM public.purchases WHERE id = NEW.purchase_id;
    IF v_branch_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(qty_pcs, 0), COALESCE(avg_landed_cost_per_pc, 0)
    INTO v_existing_qty, v_existing_wac
    FROM public.inventory_stocks
    WHERE branch_id = v_branch_id AND category_id = NEW.category_id;

    IF NOT FOUND THEN
        v_existing_qty := 0;
        v_existing_wac := 0;
    END IF;

    v_new_qty := v_existing_qty + NEW.qty_pcs;

    IF v_new_qty > 0 THEN
        v_new_wac := ((v_existing_qty * v_existing_wac) + (NEW.qty_pcs * NEW.effective_landed_cost_per_pc)) / v_new_qty;
    ELSE
        v_new_wac := NEW.effective_landed_cost_per_pc;
    END IF;

    INSERT INTO public.inventory_stocks (branch_id, category_id, qty_pcs, avg_landed_cost_per_pc, updated_at)
    VALUES (v_branch_id, NEW.category_id, v_new_qty, v_new_wac, NOW())
    ON CONFLICT (branch_id, category_id)
    DO UPDATE SET
        qty_pcs = v_new_qty,
        avg_landed_cost_per_pc = v_new_wac,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- 3. Trigger: When Sales Invoice Header is saved -> Update Customer Due & Cashbook
CREATE OR REPLACE FUNCTION public.fn_process_sales_invoice()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Update Customer Due if credit sale
    IF NEW.due_amount > 0 THEN
        UPDATE public.customers
        SET current_due = current_due + NEW.due_amount
        WHERE id = NEW.customer_id;
    END IF;

    -- Post cash in if paid amount > 0
    IF NEW.paid_amount > 0 AND NEW.payment_account_id IS NOT NULL THEN
        PERFORM public.fn_post_cashbook(
            NEW.payment_account_id,
            NEW.branch_id,
            'CASH_IN',
            'SALE_COLLECTION',
            NEW.paid_amount,
            NEW.invoice_code,
            'ডিম বিক্রয় মেমো বাবদ আদায়',
            NEW.recorded_by
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 3b. Trigger: When Sales Item is saved -> Deduct Stock
CREATE OR REPLACE FUNCTION public.fn_process_sales_item()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_branch_id UUID;
BEGIN
    SELECT branch_id INTO v_branch_id FROM public.sales_invoices WHERE id = NEW.invoice_id;
    IF v_branch_id IS NOT NULL THEN
        UPDATE public.inventory_stocks
        SET qty_pcs = GREATEST(0, qty_pcs - NEW.qty_pcs),
            updated_at = NOW()
        WHERE branch_id = v_branch_id AND category_id = NEW.category_id;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Trigger: Stock Adjustments (Wastage / Courtesy / Transfer) -> Deduct/Transfer Stock
CREATE OR REPLACE FUNCTION public.fn_process_stock_adjustment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Deduct from origin branch
    UPDATE public.inventory_stocks
    SET qty_pcs = GREATEST(0, qty_pcs - NEW.qty_pcs),
        updated_at = NOW()
    WHERE branch_id = NEW.branch_id AND category_id = NEW.category_id;

    -- If Inter-Branch transfer, add to target branch
    IF NEW.adjustment_type = 'BRANCH_TRANSFER' AND NEW.target_branch_id IS NOT NULL THEN
        INSERT INTO public.inventory_stocks (branch_id, category_id, qty_pcs, avg_landed_cost_per_pc, updated_at)
        VALUES (NEW.target_branch_id, NEW.category_id, NEW.qty_pcs, NEW.unit_landed_cost, NOW())
        ON CONFLICT (branch_id, category_id)
        DO UPDATE SET
            qty_pcs = public.inventory_stocks.qty_pcs + NEW.qty_pcs,
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$;

-- 5. Trigger: Customer Due Collection -> Update Balance & Due
CREATE OR REPLACE FUNCTION public.fn_process_due_collection()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.customers
    SET current_due = GREATEST(0, current_due - NEW.amount)
    WHERE id = NEW.customer_id;

    PERFORM public.fn_post_cashbook(
        NEW.payment_account_id,
        NEW.branch_id,
        'CASH_IN',
        'DUE_COLLECTION',
        NEW.amount,
        NEW.receipt_code,
        'বকেয়া কালেকশন বাবদ জমা',
        NEW.recorded_by
    );

    RETURN NEW;
END;
$$;

-- 5b. Trigger: Supplier Payment -> Update Payable & Cash Out
CREATE OR REPLACE FUNCTION public.fn_process_supplier_payment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.suppliers
    SET current_payable = GREATEST(0, current_payable - NEW.amount)
    WHERE id = NEW.supplier_id;

    PERFORM public.fn_post_cashbook(
        NEW.payment_account_id,
        NEW.branch_id,
        'CASH_OUT',
        'PURCHASE_PAYMENT',
        NEW.amount,
        NEW.payment_code,
        'মহাজন বকেয়া পরিশোধ',
        NEW.recorded_by
    );

    RETURN NEW;
END;
$$;

-- 6. Trigger: Expenses -> Cash Out
CREATE OR REPLACE FUNCTION public.fn_process_expense()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM public.fn_post_cashbook(
        NEW.account_id,
        NEW.branch_id,
        'CASH_OUT',
        CASE WHEN NEW.is_capital_asset THEN 'CAPITAL_ASSET' ELSE 'EXPENSE' END,
        NEW.amount,
        NEW.expense_code,
        NEW.title,
        NEW.recorded_by
    );

    RETURN NEW;
END;
$$;

-- 7. Trigger: Salary Advance & Payroll -> Cash Out
CREATE OR REPLACE FUNCTION public.fn_process_salary_advance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_def_acc UUID;
    v_branch UUID;
BEGIN
    SELECT branch_id INTO v_branch FROM public.employees WHERE id = NEW.employee_id;
    SELECT id INTO v_def_acc FROM public.financial_accounts WHERE branch_id = v_branch AND is_default = TRUE LIMIT 1;
    IF v_def_acc IS NULL THEN
        SELECT id INTO v_def_acc FROM public.financial_accounts WHERE is_default = TRUE LIMIT 1;
    END IF;

    IF v_def_acc IS NOT NULL THEN
        PERFORM public.fn_post_cashbook(
            v_def_acc,
            COALESCE(v_branch, (SELECT id FROM public.branches WHERE is_main = TRUE LIMIT 1)),
            'CASH_OUT',
            'SALARY',
            NEW.amount,
            'ADVANCE-' || NEW.id::text,
            'কর্মচারীর অগ্রিম বেতন প্রদান',
            NEW.recorded_by
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_process_payroll()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_def_acc UUID;
    v_branch UUID;
BEGIN
    SELECT branch_id INTO v_branch FROM public.employees WHERE id = NEW.employee_id;
    SELECT id INTO v_def_acc FROM public.financial_accounts WHERE branch_id = v_branch AND is_default = TRUE LIMIT 1;
    IF v_def_acc IS NULL THEN
        SELECT id INTO v_def_acc FROM public.financial_accounts WHERE is_default = TRUE LIMIT 1;
    END IF;

    IF v_def_acc IS NOT NULL AND NEW.net_payable > 0 THEN
        PERFORM public.fn_post_cashbook(
            v_def_acc,
            COALESCE(v_branch, (SELECT id FROM public.branches WHERE is_main = TRUE LIMIT 1)),
            'CASH_OUT',
            'SALARY',
            NEW.net_payable,
            NEW.payroll_code,
            'মাসিক বেতন পরিশোধ (' || NEW.salary_month || ')',
            NEW.recorded_by
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_process_partner_drawing()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_main_branch UUID;
BEGIN
    SELECT id INTO v_main_branch FROM public.branches WHERE is_main = TRUE LIMIT 1;
    IF v_main_branch IS NOT NULL THEN
        PERFORM public.fn_post_cashbook(
            NEW.account_id,
            v_main_branch,
            'CASH_OUT',
            'PARTNER_DRAWING',
            NEW.amount,
            'DRAW-' || NEW.id::text,
            COALESCE(NEW.notes, 'মালিকের ব্যক্তিগত উত্তোলন'),
            NEW.recorded_by
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 8. Universal Audit Logger
CREATE OR REPLACE FUNCTION public.fn_universal_audit_logger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_old JSONB := NULL;
    v_new JSONB := NULL;
    v_record_id TEXT := '';
    v_actor_id UUID := auth.uid();
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
        v_record_id := OLD.id::TEXT;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_record_id := NEW.id::TEXT;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new := to_jsonb(NEW);
        v_record_id := NEW.id::TEXT;
    END IF;

    INSERT INTO public.audit_logs (
        actor_id,
        entity_name,
        action,
        record_id,
        old_values,
        new_values
    ) VALUES (
        v_actor_id,
        TG_TABLE_NAME,
        TG_OP,
        v_record_id,
        v_old,
        v_new
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach Audit Triggers to Key Financial Tables (Idempotent)
DROP TRIGGER IF EXISTS trg_audit_sales_invoices ON public.sales_invoices;
CREATE TRIGGER trg_audit_sales_invoices AFTER INSERT OR UPDATE OR DELETE ON public.sales_invoices FOR EACH ROW EXECUTE FUNCTION public.fn_universal_audit_logger();

DROP TRIGGER IF EXISTS trg_audit_purchases ON public.purchases;
CREATE TRIGGER trg_audit_purchases AFTER INSERT OR UPDATE OR DELETE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.fn_universal_audit_logger();

DROP TRIGGER IF EXISTS trg_audit_stock_adjustments ON public.stock_adjustments;
CREATE TRIGGER trg_audit_stock_adjustments AFTER INSERT OR UPDATE OR DELETE ON public.stock_adjustments FOR EACH ROW EXECUTE FUNCTION public.fn_universal_audit_logger();

DROP TRIGGER IF EXISTS trg_audit_expenses ON public.expenses;
CREATE TRIGGER trg_audit_expenses AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.fn_universal_audit_logger();

DROP TRIGGER IF EXISTS trg_audit_customers ON public.customers;
CREATE TRIGGER trg_audit_customers AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.fn_universal_audit_logger();

DROP TRIGGER IF EXISTS trg_audit_employees ON public.employees;
CREATE TRIGGER trg_audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.fn_universal_audit_logger();

-- Attach Business Triggers (Idempotent)
DROP TRIGGER IF EXISTS trg_process_purchase ON public.purchases;
CREATE TRIGGER trg_process_purchase AFTER INSERT ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.fn_process_purchase();

DROP TRIGGER IF EXISTS trg_process_purchase_item ON public.purchase_items;
CREATE TRIGGER trg_process_purchase_item AFTER INSERT ON public.purchase_items FOR EACH ROW EXECUTE FUNCTION public.fn_process_purchase_item();

DROP TRIGGER IF EXISTS trg_process_sales_invoice ON public.sales_invoices;
CREATE TRIGGER trg_process_sales_invoice AFTER INSERT ON public.sales_invoices FOR EACH ROW EXECUTE FUNCTION public.fn_process_sales_invoice();

DROP TRIGGER IF EXISTS trg_process_sales_item ON public.sales_items;
CREATE TRIGGER trg_process_sales_item AFTER INSERT ON public.sales_items FOR EACH ROW EXECUTE FUNCTION public.fn_process_sales_item();

DROP TRIGGER IF EXISTS trg_process_stock_adjustment ON public.stock_adjustments;
CREATE TRIGGER trg_process_stock_adjustment AFTER INSERT ON public.stock_adjustments FOR EACH ROW EXECUTE FUNCTION public.fn_process_stock_adjustment();

DROP TRIGGER IF EXISTS trg_process_due_collection ON public.customer_due_collections;
CREATE TRIGGER trg_process_due_collection AFTER INSERT ON public.customer_due_collections FOR EACH ROW EXECUTE FUNCTION public.fn_process_due_collection();

DROP TRIGGER IF EXISTS trg_process_supplier_payment ON public.supplier_payments;
CREATE TRIGGER trg_process_supplier_payment AFTER INSERT ON public.supplier_payments FOR EACH ROW EXECUTE FUNCTION public.fn_process_supplier_payment();

DROP TRIGGER IF EXISTS trg_process_expense ON public.expenses;
CREATE TRIGGER trg_process_expense AFTER INSERT ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.fn_process_expense();

DROP TRIGGER IF EXISTS trg_process_salary_advance ON public.salary_advances;
CREATE TRIGGER trg_process_salary_advance AFTER INSERT ON public.salary_advances FOR EACH ROW EXECUTE FUNCTION public.fn_process_salary_advance();

DROP TRIGGER IF EXISTS trg_process_payroll ON public.payroll_records;
CREATE TRIGGER trg_process_payroll AFTER INSERT ON public.payroll_records FOR EACH ROW EXECUTE FUNCTION public.fn_process_payroll();

DROP TRIGGER IF EXISTS trg_process_partner_drawing ON public.partner_drawings;
CREATE TRIGGER trg_process_partner_drawing AFTER INSERT ON public.partner_drawings FOR EACH ROW EXECUTE FUNCTION public.fn_process_partner_drawing();

