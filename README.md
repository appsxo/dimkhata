# DimKhata (ডিমখাতা) 🥚

**প্রতিষ্ঠান (Business):** শরিফ এন্ড ইমান এন্টারপ্রাইজ (Sharif & Eman Enterprise)  
**মালিকদ্বয় (Partners):** শরিফ (৬৬.৬৭% / ২ অংশ) এবং ইমান (৩৩.৩৩% / ১ অংশ)  
**ধরণ (System Type):** ডিমের পাইকারি ও খুচরা হিসাব, স্টক এবং পজ সফটওয়্যার (Cloud ERP & POS PWA)  
**লাইভ অ্যাপ (Live URL):** [https://appsxo.github.io/DimKhata/](https://appsxo.github.io/DimKhata/)  
**গিটহাব রিপোজিটরি:** [https://github.com/appsxo/DimKhata](https://github.com/appsxo/DimKhata)  
**টেক স্ট্যাক:** React 19 + TypeScript + Tailwind CSS v4 + Vite (PWA) + Supabase + GitHub Pages

---

## ১. সিস্টেমটি কীভাবে কাজ করে (How DimKhata Works)

**ডিমখাতা (DimKhata)** একটি সার্ভারলেস রিয়েল-টাইম বিজনেস অ্যাপ্লিকেশন। এতে কোনো পেইড ভিপিএস বা সার্ভারের প্রয়োজন নেই—ফ্রন্টএন্ড **GitHub Pages**-এ এবং ডাটাবেজ **Supabase Cloud**-এ হোস্ট করা।

### ক. মূল ইঞ্জিন ও আর্কিটেকচার (Core Architecture)
1. **রিয়েল-টাইম ক্লাউড সিঙ্ক (Supabase Source of Truth):**
   - সিস্টেমে কোনো ডামি বা লোকাল ডাটা নেই। সকল লেনদেন সরাসরি Supabase-এর `public.dimkhata_kv_store` টেবিলে সংরক্ষিত হয় এবং **Supabase Realtime WebSockets**-এর মাধ্যমে মোবাইল ও কম্পিউটারে সাথে সাথে সিঙ্ক হয়।
2. **দ্বিভাষিক ইন্টারফেস (বাংলা ও English):**
   - ডিফল্ট ভাষা **বাংলা (`বাংলা`)**। উপরের নেভবার থেকে ১-ক্লিকে **English (`EN`)** ভাষায় পরিবর্তন করা যায়।
3. **পিন লক ও রোল নিরাপত্তা (SHA-256 PIN Security):**
   - **মালিক মোড (Admin - শরিফ ও ইমান):** ৪-সংখ্যার SHA-256 পিন দ্বারা সুরক্ষিত (ডিফল্ট পিন: `1234`, সেটিংস থেকে পরিবর্তনযোগ্য)। মালিক মোডে ক্যাশ বুক, ব্যাংক ব্যালেন্স, কর্মচারীদের বেতন, মাসিক নিট লাভ-লোকসান ও ২:১ মুনাফা বণ্টন এবং অডিট লগ দেখা যায়।
   - **স্টাফ মোড (Staff):** শুধুমাত্র দৈনন্দিন কেনা-বেচা, আজকের বাজার দর, বকেয়া আদায়, ভাঙা ডিম ও দোকানের খরচ এন্ট্রি করতে পারে (লাভ-লোকসান ও ব্যাংক ব্যালেন্স গোপন থাকে)।
4. **ডিমের ৫টি নির্দিষ্ট ক্যাটাগরি ও একক রূপান্তর:**
   - **ক্যাটাগরি:** ১. লাল ডিম (ফার্মের), ২. প্যারাগন ডিম, ৩. হাঁসের ডিম, ৪. কোয়েল পাখির ডিম (৫০ পিসে খাঁচি), ৫. দেশি মুরগির ডিম।
   - **একক (Units):** পিস (`Pcs`), হালি (`৪ পিস`), খাঁচি (`Crate - ৩০/৫০ পিস`) এবং শ (`১০০ পিস`)-এ স্বয়ংক্রিয় স্টক প্রদর্শন।

---

### খ. দৈনন্দিন ব্যবসার ধাপসমূহ (Daily Business Workflow)

| ধাপ | মডিউল | কাজের বিবরণ |
| :--- | :--- | :--- |
| **১. বাজার দর** | **আজকের বাজার দর (`DailyPricingView`)** | প্রতিদিন সকালে ৫টি ডিমের কেনা দর, পাইকারি দর এবং খুচরা বিক্রয় দর সেট করা হয়। |
| **২. ডিম কেনা (WAC)** | **খামার থেকে ক্রয় (`SourcingPurchasesView`)** | খামারের দর + ট্রাক ভাড়া + লেবার খরচ যোগ করে স্বয়ংক্রিয়ভাবে প্রতি পিস ডিমের **প্রকৃত কেনা খরচ (Weighted Average Landed Cost - WAC)** বের হয় এবং গোডাউন স্টকে যুক্ত হয়। |
| **৩. বিক্রয় ও চালান** | **বিক্রয় মেমো ও POS (`SalesPosView`)** | পাইকারি বা খুচরা দরে খাঁচি/পিস হিসেবে দ্রুত মেমো তৈরি, কাস্টমারের বাকির সীমা (Credit Limit) সতর্কতা, **A4 / 80mm POS মেমো ও ডেলিভারি চালান প্রিন্ট** এবং ১-ক্লিকে **WhatsApp শেয়ার**। নগদ কাস্টমার (`Walk-in`) এবং নিবন্ধিত পাইকার (`SE-CUST-XXX`) উভয়ই সাপোর্ট করে। |
| **৪. বাকি ও কেওয়াইসি** | **কাস্টমার ও মহাজন (`PartiesKycView`)** | কাস্টমার (`SE-CUST`) ও খামারী/মহাজন (`SE-SUP`) নিবন্ধন, ক্লায়েন্ট-সাইড কম্প্রেসড (`<60 KB` WebP) NID/ছবি আপলোড, বকেয়া আদায়, মহাজন পেমেন্ট এবং WhatsApp তাগাদা মেসেজ। |
| **৫. লস ও ট্রান্সফার** | **ভাঙা, সৌজন্য ও স্থানান্তর (`WastageCourtesyView`)** | পরিবহনে ভাঙা/পচা ডিম এবং মেহমানদের সৌজন্য গিফট স্টক থেকে বিয়োগ হয়ে স্বয়ংক্রিয়ভাবে ল্যান্ডেড কস্টে লাভ-লোকসানে ক্ষতি হিসেবে যুক্ত হয়। এক গোডাউন থেকে অন্য গোডাউনে স্টক ট্রান্সফার করা যায়। |
| **৬. খরচ ও অ্যাসেট** | **দোকান ও গাড়ির খরচ (`ExpensesAssetsView`)** | স্থায়ী খরচ (ভাড়া, বিদ্যুৎ), চলতি খরচ (ভ্যান মেরামত, আপ্যায়ন) এবং স্থায়ী সম্পদ/অ্যাসেট (খাঁচি, ডিজিটাল স্কেল, ফার্নিচার) এন্ট্রি। |
| **৭. ক্যাশ ও ব্যাংক** | **ক্যাশ বুক ও ব্যাংক (`CashbookBankingView`)** | দোকানের ক্যাশ ড্রয়ার, ইসলামী ব্যাংক (IBBL), বিকাশ মার্চেন্ট ও নগদ একাউন্টের লাইভ ব্যালেন্স এবং কন্ট্রা ট্রান্সফার (ক্যাশ ⇄ ব্যাংক)। |
| **৮. বেতন ও এইচআর** | **কর্মচারী ও পে-রোল (`PayrollHrView`)** | কর্মচারী নিবন্ধন (`SE-EMP-XXX`), মাসের মাঝখানে অগ্রিম বেতন (Advance) প্রদান এবং মাস শেষে অগ্রিম কেটে নিট বেতন পরিশোধ ও প্রিন্টযোগ্য **বেতন রসিদ (Salary Slip)**। |
| **৯. ২:১ লভ্যাংশ বণ্টন** | **লাভ-লোকসান ও বণ্টন (`ProfitSettlementView`)** | `মোট বিক্রয় - ল্যান্ডেড কস্ট (COGS) - (দোকান খরচ + বেতন + ভাঙা/পচা লস + সৌজন্য খরচ) = নিট লাভ`। নিট লাভ স্বয়ংক্রিয়ভাবে **২:১ অনুপাতে শরিফ (৬৬.৬৭%) ও ইমান (৩৩.৩৩%)**-এর মধ্যে বণ্টন হয় এবং ব্যক্তিগত উত্তোলন (Drawings) সমন্বয় করে নিট পাওনা দেখায়। |

---

## ২. সেটআপ ও ডেপ্লয়মেন্ট গাইড (Setup & Deployment Guide)

### ধাপ ১: Supabase ডাটাবেজ সেটআপ (২ মিনিট)
আপনার Supabase প্রজেক্ট আইডি: `knxnmihaflwcavbyivnc`

1. আপনার প্রজেক্টের **SQL Editor**-এ যান:  
   👉 [https://supabase.com/dashboard/project/knxnmihaflwcavbyivnc/sql/new](https://supabase.com/dashboard/project/knxnmihaflwcavbyivnc/sql/new)
2. নিচের SQL কোডটি ([`supabase/schema.sql`](supabase/schema.sql)) পেস্ট করে **Run** বাটনে ক্লিক করুন:
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
3. আপনার Supabase **API Keys** পেজ থেকে কী কপি করুন:  
   👉 [https://supabase.com/dashboard/project/knxnmihaflwcavbyivnc/settings/api-keys](https://supabase.com/dashboard/project/knxnmihaflwcavbyivnc/settings/api-keys)
   - **Project URL:** `https://knxnmihaflwcavbyivnc.supabase.co`
   - **Publishable Key (`sb_publishable_...`)** অথবা **Anon Key (`eyJ...`)**

---

### ধাপ ২: GitHub Secrets যুক্ত করা (১ মিনিট)
1. আপনার গিটহাব রিপোজিটরির **Actions Secrets** পেজে যান:  
   👉 [https://github.com/appsxo/DimKhata/settings/secrets/actions](https://github.com/appsxo/DimKhata/settings/secrets/actions)
2. **New repository secret** বাটনে ক্লিক করে নিচের দুটি সিক্রেট যোগ করুন:

| Secret Name | Secret Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://knxnmihaflwcavbyivnc.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | আপনার Supabase Publishable Key (অথবা `VITE_SUPABASE_ANON_KEY`) |

---

### ধাপ ৩: GitHub Pages চালু করা (১ মিনিট)
1. গিটহাব রিপোজিটরির **Pages Settings**-এ যান:  
   👉 [https://github.com/appsxo/DimKhata/settings/pages](https://github.com/appsxo/DimKhata/settings/pages)
2. **Build and deployment → Source** ড্রপডাউন থেকে **GitHub Actions** সিলেক্ট করুন।
3. **Actions** ট্যাবে ([https://github.com/appsxo/DimKhata/actions](https://github.com/appsxo/DimKhata/actions)) গিয়ে **Deploy DimKhata to GitHub Pages** ওয়ার্কফ্লোটি **Run workflow** করুন (অথবা `main` ব্রাঞ্চে পুশ করলে স্বয়ংক্রিয়ভাবে ডিপ্লয় হবে)।
4. ডিপ্লয় সম্পন্ন হলে আপনার লাইভ অ্যাপ চলবে এখানে:  
   🌐 **[https://appsxo.github.io/DimKhata/](https://appsxo.github.io/DimKhata/)**

---

## ৩. লোকাল কম্পিউটারে রান করার নিয়ম (Local Development)

```bash
# ১. ডিপেন্ডেন্সি ইন্সটল করুন
npm install

# ২. লোকাল এনভায়রনমেন্ট ফাইল (.env.local) তৈরি করুন
cat << 'EOF' > .env.local
VITE_SUPABASE_URL=https://knxnmihaflwcavbyivnc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=আপনার_সোপবেস_কী_এখানে_দিন
EOF

# ৩. ডেভেলপমেন্ট সার্ভার চালু করুন
npm run dev

# ৪. প্রোডাকশন বিল্ড যাচাই করুন
npm run build
```

---

## ৪. ফোল্ডার স্ট্রাকচার (Project Structure)

```text
DimKhata/
├── .github/workflows/
│   ├── deploy-pages.yml          # GitHub Pages অটো-ডেপ্লয়মেন্ট ওয়ার্কফ্লো
│   └── nightly-backup.yml        # Supabase প্রজেক্ট সচল রাখার প্রাত্যহিক পিং
├── supabase/
│   └── schema.sql                # Supabase KV Store ও Realtime SQL স্ক্রিপ্ট
├── src/
│   ├── components/
│   │   ├── layout/               # Navbar (Global 44px + Sub-nav) ও Sidebar (Desktop + Mobile Bar)
│   │   ├── modals/               # PrintInvoiceModal, KycUploadModal, SecurityPinModal
│   │   └── ui/                   # AppleUI রিউজেবল কম্পোনেন্টসমূহ (DESIGN.md)
│   ├── features/                 # ১০টি মূল বিজনেস মডিউল (Dashboard, POS, Sourcing, P&L ইত্যাদি)
│   ├── lib/
│   │   ├── storage-store.ts      # কেন্দ্রীয় স্টোর, WAC ক্যালকুলেশন ও Supabase Realtime Sync
│   │   ├── egg-units.ts          # খাঁচি/শ/হালি/পিস একক রূপান্তর ও টাকা ফরম্যাটার
│   │   ├── i18n.ts               # বাংলা (ডিফল্ট) ও ইংরেজি ভাষা ইঞ্জিন
│   │   ├── security.ts           # SHA-256 পিন হ্যাশিং ও ইনপুট স্যানিটাইজার
│   │   ├── image-compressor.ts   # নেটিভ HTML5 Canvas WebP কম্প্রেশন (<60 KB)
│   │   ├── whatsapp-share.ts     # ১-ক্লিক WhatsApp মেমো ও বকেয়া তাগাদা শেয়ার
│   │   └── supabase.ts           # Supabase ক্লায়েন্ট ইনিশিয়ালাইজার
│   ├── types/index.ts            # সকল TypeScript ডাটা মডেল
│   ├── App.tsx                   # প্রধান রাউটিং ও রোল গার্ড
│   └── index.css                 # Apple Design System টোকেন ও প্রিন্ট স্টাইলশিট
└── DESIGN.md                     # ডিজাইন সিস্টেম ডকুমেন্টেশন
```
