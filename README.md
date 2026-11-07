# DimKhata — Cloud ERP & POS for Wholesale/Retail Egg Business

**Business Name:** Sharif & Eman Enterprise (`শরিফ এন্ড ইমান এন্টারপ্রাইজ`)  
**Partners & Profit Ratio:** Sharif (`শরিফ` — 66.67% / 2 Shares) & Eman (`ইমান` — 33.33% / 1 Share)  
**Live Application:** [https://appsxo.github.io/DimKhata/](https://appsxo.github.io/DimKhata/)  
**Repository:** [https://github.com/appsxo/DimKhata](https://github.com/appsxo/DimKhata)  
**Tech Stack:** React 19 + TypeScript + Tailwind CSS v4 + Vite (PWA) + Supabase + GitHub Pages

---

## 1. How the System Works

**DimKhata** is a serverless, real-time ERP and POS Progressive Web Application (PWA). It requires no VPS or backend server—the frontend is hosted on **GitHub Pages** and all application state is persisted and synchronized in real time via **Supabase**.

### A. Core Architecture
1. **Supabase Real-Time Cloud Sync (Single Source of Truth):**
   - Zero local dummy data. All records are stored in `public.dimkhata_kv_store` on Supabase and synchronized across all connected mobile and desktop devices in real time via **Supabase Realtime WebSockets**.
2. **Bilingual Interface (`বাংলা` Default + `EN` Toggle):**
   - Defaults to Bangla (`বাংলা`) for daily shop floor operation and switches to English (`EN`) with a single click in the top navigation bar.
3. **Zero-Trust URL Auth Gate & SHA-256 Secret Protection:**
   - **No URL Data Leakage:** Anyone visiting the application URL (`https://appsxo.github.io/DimKhata/`) is immediately stopped at the secure authentication gate. All internal data, tables, financial statements, and customer ledgers remain strictly unmounted until an authenticated user unlocks the session with their secret PIN.
   - **Independent User Identities & Default Secrets:**
     - **Sharif (`শরিফ (মালিক)`)** — Co-Owner / Admin (Default PIN: `1234`)
     - **Eman (`ইমান (মালিক)`)** — Co-Owner / Admin (Default PIN: `1234`)
     - **Staff Cashier (`স্টাফ / ক্যাশিয়ার`)** — Cashier / Staff (Default PIN: `0000`)
   - **Independent Audit Attribution:** Every cashbook entry, sales memo, stock adjustment, and system log explicitly attributes `actor_name` and `actor_role` to the individual logged-in user rather than a generic or hardcoded account.
   - **1-Tap Session Locking & Logout:** A prominent Lock button in both top header and side menu immediately purges the session from browser storage and returns to the Auth Gate.
   - **Customizable PINs:** Admins can change their secret PIN or reset staff PINs at any time from the Security Modal, with SHA-256 hashes instantly synced to Supabase `dimkhata_kv_store`.
4. **Product Categories & Egg Unit Conversion Engine:**
   - **5 Egg Categories:**
     1. Brown Farm Layer Egg (`লাল ডিম (ফার্মের)`) — 30 pcs/crate
     2. Paragon Branded Egg (`প্যারাগন ডিম`) — 30 pcs/crate
     3. Duck Egg (`হাঁসের ডিম`) — 30 pcs/crate
     4. Quail Egg (`কোয়েল পাখির ডিম`) — 50 pcs/crate
     5. Indigenous Deshi Hen Egg (`দেশি মুরগির ডিম`) — 30 pcs/crate
   - **Automatic Unit Breakdowns:** Converts piece quantities into **Crates** (30 or 50 pcs), **Hundreds / Sho** (100 pcs), **Hali** (4 pcs), and **Pieces** (`Pcs`).

---

### B. Daily Business Workflow

| Step | Module | Description |
| :--- | :--- | :--- |
| **1. Daily Rates** | `DailyPricingView` | Set daily buying, wholesale, and retail rates per piece/crate for all 5 egg categories. |
| **2. Sourcing & WAC** | `SourcingPurchasesView` | Record farm/supplier egg purchases (`SE-PUR-YYYY-XXXX`). Automatically adds truck fare, loading labor, and tolls to compute the true **Weighted Average Landed Cost (WAC)** per egg and updates live branch stock. |
| **3. Sales POS & Challan** | `SalesPosView` | Create Wholesale or Retail sales memos (`SE-INV-YYYY-XXXX`) by Crate or Piece for Walk-in Cash Customers or registered wholesale customers (`SE-CUST-XXX`). Enforces credit limit warnings, prints **A4 / 80mm POS Receipts & Delivery Challans** (`SE-CHL-YYYY-XXXX`), and shares invoices via **WhatsApp**. |
| **4. Parties & KYC** | `PartiesKycView` | Manage Customers (`SE-CUST-XXX`) and Farm Suppliers (`SE-SUP-XXX`), upload client-side compressed (`<60 KB` WebP) NID/KYC documents, collect customer dues, pay suppliers, and send WhatsApp due reminders. |
| **5. Wastage & Transfer** | `WastageCourtesyView` | Deduct broken/rotten eggs and courtesy gifts from inventory at current WAC landed cost (automatically expensed in Monthly P&L), or transfer stock between branches/godowns. |
| **6. Expenses & Assets** | `ExpensesAssetsView` | Record fixed expenses (rent, utilities), variable expenses (transport, maintenance), and capital assets (crates, digital scales, furniture). Only operating expenses are deducted from monthly profit; capital assets are tracked separately. |
| **7. Cashbook & Banking** | `CashbookBankingView` | Live balance tracking across Main Cash Drawer, Islami Bank Bangladesh (`IBBL`), bKash Merchant, and Nagad, including Contra Transfers (Cash ⇄ Bank/MFS). |
| **8. HR & Payroll** | `PayrollHrView` | Register staff (`SE-EMP-XXX`), record mid-month salary advances, process month-end net payroll (`Base Salary + Bonus - Advances`), and print salary slips (`SE-PAY-YYYY-XXXX`). |
| **9. P&L & 2:1 Split** | `ProfitSettlementView` | Automatically calculates `Net Profit = Gross Sales - Landed COGS - (Operating Expenses + Salaries + Wastage Loss + Courtesy Cost)` and splits net profit **2:1** between **Sharif (66.67%)** and **Eman (33.33%)**, deducting personal drawings to show net payable balance. |

---

## 2. Setup & Deployment Guide (GitHub Pages + Supabase)

### Step 1: Set Up Supabase Database (2 Minutes)
Your Supabase Project ID: `knxnmihaflwcavbyivnc`

1. Open your Supabase **SQL Editor**:  
   [https://supabase.com/dashboard/project/knxnmihaflwcavbyivnc/sql/new](https://supabase.com/dashboard/project/knxnmihaflwcavbyivnc/sql/new)
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**:
   ```sql
   CREATE TABLE IF NOT EXISTS public.dimkhata_kv_store (
       key TEXT PRIMARY KEY,
       value JSONB NOT NULL,
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   ALTER TABLE public.dimkhata_kv_store ENABLE ROW LEVEL SECURITY;

   DROP POLICY IF EXISTS "Allow publishable key sync on dimkhata_kv_store" ON public.dimkhata_kv_store;
   CREATE POLICY "Allow publishable key sync on dimkhata_kv_store"
       ON public.dimkhata_kv_store
       FOR ALL
       TO anon, authenticated
       USING (true)
       WITH CHECK (true);

   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND tablename = 'dimkhata_kv_store'
     ) THEN
       ALTER PUBLICATION supabase_realtime ADD TABLE public.dimkhata_kv_store;
     END IF;
   END $$;
   ```
3. Copy your API credentials from **Project Settings → API Keys**:  
   [https://supabase.com/dashboard/project/knxnmihaflwcavbyivnc/settings/api-keys](https://supabase.com/dashboard/project/knxnmihaflwcavbyivnc/settings/api-keys)
   - **Project URL:** `https://knxnmihaflwcavbyivnc.supabase.co`
   - **Publishable Key:** `sb_publishable_...` *(or Legacy `anon` `public` key)*

---

### Step 2: Configure GitHub Actions Secrets (1 Minute)
1. Open your repository's **Actions Secrets** settings:  
   [https://github.com/appsxo/DimKhata/settings/secrets/actions](https://github.com/appsxo/DimKhata/settings/secrets/actions)
2. Click **New repository secret** and add:

| Secret Name | Secret Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://knxnmihaflwcavbyivnc.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Publishable Key (or `VITE_SUPABASE_ANON_KEY`) |

---

### Step 3: Enable GitHub Pages (1 Minute)
1. Go to **Settings → Pages**:  
   [https://github.com/appsxo/DimKhata/settings/pages](https://github.com/appsxo/DimKhata/settings/pages)
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Go to the **Actions** tab ([https://github.com/appsxo/DimKhata/actions](https://github.com/appsxo/DimKhata/actions)), select **Deploy DimKhata to GitHub Pages**, and click **Run workflow** (or push any commit to `main`).
4. Once completed (~45 seconds), your application will be live at:  
   **[https://appsxo.github.io/DimKhata/](https://appsxo.github.io/DimKhata/)**

---

## 3. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create local environment file (.env.local)
cat << 'EOF' > .env.local
VITE_SUPABASE_URL=https://knxnmihaflwcavbyivnc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
EOF

# 3. Start local development server
npm run dev

# 4. Run type-check and production build
npm run build
```

---

## 4. Project Structure

```text
DimKhata/
├── .github/workflows/
│   ├── deploy-pages.yml          # Automated GitHub Pages build & deployment
│   └── nightly-backup.yml        # Daily Supabase keep-alive ping
├── supabase/
│   └── schema.sql                # Supabase KV Store table, RLS & Realtime setup
├── src/
│   ├── components/
│   │   ├── layout/               # Navbar (Global 44px + Sub-nav) & Sidebar (Desktop + Mobile Bar)
│   │   ├── modals/               # PrintInvoiceModal, KycUploadModal, SecurityPinModal
│   │   └── ui/                   # Reusable Apple Design System UI primitives (DESIGN.md)
│   ├── features/                 # 10 core ERP feature views (Dashboard, POS, Sourcing, P&L, etc.)
│   ├── lib/
│   │   ├── storage-store.ts      # Central store, WAC engine & Supabase Realtime sync
│   │   ├── egg-units.ts          # Crate/Sho/Hali/Pcs converters & currency formatters
│   │   ├── i18n.ts               # Bilingual state engine (Bangla default + English toggle)
│   │   ├── security.ts           # SHA-256 PIN hashing & input sanitization
│   │   ├── image-compressor.ts   # Native HTML5 Canvas WebP compressor (<60 KB)
│   │   ├── whatsapp-share.ts     # 1-Click WhatsApp invoice & due reminder generator
│   │   └── supabase.ts           # Supabase client initializer
│   ├── types/index.ts            # TypeScript data models
│   ├── App.tsx                   # Root layout, routing & role access guard
│   └── index.css                 # Apple Design System tokens & print media rules
└── DESIGN.md                     # Design system specification
```
