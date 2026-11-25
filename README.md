# mngmt — Personal Finance and Business Management System

A local-first, privacy-focused financial management platform and inventory tracking system built with Next.js, React, TypeScript, and Tailwind CSS.

---

## Overview

**mngmt** is an open-source management platform that connects personal wealth tracking with small business operations. Instead of maintaining fragmented spreadsheets, separate budgeting apps, and disconnected inventory lists, **mngmt** provides a single interface to monitor cash balances, daily transactions, product stock, multichannel sales, and standard financial statements.

The application operates with an offline-first architecture powered by browser storage (IndexedDB with LocalStorage fallback). Your financial records, customer details, and inventory data remain on your local device without requiring an external database connection to get started.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Executive Dashboard](#executive-dashboard)
  - [Personal Finance](#personal-finance)
  - [Business and Inventory Operations](#business-and-inventory-operations)
  - [Financial Reports and Accounting](#financial-reports-and-accounting)
  - [Asset Tracking](#asset-tracking)
  - [Data Portability and Backups](#data-portability-and-backups)
  - [Progressive Web App (PWA)](#progressive-web-app-pwa)
- [Technology Stack](#technology-stack)
- [System Architecture and Data Flow](#system-architecture-and-data-flow)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Development Server](#running-the-development-server)
  - [Building for Production](#building-for-production)
- [Data Privacy and Security](#data-privacy-and-security)
- [Available Scripts](#available-scripts)
- [License](#license)

---

## Key Features

### Executive Dashboard
- **Consolidated Financial Summary:** View total cash balance across all liquid accounts, net personal cash flow, gross business revenue, and net profit in real time.
- **Period Filtering:** Switch views between monthly periods, annual overviews, or all-time history with a single click.
- **Cash Flow Analytics:** Compare total income against total expenses over time using interactive bar and line charts powered by Recharts.
- **Capital and Category Distribution:** Inspect donut charts illustrating how your funds are distributed across personal accounts, business categories, and inventory capital.
- **Stock Health Indicators:** Receive instant alerts for items that fall below safety stock thresholds to prevent stockouts.
- **Recent Activity Ledger:** Monitor recent income, expenditures, transfers, and completed customer orders from a unified timeline.

### Personal Finance
- **Multi-Account Tracking:** Manage physical cash, bank accounts, digital e-wallets, and marketplace balances with individual balance histories.
- **Transaction Registry:** Record income, expenses, and inter-account transfers with custom categories, dates, and optional notes.
- **Monthly Budget Allocations:** Set spending limits per expense category. Visual progress bars highlight remaining budget and identify overspending.
- **Wishlist Planner:** Organize planned future purchases categorized by priority levels (high, medium, low) with estimated costs, target dates, and purchase status.
- **Recurring Subscriptions:** Log monthly, annual, or weekly subscriptions. View upcoming billing dates, cost summaries, and active statuses to avoid forgotten renewals.

### Business and Inventory Operations
- **Product Catalog Management:** Maintain a complete catalog with SKUs, product names, categories, supplier info, unit purchase costs, and retail selling prices.
- **Inventory Movement Audit:** Track every stock change with detailed movement logs, including purchase orders, sales deductions, manual stock adjustments, damaged items, and returns.
- **Multichannel Sales Recording:** Record customer orders across multiple sales channels such as Shopee, TikTok Shop, Tokopedia, and Direct offline sales.
- **Fee and Profit Deduction Engine:** Calculate exact profitability per order by factoring in marketplace commission fees, shipping subsidies, packing costs, and Cost of Goods Sold (COGS).
- **Stock Status Segregation:** Automatically separates available stock on hand from reserved stock and total units sold.

### Financial Reports and Accounting
- **General Ledger:** An auditable, double-entry style transaction log recording every inflow, outflow, and transfer across personal and business scopes.
- **Cash Flow Statement:** Review cash movements divided into Operating, Investing, and Financing activities to evaluate real liquidity.
- **Profit and Loss (P&L):** Inspect business gross margins, operating expenses, channel fees, and net profit margins across any selected timeframe.
- **Balance Sheet:** Instant breakdown of total Assets (cash, receivables, inventory capital, physical assets) versus Liabilities and Owner's Equity.
- **Multichannel Sales Performance:** Compare sales volume, gross revenue, fees paid, and net margin side-by-side across all sales channels.

### Asset Tracking
- **Physical and Digital Asset Valuation:** Log valuable equipment, vehicles, electronics, and collections.
- **Condition Grading:** Classify items by condition (mint, good, fair, needs repair) to plan maintenance or liquidation.
- **Cost vs. Market Valuation:** Compare original purchase prices with current estimated market values to monitor appreciation or depreciation.
- **Asset Status Lifecycle:** Flag assets as actively owned, listed for sale, archived, or sold.

### Data Portability and Backups
- **One-Click Full Database Backup:** Export your entire database into a single, clean JSON file containing all accounts, products, sales, and transaction logs.
- **Instant Restore:** Restore your data at any time from a previously exported JSON backup file with automatic schema validation.
- **Spreadsheet Integration (CSV & Excel):** Export sales reports, inventory lists, and ledger data to standard CSV files or formatted Microsoft Excel XML documents.
- **CSV Data Import:** Bulk import external transactions and products into the system using browser-native parsers.
- **Print Optimization:** Formatted print styles allow you to generate clean physical or PDF copies of financial statements and sales summaries.

### Progressive Web App (PWA)
- **Installable Desktop and Mobile App:** Install the application directly through Chrome, Edge, Safari, or mobile browsers as a standalone desktop or mobile application.
- **Offline Functionality:** Built-in Service Worker caches core static application assets, enabling full functionality even without an active internet connection.
- **Responsive Interface:** Adaptive sidebar navigation on desktop collapses into a mobile slide-out drawer with touch-friendly controls.
- **Dark and Light Mode:** Built-in theme switcher allows you to work comfortably in both high-contrast dark mode and clean light mode.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | React framework for routing, layout structuring, and optimized production builds |
| **Library** | React 19 | UI component rendering with functional components and modern hooks |
| **Language** | TypeScript 5 | Strict static typing for data consistency and reliable financial logic |
| **Styling** | Tailwind CSS v4 | Utility-first styling with custom design tokens and fluid typography |
| **Component Primitives** | Base UI / shadcn/ui | Accessible, unstyled UI primitives tailored for SaaS applications |
| **Icons** | Lucide React | Clean, consistent icons across all navigation, badges, and action buttons |
| **Data Visualization** | Recharts | Composable charting library for cash flow trends and distribution breakdowns |
| **Form Handling** | React Hook Form | High-performance, lightweight form management with minimal re-renders |
| **Validation** | Zod | Runtime schema validation for data models, imports, and forms |
| **Date Utilities** | date-fns | Lightweight, reliable date parsing, formatting, and arithmetic |
| **Storage Engine** | IndexedDB + LocalStorage | Local-first browser persistence layer with automatic migration and debounced writes |
| **PWA Engine** | Service Worker + Web Manifest | Standalone installation support and offline caching |

---

## System Architecture and Data Flow

1. **Local-First Persistence Model:**
   - On initial launch, the application loads existing state from **IndexedDB**. If IndexedDB is unavailable, it gracefully falls back to **LocalStorage**.
   - If no existing user data is found, the system seeds a realistic demo dataset to provide an immediate walkthrough of all features.
   - Any state update (new sale, stock change, transaction) automatically triggers a debounced write (250ms) to IndexedDB, ensuring zero performance drops during fast typing.

2. **Automated Cross-Module Synchronization:**
   - Recording a new business sale automatically reduces available inventory stock for each sold item.
   - The same sale generates a corresponding business income entry inside the selected deposit account and creates an entry in the General Ledger.
   - Deleting a transaction automatically restores the previous balance of associated accounts.
   - Marking a subscription as paid advances its next billing date and logs an expense transaction without manual double-entry.

3. **Client-Side Data Integrity:**
   - Calculations for COGS, Gross Profit, Net Profit, Net Worth, and Available Stock are calculated through pure TypeScript utility functions located in `src/lib/calculations.ts`.
   - Data exports and imports are parsed purely in-browser via `src/lib/data-exchange.ts`, eliminating the need to transmit private financial figures across external servers.

---

## Project Directory Structure

```text
mymoney/
├── public/
│   ├── icons/                 # PWA application icons (192px, 512px, maskable, SVG)
│   ├── sw.js                  # Service Worker script for offline caching
│   └── manifest.webmanifest   # Web App Manifest definition
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Main executive dashboard
│   │   ├── layout.tsx         # Root layout with theme, store, and PWA providers
│   │   ├── manifest.ts        # Web App Manifest definition
│   │   ├── finance/           # Personal finance (pockets, transactions, budgets, subs, goals, wishlist)
│   │   ├── collection/        # Personal collectibles & asset valuation
│   │   ├── seller/            # Seller center (products, stock audit, sales orders, suppliers)
│   │   ├── ledger/            # Accounting center (general ledger, cash flow, P&L, balance sheet, debts)
│   │   ├── reports/           # Data exchange (CSV/Excel export/import with mapper, channel reports)
│   │   └── settings/          # Categories & sub-categories, fee presets, PIN lock, backup & reset
│   ├── components/            # Reusable UI and domain components
│   │   ├── assets/            # Asset cards and asset creation dialogs
│   │   ├── business/          # Product tables, sales forms, stock adjustment modals
│   │   ├── dashboard/         # KPI cards, Recharts analytics, distribution graphs
│   │   ├── finance/           # Ledger, cash flow, P&L, and balance sheet tabs
│   │   ├── layout/            # App shell, responsive header, sidebar navigation
│   │   ├── personal/          # Account management, budget bars, subscription cards
│   │   ├── pwa/               # PWA install prompt banner and offline state handlers
│   │   ├── quick-actions/     # Unified modal forms for rapid transaction entry
│   │   ├── reports/           # Import and export interface cards
│   │   ├── shared/            # Common UI elements (page header, confirm dialogs, pagination)
│   │   └── ui/                # Base UI component primitives (button, card, dialog, input, etc.)
│   ├── context/               # Global state management
│   │   ├── store-context.tsx  # React Context holding live application state
│   │   ├── store-handlers.ts  # State transition handlers for sales, stock, and ledger
│   │   ├── store-types.ts     # TypeScript interface definitions for the global store
│   │   └── local-storage-adapter.ts # Synchronization between IndexedDB and LocalStorage
│   ├── lib/                   # Utility helpers and seed data
│   │   ├── calculations.ts    # Financial and inventory calculation formulas
│   │   ├── currency.ts        # Currency formatting utilities (IDR formatting)
│   │   ├── data-exchange.ts   # CSV parser, CSV generator, and Excel XML builder
│   │   ├── indexed-db.ts      # IndexedDB wrapper for asynchronous key-value persistence
│   │   └── seed/              # Realistic initial demo datasets
│   └── types/                 # Domain entity interfaces and TypeScript types
│       └── index.ts           # Centralized type definitions (Account, Sale, Product, etc.)
├── package.json               # Project dependencies and script declarations
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project documentation
```

---

## Getting Started

Follow these instructions to set up and run **mngmt** on your local machine.

### Prerequisites

Ensure you have the following installed:
- **Node.js:** version 18.18.0 or later (Node.js 20+ recommended)
- **Package Manager:** `pnpm` (recommended), `npm`, or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/mngmt.git
   cd mngmt
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```
   *(Or run `npm install` if using npm)*

### Running the Development Server

Start the local development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application. The application will automatically initialize with a sample demo dataset so you can explore all features immediately.

### Building for Production

Compile the production-optimized build:
```bash
pnpm build
```

Run the compiled application locally:
```bash
pnpm start
```

---

## Data Privacy and Security

- **100% Client-Side Storage:** Financial transactions, personal account numbers, supplier details, and sales records are stored exclusively inside your web browser using IndexedDB.
- **Zero Third-Party Tracking:** No analytical telemetry or sensitive figures are dispatched to external servers.
- **Manual Backups Under Your Control:** You can export your full database to a JSON file at any time from the Settings page and store it on your own encrypted drive or cloud storage.
- **Safe Reset Option:** You can reset the application to default demo data or wipe all stored records directly from the Settings page.

---

## Available Scripts

In the project root, you can run:

- `pnpm dev` — Starts the Next.js development server with hot-reload enabled.
- `pnpm build` — Builds the application for production deployment.
- `pnpm start` — Starts the production server using the compiled output.
- `pnpm lint` — Runs ESLint to verify code quality and coding standards.
- `pnpm test` — Runs automated unit tests for calculations, categories, CSV exchange, Zod validation, and store handlers.

---

## License

This project is licensed under the MIT License. You are free to modify, distribute, and use it for both personal and commercial projects.
