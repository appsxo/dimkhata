# DimKhata (ডিমখাতা) Design System — Editorial Magazine & Atmospheric Orbs
Based on the ElevenLabs Editorial Design System Specification (`version: alpha`)

---

## 1. Executive Vision & Philosophy
**DimKhata ("শরিফ এন্ড ইমান এন্টারপ্রাইজ")** adopts an editorial print-magazine aesthetic rather than a typical loud or hyper-saturated SaaS dashboard. 
- **Base Canvas:** Off-white (`#f5f5f5`) holding warm near-black ink (`#292524` and `#0c0a09`).
- **Brand Voltage:** Photographic and atmospheric rather than chromatic. Soft pastel atmospheric gradient orbs (mint `#a7e5d3`, peach `#f4c5a8`, lavender `#c8b8e0`, sky `#a8c8e8`, rose `#e8b8c4`) drift as background blooms behind copy and metric cards.
- **No Saturated Button Colors:** Primary actions are exclusively warm near-black ink pills (`#292524` / `#0c0a09`). Secondary actions are transparent outline pills with a `#d6d3d1` hairline.
- **Display Typography at Weight 300:** Display headlines sit at weight 300 (EB Garamond / Waldenburg serif, `font-light`), never bolded. Body, navigation, numbers, and Bengali data typography run **Inter** and **Hind Siliguri** at weights 400 and 500 with loose, elegant tracking (+0.16px).
- **Pill & Soft Rectangle Shape Language:** Every CTA button and status badge is a full pill (`rounded-full` / `9999px`). Form inputs use 8px (`rounded-md`), feature cards use 16px (`rounded-xl`), and atmospheric cards use 24px (`rounded-2xl` / `xxl`).

---

## 2. Complete Design Tokens

### 2.1 Colors

| Category | Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Action** | `colors.primary` | `#292524` | Warm near-black ink pill for primary CTAs |
| **Primary Active** | `colors.primary-active` | `#0c0a09` | Hover/press state on primary pill |
| **Primary Text** | `colors.ink` | `#0c0a09` | Display headlines, strong titles, table values |
| **Body Running** | `colors.body` | `#4e4e4e` | Sub-titles, table text, running notes |
| **Body Emphasis** | `colors.body-strong` | `#292524` | Metric labels, prominent numbers |
| **Muted Text** | `colors.muted` | `#777169` | Helper descriptions, timestamps |
| **Muted Soft** | `colors.muted-soft` | `#a8a29e` | Placeholder text, disabled labels |
| **Canvas** | `colors.canvas` | `#f5f5f5` | Main page background floor |
| **Canvas Soft** | `colors.canvas-soft` | `#fafafa` | Alternating section backgrounds, card floors |
| **Canvas Deep** | `colors.canvas-deep` | `#0c0a09` | Dark mode hero exception & featured summaries |
| **Surface Card** | `colors.surface-card` | `#ffffff` | Pure white content cards |
| **Surface Strong** | `colors.surface-strong` | `#f0efed` | Badge backgrounds, circular icon plates |
| **Hairline** | `colors.hairline` | `#e7e5e4` | Standard 1px divider and card border |
| **Hairline Soft** | `colors.hairline-soft` | `#f0efed` | Subtle table row borders |
| **Hairline Strong** | `colors.hairline-strong` | `#d6d3d1` | Outline button borders, active inputs |
| **On Primary** | `colors.on-primary` | `#ffffff` | Pure white text on ink pills |
| **On Dark** | `colors.on-dark` | `#ffffff` | White text on dark hero cards |
| **On Dark Soft** | `colors.on-dark-soft` | `#a8a29e` | Soft gray on dark surfaces |
| **Gradient Mint** | `colors.gradient-mint` | `#a7e5d3` | Atmospheric radial orb (Mint) |
| **Gradient Peach** | `colors.gradient-peach` | `#f4c5a8` | Atmospheric radial orb (Peach) |
| **Gradient Lavender**| `colors.gradient-lavender`| `#c8b8e0` | Atmospheric radial orb (Lavender) |
| **Gradient Sky** | `colors.gradient-sky` | `#a8c8e8` | Atmospheric radial orb (Sky blue) |
| **Gradient Rose** | `colors.gradient-rose` | `#e8b8c4` | Atmospheric radial orb (Rose) |
| **Semantic Success**| `colors.semantic-success`| `#16a34a` | Due paid, confirmation badge |
| **Semantic Error** | `colors.semantic-error` | `#dc2626` | Over-credit alert, critical warning |

> [!IMPORTANT]
> **Strict Rule on Gradient Orbs:**  
> The 5 pastel gradient stops (`mint`, `peach`, `lavender`, `sky`, `rose`) appear ONLY as soft decorative radial blooms (`blur-3xl`, `opacity-40` to `opacity-60`) behind copy and card grids. They are **NEVER** used as button backgrounds or text colors.

---

### 2.2 Typography Scale

