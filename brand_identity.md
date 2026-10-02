---
name: Modern Financial Clarity
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3e4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#ba0035'
  on-secondary: '#ffffff'
  secondary-container: '#e21e49'
  on-secondary-container: '#fffbff'
  tertiary: '#005683'
  on-tertiary: '#ffffff'
  tertiary-container: '#006fa8'
  on-tertiary-container: '#dbecff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#ffdada'
  secondary-fixed-dim: '#ffb3b6'
  on-secondary-fixed: '#40000c'
  on-secondary-fixed-variant: '#920028'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  currency-stat:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an atmosphere of effortless control, financial transparency, and mindful wealth management. Tailored for discerning professionals, modern independents, and digitally native households, the UI discards the stressful, spreadsheet-heavy clutter of traditional banking tools in favor of an airy, serene, and decisive architectural environment.

The core aesthetic combines **Refined Minimalism** with functional data precision. The design balances broad, breathing canvases of cool-tinted off-white against crisp structural elements: delicate 1px borders, subtle low-opacity surface depth, and focused color accents. Financial metrics feel tangible yet weightless. Visual hierarchy is established strictly through restrained typographic cadence and deliberate semantic accents—emerald for growth, coral for outflow—turning daily budgeting into an organized, calming ritual.

## Colors

The palette is engineered around high-clarity daylight values, prioritizing focus, legibility, and immediate semantic orientation.

- **Base & Canvas:** Pure whites (`#FFFFFF`) anchor primary interactive surfaces and analytical cards, elevated against a soft, cool neutral-slate backdrop (`#F8FAFC` to `#F1F5F9`).
- **Typography & Structure:** Primary copy is rendered in deep charcoal slate (`#0F172A`), providing authoritative contrast without the stark harshness of pure black. Secondary copy uses mid-slate (`#64748B`), with structural dividing lines calibrated at an ultra-subtle border tint (`#E2E8F0`).
- **Semantic Accents:** 
  - **Inflows & Growth:** A vibrant emerald-mint green (`#0F766E` primary, paired with soft tinted container `#ECFDF5`) designates positive cash flow, savings targets, and net worth gains.
  - **Outflows & Obligations:** A warm, refined rose-coral (`#E11D48`, paired with container `#FFF1F2`) indicates expenditures, bill debts, and threshold warnings.
  - **Investments & Balance:** A deep sky-cerulean (`#0284C7`, paired with container `#F0F9FF`) anchors transfers and investment allocations.
- **Category Badge Pastels:** Subdued, low-saturation pastel tints (soft lavender `#F3E8FF`, dusty amber `#FEF3C7`, pale sage `#F0FDF4`, and powder blue `#E0F2FE`) provide discrete metadata tagging without creating visual noise.

## Typography

The design system utilizes **Plus Jakarta Sans** across all textual roles. Its modern geometric curves introduce a friendly, approachable humanism, while its tall x-height and clean counters ensure instant readability for complex numerical tables and dense financial reports.

- **Numerics & Tabular Data:** All financial amounts, transaction histories, and currency stats should apply tabular figures (`font-variant-numeric: tabular-nums`) to preserve vertical alignment across ledgers and summary widgets.
- **Scale Continuity:** Large display numbers use tighter negative tracking (`-0.03em`) to anchor dashboards with authoritative clarity. Micro-labels and status badges shift to medium/semibold weights with slightly opened tracking (`+0.02em` to `+0.04em`) to guarantee legibility at small scale.
- **Hierarchy:** Reserve `display-lg` and `currency-stat` for aggregate balances (e.g., total net worth, monthly balance). Category titles and table headers lean strictly on `headline-sm` and `label-md`.

## Layout & Spacing

The layout operates on an 8pt architectural rhythm, utilizing an adaptable fluid grid tailored to multi-tiered dashboards and granular ledgers.

- **Desktop (1024px+):** A 12-column layout governed by `2.5rem` section margins and `1.5rem` gutters. Metric overview cards span 3 or 4 columns; primary transaction feeds and analytical charts span 8 columns, leaving 4 columns for budgets and target breakdowns.
- **Tablet (768px – 1023px):** An 8-column layout with `1.5rem` gutters and margins. Side panels fold into structured stacked tabs or bottom off-canvas drawers.
- **Mobile (<768px):** A 4-column layout with `1rem` outer canvas padding (`margin-sm`). Cards collapse to a unified full-width single column.
- **Rhythm & Whitespace:** Whitespace acts as an active grouping mechanism. Deep padding within data cards (`space-lg` to `space-xl`) prevents financial cognitive fatigue, ensuring numbers feel clean, digestible, and isolated from peripheral distraction.

