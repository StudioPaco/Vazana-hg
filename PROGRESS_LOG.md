# Vazana Studio — Progress Log
> Last updated: 2026-03-03 | Branch: main

## Quick Status Dashboard
| Module | Health | DB Connected | Notes |
|--------|--------|-------------|-------|
| Auth (Login) | ✅ Working | No (hardcoded) | Simple but functional |
| Sidebar/Navigation | ✅ Working | No | All routes valid |
| Dashboard | ✅ Working | Yes | Revenue/pending stats fixed (Hebrew statuses) |
| Clients - List | ✅ Working | Yes (API) | |
| Clients - Create | ✅ Working | Yes (API) | |
| Clients - Edit | ⚠️ Partial | Yes (direct) | Rates/payment-log APIs missing |
| Clients - Delete | ✅ Working | Yes (API) | DELETE /api/clients/{id} |
| Jobs - List | ✅ Working | Yes (API) | |
| Jobs - Create | ✅ Working | Yes (direct) | Bypasses API route |
| Jobs - Edit | ✅ Working | Yes (API) | |
| Jobs - Delete/Restore | ✅ Working | Yes (API) | Soft-delete pattern |
| Invoices | ✅ Working | Yes (API) | Unified to invoices table |
| Workers | ✅ Working | Yes (direct) | Edit modal, Hebrew UI |
| Vehicles | ✅ Working | Yes (direct) | Edit modal, Hebrew UI |
| Carts | ⚠️ Partial | Yes (direct) | Similar to vehicles |
| Settings - Business | ✅ Working | Yes (API) | DB-backed via /api/business-settings |
| Settings - Resources | ✅ Working | Yes | CRUD for work types etc |
| Documents | ⚠️ Unknown | Unknown | Not fully audited |
| Calendar | ✅ Working | No | .ics file download (device-native) |

---

## Completed Work

### Phase 0: Initial Migration (pre-2026-03-03)
- Migrated from v0/Base44 platform to standalone Next.js 15 + Supabase
- Set up entity classes (entities/all.ts) with BaseEntity CRUD pattern
- Built full sidebar navigation with Hebrew RTL layout
- Created all page routes and component structure
- Implemented client, job, worker, vehicle, cart modules
- Added invoice creation and PDF generation system
- Set up Radix UI component library with shadcn/ui patterns
- Implemented custom theme system (Vazana brand colors)

### Phase 1: Build & Deployment Fixes (2026-03-03 morning)
**Commit 35d6636** — fix: resolve build failure from missing Supabase env vars
- Created .env.example with required variables
- Made Supabase client/server resilient to missing env vars
- Added 'use client' to 5 pages missing it
- Added force-dynamic to sign-up page
- Lazy-initialized entities in entities/all.ts

### Phase 2: Comprehensive Audit & Fixes (2026-03-03)
**Commit 43567d6** — audit: comprehensive codebase fixes and improvements
- Moved hardcoded credentials to env vars (NEXT_PUBLIC_ROOT_USERNAME/PASSWORD)
- Added route protection middleware (middleware.ts)
- Pinned all dependency versions in package.json
- Removed react-router-dom, migrated all Link/navigation to Next.js
- Organized backup files into _backups/
- Consolidated MainContent exports
- Added Vitest + React Testing Library (12 passing tests)
- Created TypeScript interfaces for all DB tables (lib/types.ts)
- Fixed CSS invalid selectors in globals.css
- Fixed api-client.ts hardcoded base URL → relative /api
- Fixed dashboard.tsx optional job_date type error
- Fixed remaining Link to→href in view-invoice.tsx

### Phase 3: Cleanup (2026-03-03)
- Removed all Vercel references (VERCEL_DEPLOYMENT_GUIDE.md, .gitignore, WARP.md)
- Deleted stale remote branches (vercel-test, v0/main-f4dd75b5, fix/build-and-audit)
- Created CODEBASE_AUDIT.md — full interactive element catalog

---

### Phase 4: Critical Bug Fixes (2026-03-03)
All 4 critical issues from CODEBASE_AUDIT.md resolved:
1. **Dashboard status mismatch** — Changed English filters ("paid"/"pending") to Hebrew ("שולם"/"ממתין לתשלום"), translated all UI text to Hebrew, added RTL layout, updated payment_status type in lib/types.ts
2. **Client delete not hitting DB** — handleDeleteClient now calls DELETE /api/clients/{id} before removing from state
3. **Invoice API auth incompatible** — Switched all 3 invoice routes (main, pdf, line-items) from Supabase Auth to hardcoded userId pattern matching clients/jobs
4. **Business settings localStorage-only** — Created /api/business-settings route (GET/PUT), component now loads from API on mount and saves via PUT, localStorage kept as fallback cache, fixed broken createPageUrl→router.push("/settings")