| Token | Family | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-mega` | EB Garamond / Serif | 64px | 300 | 1.05 | -1.92px | App hero h1 |
| `display-xl` | EB Garamond / Serif | 48px | 300 | 1.08 | -0.96px | Modal headlines |
| `display-lg` | EB Garamond / Serif | 36px | 300 | 1.17 | -0.36px | Section heads |
| `display-md` | EB Garamond / Serif | 32px | 300 | 1.13 | -0.32px | Card group titles |
| `display-sm` | EB Garamond / Serif | 24px | 300 | 1.20 | 0px | Metric summaries |
| `title-md` | Inter / Hind Siliguri | 20px | 500 | 1.35 | 0px | Component headers |
| `title-sm` | Inter / Hind Siliguri | 18px | 500 | 1.44 | +0.18px | Form section labels |
| `body-md` | Inter / Hind Siliguri | 16px | 400 | 1.50 | +0.16px | Default running text |
| `body-strong` | Inter / Hind Siliguri | 16px | 500 | 1.50 | +0.16px | Emphasized body text |
| `body-sm` | Inter / Hind Siliguri | 15px | 400 | 1.47 | +0.15px | Table body, secondary notes |
| `caption` | Inter / Hind Siliguri | 14px | 400 | 1.50 | 0px | Captions, small indicators |
| `caption-upper`| Inter | 12px | 600 | 1.40 | +0.96px | Uppercase category badges |
| `button` | Inter / Hind Siliguri | 15px | 500 | 1.00 | 0px | Pill buttons |
| `nav-link` | Inter / Hind Siliguri | 15px | 500 | 1.40 | 0px | Top-nav and sidebar items |

---

### 2.3 Shapes & Corner Radii

| Token | Class | Value | Usage |
| :--- | :--- | :--- | :--- |
| `rounded.pill` | `rounded-full` | `9999px` | Every CTA button (`button-primary`, `button-outline`), status pills, filter tabs |
| `rounded.full` | `rounded-full` | `9999px` | 32px circular icon plates, avatar discs |
| `rounded.xxl` | `rounded-2xl` | `24px` | Atmospheric gradient-orb cards, banner cards |
| `rounded.xl` | `rounded-xl` | `16px` | Standard feature cards, pricing tiers, tables |
| `rounded.lg` | `rounded-lg` | `12px` | Compact cards, dropdown menus |
| `rounded.md` | `rounded-md` | `8px` | Text inputs, select dropdowns |
| `rounded.sm` | `rounded-sm` | `6px` | Inline code badges, tags |

---

### 2.4 Elevation & Depth
- **Canvas:** `#f5f5f5` flat plane.
- **Card:** `#ffffff` surface with `1px solid #e7e5e4` hairline border.
- **Soft Drop Shadow:** `box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04)` on hover.
- **Atmospheric Depth:** Radial blur pastel blooms (`bg-gradient-to-tr from-[#a7e5d3] via-[#f4c5a8] to-[#c8b8e0] blur-3xl opacity-50`).

---

## 3. Component Specification & Styling Matrix

### 3.1 Buttons
- **`button-primary`:**  
  `bg-[#292524] text-white hover:bg-[#0c0a09] active:bg-[#0c0a09] rounded-full px-5 py-2.5 text-[15px] font-medium h-[40px] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)]`
- **`button-outline`:**  
  `bg-transparent text-[#0c0a09] border border-[#d6d3d1] hover:border-[#0c0a09] hover:bg-[#f0efed] rounded-full px-5 py-2 text-[15px] font-medium h-[40px] transition-all`
- **`button-tertiary-text`:**  
  `text-[#0c0a09] hover:text-[#292524] underline-offset-4 hover:underline text-[15px] font-medium`

### 3.2 Form Inputs (`text-input`)
- `bg-white text-[#0c0a09] border border-[#d6d3d1] focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] rounded-md px-3.5 py-2 text-[15px] h-[44px] transition-all placeholder:text-[#a8a29e]`

### 3.3 Badges (`badge-pill`)
- `bg-[#f0efed] text-[#0c0a09] border border-[#e7e5e4] rounded-full px-3 py-1 text-[12px] font-semibold tracking-wider uppercase inline-flex items-center gap-1.5`

### 3.4 Cards & Surfaces (`feature-card`)
- `bg-white border border-[#e7e5e4] rounded-xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_6px_24px_rgba(0,0,0,0.05)]`

### 3.5 Top Navigation (`top-nav`)
- `bg-[#f5f5f5]/90 backdrop-blur-md border-b border-[#e7e5e4] text-[#0c0a09] h-[64px] sticky top-0 z-40 px-6 flex items-center justify-between`

---

## 4. Do's and Don'ts

### ✅ DO:
1. Use `#292524` (warm near-black ink pill) for primary actions.
2. Render display headlines in EB Garamond / Serif at `font-light` (weight 300) with `-0.36px` to `-1.92px` tracking.
3. Keep the canvas clean off-white (`#f5f5f5`) with crisp hairline borders (`#e7e5e4`).
4. Place pastel atmospheric gradient orbs softly in the background for visual depth.
5. Use `rounded-full` (9999px) for every button, badge, and tab pill.

### ❌ DON'T:
1. Do not use bright orange, saturated yellow, neon cyan, or amber button fills.
2. Do not bold display headlines (keep weight 300).
3. Do not use gradient orbs as text colors, button backgrounds, or solid card fills.
4. Do not use sharp 0px corners on CTAs.
5. Do not turn the entire app into a dark developer-tools theme.
