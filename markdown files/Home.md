# Barb's Bottles — Project Notes

A central index for all project documentation. Click any link to open the note directly in Obsidian.

---

## TODO

### In Progress
- [x] Fix nav text/icons black in dark mode → `components/NavButton.tsx`, `ModeToggle.tsx`, `Header.tsx` — see [[Customer_Pages_Coding_Guide]] ✅ 2026-05-05
- [x] Fix Edit button dark mode + add blue outline → `app/(dashboard)/customers/page.tsx` lines 144 & 176 — see [[Customer_Pages_Coding_Guide]] ✅ 2026-05-05
- [x] Fix Quick Action buttons black instead of blue → `app/(dashboard)/home/page.tsx` lines 85, 88, 91 — see [[Customer_Pages_Coding_Guide]] ✅ 2026-05-05
- [x] Add `app/(dashboard)/error.tsx` Sentry error boundary — see [[Sentry_Setup]] ✅ 2026-05-05
- [x] Fix active toggle always saving as inactive — change `get()` to `getAll().includes()` in `products/actions.ts:28` — see [[Bug_Fixes]] ✅ 2026-05-06
- [x] Build orders pages — fix Zod schema, actions, form, list with joins — see [[Orders_Pages_Coding_Guide]] ✅ 2026-05-11
- [x] Add stock quantity to products — DB migration + 4 file changes — see [[Product_Pages_Coding_Guide]] ✅ 2026-07-29
- [x] Coldest products schema update + inventory seed — update enums, add 10 new columns, rename colors→designs, seed 10 products with 121 designs — see [[Coldest_Products_Schema_Update]] ✅ 2026-07-29
- [x] Implement multi-item orders — add `order_items` table, push schema via `db:push`, updated actions/form/list with expandable rows and `OrderRow` — see [[multi-item-orders-implementation]] ✅ 2026-05-29
- [x] Fix Edit buttons on products page — change to `bg-blue-600 hover:bg-blue-700 text-white` (lines 95, 120) — see [[UI_Issues_Design]] ✅ 2026-05-06
- [x] Fix Add Product button text — add `text-white` (lines 25, 36) — see [[UI_Issues_Design]] ✅ 2026-05-06
- [x] Fix typo in `products/actions.ts:25` — `desingTemplates` → `designTemplate` (data silently never saves) — see [[Bug_Fixes]] ✅ 2026-05-06
- [x] Add try/catch to `createProduct` DB insert for constraint errors — see [[Bug_Fixes]] ✅ 2026-05-06
- [x] Fix typo "Unathorized" in `customers/actions.ts:38` — see [[Bug_Fixes]] ✅ 2026-05-06
- [x] Restructure products page around designs — design-first grouping, `product_series`/`bottle_sizes` lookup tables replacing free-text series + `bottleSizeEnum`, bulk design editor, single-variant editor — see [[Products_Data_Model]], `openspec/changes/product-design-catalog-restructure` ✅ 2026-07-29
- [x] Make customer email/phone optional — admin-side contact entry doesn't always have both on hand — see [[Customer_Pages_Coding_Guide]], [[Bug_Fixes]] ✅ 2026-07-29
- [x] Fix stock not decrementing when an order is placed/edited — `orders/actions.ts` never touched `product_designs.quantity` — see [[Bug_Fixes]] ✅ 2026-07-29
- [x] Fix Design field blank when editing an order whose design has since sold out — `OrderItemRow.tsx` filtered it out of its own dropdown — see [[Bug_Fixes]] ✅ 2026-07-30
- [x] Add shipping address + per-item discount fields to the order form — see [[UI_Issues_Design]] ✅ 2026-07-30
- [x] Fix Edit Order form fields resetting on Enter/Update (React 19 auto-resets uncontrolled fields on every form submit) — see [[Bug_Fixes]] ✅ 2026-07-30
- [x] Fix 100% discount silently failing to save an order — `totalPrice` validator required `> 0`, rejecting legitimate $0.00 orders with no visible error — see [[Bug_Fixes]] ✅ 2026-07-30
### Before Production
- [ ] Lower `tracesSampleRate` from `1` to `0.1` in all three Sentry config files — see [[Sentry_Setup]]
- [ ] Review `sendDefaultPii: true` for GDPR compliance — see [[Sentry_Setup]]
- [ ] Move Sentry DSN to `NEXT_PUBLIC_SENTRY_DSN` environment variable — see [[Sentry_Setup]]
- [ ] Look into dotenvx precommit to prevent committing `.env` files — see [[DataBase_Debug]]

### Obsidian Setup
- [ ] Install Dataview plugin — auto-generate live TODO lists from all notes
- [x] Install Templater plugin — consistent structure for new notes
- [x] Install Tasks plugin — enhanced checkbox management
- [ ] Install Git plugin — commit notes alongside code from inside Obsidian

---

## App Layout