Files changed:
- `components/dashboard/dashboard.tsx` — Hebrew statuses, Hebrew UI, RTL
- `lib/types.ts` — payment_status type → Hebrew values
- `components/clients/clients-page.tsx` — handleDeleteClient calls API
- `app/api/invoices/route.ts` — hardcoded auth
- `app/api/invoices/[id]/pdf/route.ts` — hardcoded auth
- `app/api/invoices/[id]/line-items/route.ts` — hardcoded auth
- `app/api/business-settings/route.ts` — NEW: GET/PUT for business_settings table
- `components/settings/settings-business-info.tsx` — API-backed save/load
- `CODEBASE_AUDIT.md` — All 4 critical issues marked as FIXED

### Phase 5: Medium/Low Priority Fixes (2026-03-03)
8 additional issues from CODEBASE_AUDIT.md resolved:
5. **Vehicle fake sample data** — Removed hardcoded sample vehicles on DB error, now shows proper empty state
6. **[v0] debug console.logs** — Removed 84 `[v0]` prefixes across 16 source files
7. **Workers English UI** — Translated all text (search, empty state, labels, confirm dialogs) to Hebrew
8. **Vehicles English UI** — Translated all text (search, empty state, labels, confirm dialogs) to Hebrew
9. **Misleading client form labels** — "תעריף שעתי"→"תעריף אבטחה" (security_rate), "תעריף הערכה"→"תעריף התקנה" (installation_rate)
10. **Payment method English values** — Select now stores Hebrew values ("מיידי", "שוטף +30" etc)
11. **createPageUrl leftover** — Removed last usage from view-invoice.tsx, function now dead code
12. **Worker availability day names** — Changed from English (Sun/Mon) to Hebrew (א׳/ב׳)

Files changed:
- `components/vehicles/vehicles-page.tsx` — removed fake data, Hebrew UI
- `components/workers/workers-page.tsx` — Hebrew UI, Hebrew day names
- `components/clients/new-client-modal.tsx` — corrected labels, Hebrew payment values
- `components/invoices/view-invoice.tsx` — removed createPageUrl import
- 16 files — removed [v0] debug prefixes

### Phase 6-7: Remaining Audit Fixes (2026-03-03)
6 issues from CODEBASE_AUDIT.md resolved:
13. **New client from job form** — "New client" mode now auto-creates client record via /api/clients before inserting job, stores client_id
14. **Client rate validation** — Save blocker replaced with warning confirm; job form blocks submission if selected client has no rates
15. **Receipts→Invoices unification** — PDF route + line-items route now read from "invoices" table; legacy receipt_id fallback preserved; jobs GET route updated
16. **Worker/Vehicle edit modals** — Created worker-edit-modal.tsx and vehicle-edit-modal.tsx; replaced 404 Link buttons with working modal editing
17. **Calendar .ics integration** — Replaced Google Calendar API (calendar-service.ts + /api/calendar) with device-native .ics file download; works on any device/calendar app
18. **Skeleton loaders** — Added skeleton loading states to client-edit-modal rates and payments tabs

New files:
- `components/workers/worker-edit-modal.tsx` — Worker edit modal
- `components/vehicles/vehicle-edit-modal.tsx` — Vehicle edit modal
- `lib/ics-calendar.ts` — .ics calendar file generator

Deleted files:
- `lib/calendar-service.ts` — Dead Google Calendar API code
- `app/api/calendar/route.ts` — Dead calendar API route

Files changed:
- `components/jobs/new-job-form.tsx` — Auto-create client, .ics download, rate validation
- `components/jobs/edit-job-modal.tsx` — Calendar label update
- `components/clients/client-edit-modal.tsx` — Warning validation, skeleton loaders
- `components/workers/workers-page.tsx` — Edit modal integration
- `components/vehicles/vehicles-page.tsx` — Edit modal integration
- `app/api/invoices/[id]/pdf/route.ts` — Unified to invoices table
- `app/api/invoices/[id]/line-items/route.ts` — Removed receipts fallback
- `app/api/jobs/[id]/route.ts` — Updated join from receipts to invoices

### Phase 8: Cross-Verification & Deep Fixes (2026-03-03)
Full code review of every component vs API route vs DB schema. Found and fixed 8 new issues:

19. **is_sample bug** — Workers/vehicles/carts/jobs/work-types POST routes all marked new records as `is_sample: true`. Fixed to `false`.
20. **API route console.logs** — Removed remaining non-error console.log calls from all API routes (clients, jobs, workers, vehicles, carts, work-types, sample-data, user-preferences)
21. **Documents API auth** — `app/api/documents/route.ts` and `lib/document-service.ts` used Supabase Auth (`getUser()`) — always returned 401. Switched to direct Supabase client.
22. **Notifications API auth** — `app/api/notifications/route.ts` used Supabase Auth. Switched to direct Supabase client.
23. **Client edit modal data loss** — Multiple fixes:
    - `payment_terms` key renamed to `payment_method` (matching DB column) — payment method was never being saved
    - Select values changed from English to Hebrew (matching new-client-modal)
    - `updated_at` → `updated_date` (matching DB column)
    - Work type rates and payment logs now saved via new API routes on form submit
24. **Missing API routes created** — `/api/clients/[id]/rates` (GET/PUT) and `/api/clients/[id]/payment-logs` (GET/PUT) for client edit modal tabs
25. **DB migration script** — Created `scripts/migrations/009-phase8-missing-tables.sql` with:
    - `client_work_type_rates` table
    - `client_payment_logs` table
    - Bank columns on `business_settings`
    - `user_preferences` table
    - Permissive RLS policies for anon key access

New files:
- `app/api/clients/[id]/rates/route.ts` — Client work type rates CRUD
- `app/api/clients/[id]/payment-logs/route.ts` — Client payment logs CRUD
- `scripts/migrations/009-phase8-missing-tables.sql` — DB migration for missing tables

Files changed:
- `app/api/workers/route.ts` — is_sample fix, console.log cleanup
- `app/api/vehicles/route.ts` — is_sample fix, console.log cleanup
- `app/api/carts/route.ts` — is_sample fix, console.log cleanup
- `app/api/jobs/route.ts` — is_sample fix, console.log cleanup
- `app/api/jobs/[id]/route.ts` — console.log cleanup
- `app/api/work-types/route.ts` — is_sample fix, console.log cleanup
- `app/api/clients/route.ts` — console.log cleanup
- `app/api/documents/route.ts` — Supabase Auth → direct client
- `app/api/notifications/route.ts` — Supabase Auth → direct client
- `app/api/sample-data/invoices/route.ts` — console.log cleanup
- `app/api/user-preferences/route.ts` — console.log cleanup
- `lib/document-service.ts` — Supabase server → direct client
- `components/clients/client-edit-modal.tsx` — payment_method fix, timestamp fix, rates/logs save

---

## Current Priorities (Next Steps)

### 🔴 DB Migration Required
Run `scripts/migrations/009-phase8-missing-tables.sql` in Supabase SQL Editor to create:
- `client_work_type_rates` — enables client edit modal rates tab
- `client_payment_logs` — enables client edit modal payments tab
- Bank columns on `business_settings`
- `user_preferences` table

### 🟡 Auth & Security (Blueprint Phase 1)
1. Standardize data access — pick one pattern (API routes recommended for multi-user)
2. Implement Supabase Auth + RLS + RBAC (owner/admin/staff roles) for 3-7 users
3. Invite-only user onboarding, disabled self-registration
4. Replace permissive RLS policies with proper role-based ones

### 🟠 Encryption (Blueprint Phase 2)
5. Enable pgcrypto extension
6. Column-level encryption for: client.email, client.phone, worker.phone_number, bank details

### 🟢 Future Enhancements
7. Implement "Apply to Invoices" in business settings
8. Cart edit modal (similar to worker/vehicle modals)
9. User preferences persistence (connect to user_preferences table)
10. Data export/import functionality
11. More test coverage
12. DB migration: rename receipt_id → invoice_id on jobs table

---

## Architecture Notes
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4 + Radix UI + shadcn/ui
- **Auth**: Hardcoded simple auth (env vars) — NOT Supabase Auth
- **Package Manager**: npm (switched from pnpm due to Windows symlink issues)
- **Testing**: Vitest + React Testing Library
- **Fonts**: Alef (Hebrew) + Futura (English)
- **Direction**: RTL (Hebrew-first)

## File Reference
- `CODEBASE_AUDIT.md` — Detailed element-by-element audit with DB connection status
- `WARP.md` — Development guidance for AI assistants
- `lib/types.ts` — TypeScript interfaces for all DB tables
- `entities/all.ts` — Database entity classes with CRUD operations
- `scripts/migrations/009-phase8-missing-tables.sql` — Latest DB migration (run this first!)