## Elevation & Depth

Visual hierarchy rejects heavy skeuomorphism and muddy drop shadows, relying instead on **low-contrast outlines, translucent backdrops, and ambient light filtration**.

- **Surfaces & Borders:** Primary cards live on flat white surfaces (`#FFFFFF`) bound by crisp, 1px hairline micro-borders in soft cool gray (`#E2E8F0`). Borders maintain clean separation against the `#F8FAFC` foundation without visually boxing the user in.
- **Ambient Shadow System:**
  - *Base Surface (Cards, Modules):* `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
  - *Interactive Hover:* Elevation gently lifts via `0 6px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -2px rgba(15, 23, 42, 0.03)`.
  - *Floating Modals & Dropdowns:* `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)`.
- **Glass Overlays:** Sticky navigation bars and floating balance summaries utilize a glassmorphic frost: `backdrop-filter: blur(12px)` over an 85% opacity white canvas (`rgba(255, 255, 255, 0.85)`), bordered with `#E2E8F0` at the bottom edge.

## Shapes

The design system embraces a **Rounded (Level 2)** shape identity, projecting an approachable, modern, and high-trust demeanor.

- **Base Radii:** Standard inputs, buttons, chips, and small alert cards utilize `0.5rem` (8px).
- **Cards & Data Modules:** Content cards, chart panels, and summary widgets use `1rem` (16px), harmonizing nicely with the hairline micro-borders.
- **Sheet Drawers & Modals:** Large dialog windows employ `1.5rem` (24px) for a soft structural presence.
- **Pills & Tags:** Category badges, transactional chips, and user status indicators use fully rounded caps (`9999px`) to immediately distinguish contextual tags from actionable buttons.

## Components

### Buttons
- **Primary:** Solid slate charcoal (`#0F172A`) with pure white text. High contrast, understated authority. Rounded `0.5rem`, padding `0.625rem 1.25rem`. Active state applies `scale(0.99)`.
- **Secondary / Neutral:** Pure white background, 1px `#E2E8F0` border, `#0F172A` text. Hover shifts to `#F8FAFC`.
- **Semantic / Action:** Used for quick add actions. Soft emerald tint (`#ECFDF5`) background with `#0F766E` label for positive entries; soft rose tint (`#FFF1F2`) with `#E11D48` label for deductions.

### Category Chips & Badges
- Built with a full pill radius (`9999px`) and micro-typography (`label-sm`).
- Low-saturation pastel containers: Dining (Rose `#FFE4E6` / `#9F1239`), Housing (Blue `#E0F2FE` / `#0369A1`), Salary (Mint `#D1FAE5` / `#065F46`), Leisure (Purple `#F3E8FF` / `#6B21A8`). Badges avoid intense solid saturation to maintain canvas calm.

### Data Visualization Cards
- Pure white container with `1rem` border radius, encased in a 1px `#E2E8F0` micro-border.
- Interior layout separates standard metric labels (`label-md`, `#64748B`) from the aggregate value (`currency-stat`, `#0F172A`) by `space-sm`.
- Micro trend badges (+4.2%, -1.8%) sit alongside amounts using soft green or warm coral pills with embedded directional micro-arrows.

### Transaction Lists
- Row items use clean borders (`border-b: 1px solid #F1F5F9`) with no alternating zebra stripes.
- Left-aligned icon wrapper uses a `0.5rem` radius with subtle categorical pastel fill.
- Merchant/Source title in `body-md` (`font-weight: 600`), category beneath in `body-sm` (`#64748B`).
- Right-aligned monetary values are strictly aligned with tabular numbers: positive values prefixed with `+` in emerald (`#0F766E`), expenses in rich charcoal (`#0F172A`) or soft coral (`#E11D48`).

### Input Fields
- Flat white surface with 1px `#CBD5E1` border, transitioning to a crisp 1px `#0F766E` focus border with an ambient emerald glow ring (`0 0 0 3px rgba(15, 118, 110, 0.1)`).
- Prefix currency glyphs (e.g., "$") sit embedded in muted slate (`#94A3B8`) to facilitate frictionless number logging.

### Checkboxes & Segmented Controls
- Checkboxes: 18px rounded squares (`0.25rem` radius) with 1.5px borders. Checked state fills with `#0F766E` displaying a crisp white micro-checkmark.
- Segmented Period Selectors (e.g., Weekly, Monthly, Yearly): An enclosed track in `#F1F5F9` holding pill or `0.375rem` tab items. The active selection transitions using a crisp white raised card with standard elevation.