```mermaid
flowchart TD
    ROOT["/  —  app/page.tsx"] -->|redirect| LOGIN

    LOGIN["/login  —  app/login/page.tsx"]
    LOGIN -->|Sign in via Kinde| KINDE["Kinde Auth\nbarbsbottles.kinde.com"]
    KINDE -->|authenticated| HOME

    subgraph DASHBOARD ["Dashboard  —  app/(dashboard)/layout.tsx  •  Auth guard"]
        HOME["/home\nhome/page.tsx"]
        CUSTOMERS["/customers\ncustomers/page.tsx"]
        CUST_FORM["/customers/form\nform/page.tsx + CustomerForm.tsx"]
        PRODUCTS["/products\nproducts/page.tsx"]
        PROD_FORM["/products/form\nform/page.tsx + ProductForm.tsx"]
        PROD_BULK["/products/design/[name]\nBulkDesignEditor.tsx"]
        PROD_VARIANT["/products/design-variant/[id]\nSingleVariantEditor.tsx"]
        ORDERS["/orders\norders/page.tsx"]
        ORD_FORM["/orders/form\nform/page.tsx + OrderForm.tsx"]
    end

    CUSTOMERS -->|?id param| CUST_FORM
    CUST_FORM -->|createCustomer / updateCustomer| CUST_ACTIONS["customers/actions.ts"]
    CUST_ACTIONS -->|insert / update| DB["Neon\nPostgres Database"]
    PRODUCTS -->|?id param, or "Manage Designs" link| PROD_FORM
    PROD_FORM -->|createProduct / updateProduct| PROD_ACTIONS["products/actions.ts"]
    PROD_ACTIONS -->|insert / update| DB
    PRODUCTS -->|design-level Edit| PROD_BULK
    PROD_BULK -->|updateDesignVariants, db.batch| PROD_ACTIONS
    PRODUCTS -->|variant-level Edit| PROD_VARIANT
    PROD_VARIANT -->|updateProductDesignVariant / removeProductDesignVariant| PROD_ACTIONS
    HOME -->|getDashboardStats| DB
    CUSTOMERS -->|db.select| DB
    PRODUCTS -->|db.select, ⋈ product_series ⋈ bottle_sizes| DB
    ORDERS -->|?id param| ORD_FORM
    ORDERS -->|select orders+customers, inArray orderItems+products, grouped by orderId| DB
    ORD_FORM -->|createOrder / updateOrder| ORD_ACTIONS["orders/actions.ts"]
    ORD_ACTIONS -->|insert / update| DB
```

---

## Services

| Service | Purpose | Dashboard |
|---------|---------|-----------|
| [Kinde](https://app.kinde.com) | Authentication & user management | app.kinde.com |
| [Neon](https://console.neon.tech) | Postgres database | console.neon.tech |
| [Sentry](https://axis-marketing.sentry.io/projects/barbs-bottles/) | Error tracking & performance monitoring | sentry.io → axis-marketing → barbs-bottles |
| [Vercel](https://vercel.com/dashboard) | Hosting & deployment | vercel.com/dashboard |
| GitNexus | Code intelligence & impact analysis | `npx gitnexus serve` (local) |
| Drizzle | ORM & schema management | `npx drizzle-kit studio` (local) |

---

## Guides
Step-by-step coding guides for building features.

- [[Customer_Pages_Coding_Guide]] — Server actions, form, and customer list pages with all review fixes applied
- [[Product_Pages_Coding_Guide]] — Server actions, form, and product list pages with product-specific field handling (JSON colors, enums, decimal price)
- [[Orders_Pages_Coding_Guide]] — Server actions, form, and orders list with joins; includes Zod schema bug fixes and dynamic color dropdown
- [[multi-item-orders-implementation]] — Full step-by-step guide to adding multi-item support: `order_items` table, migration, updated Zod schemas, actions, dynamic form, and expandable-row list
- [[Product_Image_Upload_Guide]] — Add UploadThing image uploads to products after orders are built *(do this last)*
- [[Coldest_Products_Schema_Update]] — Schema update + seed: real Coldest bottle sizes, series, designs, 10 products seeded

---

## Debugging
Logs of bugs encountered, their root cause, and how they were resolved.

- [[Bug_Fixes]] — App-level bugs (login redirect, root page, post-login URL), plus the "NEW DESIGN INFO" note that became the design-first catalog restructure
- [[DataBase_Debug]] — Neon database connection and migration failures
- [[Seed_Debug]] — Seed script schema mismatches
- [[Products_Data_Model]] — `products`/`product_designs`/`product_series`/`bottle_sizes` schema and page-flow reference; current source of truth for the products data model
- [[ProductForm_Design_Name_Field]] — Planning notes on the Product Name vs. Design Name field, and how the catalog restructure changed that

---

## Setup & Configuration
Reference docs for tools and services wired into the project.

- [[Sentry_Setup]] — What is configured, what is missing, and pre-production checklist
- [[GitNexus_Integration]] — GitNexus workflow: when to run analyze, how to use with AI tools
- [[Obsidian_Claude_Button]] — Weekend project: one-click button in Obsidian that auto-finds and fills in UI issue fixes

---

## UI Issues & Design
Visual bugs spotted in the app and design changes to make or remove.

- [[UI_Issues_Design]] — Running log of UI issues and design changes (add/remove/restyle)

---

## Reviews
PR and code reviews.

- [[PR1_Customer_Pages_Review]] — Review of Copilot PR #1 (customers list and form pages)
- [[App_Audit_2026-05-05]] — Security & correctness audit of products and customers actions (2026-05-05)
- [[security-review-2026-05-12]] — Full codebase security review: hardcoded credentials and IDOR on update actions (2026-05-12)
- [[fallow-audit-2026-06-06]] — Fallow audit of `orders-page-revamp` branch: complexity, duplication, dead code (2026-06-06)
- [[fallow-audit-2026-08-02]] — Full-repo fallow analyze: 1 unused file, 22 unused exports/types, 8 unused deps, 0 structural issues (2026-08-02)

---

## Archive
Notes from other AI tools kept for comparison. Useful for seeing how different models approached the same problem.

### Gemini
- [[GEM_Dashboard_Best_Practices]] — DAL pattern, best practices, and applied fixes for dashboard page
- [[Gem_Dashboard_Fixes]] — Dashboard page error corrections
- [[Gem_Sentry]] — Sentry integration guide for dashboard page

### Copilot
- [[Cop_Dashboard_fixes]] — Dashboard page error corrections
- [[Cop_Sentry_Notes]] — Sentry implementation notes for dashboard page
