# Vazana V1 — Plan

> Last updated: 2026-03-13 | Branch: main | HEAD: 76c33af

## Current State

### What's Working
- **Dashboard** — stats, approaching jobs, Hebrew UI
- **Jobs** — list, create (new + existing client), edit, soft-delete/restore, .ics calendar export
- **Clients** — list, create, delete, edit (basic info tab works; rates/payments tabs need DB tables from migration 009)
- **Workers** — list, create, edit modal, delete
- **Vehicles** — list, create, edit modal, delete
- **Carts** — list, create, delete (no edit modal yet)
- **Work Types** — full CRUD
- **Invoices** — create from jobs, list, PDF generation, line items
- **Business Settings** — DB-backed save/load (bank columns need migration 009)
- **Maintenance** — system health checks, log console, auto-fix tools
- **Settings** — 6 tabs (general, business, resources, users, integrations, data)
- **Documents** — upload/download (API migrated to Supabase Auth)
- **Auth code** — Supabase Auth migration complete (5 phases), awaiting activation

### What's Blocked
- **Auth activation** — needs Vercel agent to run SQL + set env vars (see Section B)
- **Client rates/payment-logs tabs** — need `client_work_type_rates` + `client_payment_logs` tables (migration 009)
- **User preferences persistence** — deferred to post-auth

### Roles (after auth activation)
- **owner**: Full access, user management, billing. One per system.
- **admin**: Jobs, clients, workers, vehicles, invoices. No owner-level settings.
- **staff**: Read + create jobs, limited editing. No deletes or user management.

---

## A. Code Fixes (do now)

### A1. Invoice field name mismatch (CRITICAL)
The `invoices` DB table uses `invoice_number` and `invoice_date`, but `InvoicesPage` component reads `receipt_number` and `issue_date` (old `receipts` schema). Displays `undefined` / `Invalid Date`.

**Fix**: Update `components/invoices/invoices-page.tsx` interface and all references to use `invoice_number`, `invoice_date`.

### A2. handleDeleteUser doesn't delete from DB
`app/settings/page.tsx` line 426: only removes from React state, never calls Supabase delete. User reappears on refresh.

**Fix**: Add `await supabase.from('user_profiles').delete().eq('id', userId)`.

### A3. Calendar page layout
`app/calendar/page.tsx` — hardcoded `mr-64`, doesn't use `useSidebar()`. Breaks when sidebar is minimized.

**Fix**: Add `useSidebar` hook like other pages.

### A4. Audit trail fake data
Settings → Users tab shows hardcoded fake activity entries ("2 דקות", "5 דקות") and a `console.log` button.

**Fix**: Replace with empty state placeholder ("אין פעילות מתועדת עדיין").

### A5. Settings switches — disable non-functional ones
Multiple switches have no state binding or persistence:
- General: 2FA, activity logging, sound alerts
- Business: holiday calendar, invoice numbering format/number
- Integrations: sync conflict settings, WhatsApp save (console.log only)
- Data: backup scheduling (all inputs), hardcoded date "2025-10-09"

**Fix**: Add `disabled` + "(בקרוב)" label to features that can't work yet.

### A6. User Preferences API
`app/api/user-preferences/route.ts` — returns hardcoded defaults, discards POST input. Preferences currently managed via localStorage on the client side.

**Fix**: Defer to post-auth; wire to `user_preferences` DB table after activation.

---

## B. Auth Activation (Vercel agent steps)

All auth code is committed and pushed. These manual steps activate it:

1. **Vercel env vars**: Add `SUPABASE_SERVICE_ROLE_KEY` (service_role JWT from Supabase → Settings → API) and `SETUP_SECRET=vazana-setup-2024`
2. **Run SQL** `scripts/migrations/009-phase8-missing-tables.sql` in Supabase SQL Editor
   - Creates: `client_work_type_rates`, `client_payment_logs`, bank columns on `business_settings`, `user_preferences`
3. **Run SQL** `scripts/014-migrate-user-profiles.sql` in Supabase SQL Editor
   - Adds `email` column, updates role constraint, makes `password_hash` nullable
4. **Call** POST `/api/auth/setup-owner` with header `x-setup-secret: vazana-setup-2024` and body:
   ```json
   {"email":"amitkorach@gmail.com","password":"<PASSWORD>","username":"amit","full_name":"Amit Korach"}
   ```
5. **Run SQL** `scripts/015-rls-policies.sql` in Supabase SQL Editor
6. **Test login flow** — navigate to app, should redirect to login, log in with owner credentials

---

## C. Post-Activation Checklist

- [ ] Maintenance page (`app/maintenance/page.tsx`): update `clientAuth.*` calls → Supabase Auth
- [ ] Wire `user-preferences` API to `user_preferences` DB table
- [ ] Verify CHECK constraints on `jobs.payment_status` match app values
- [ ] Manual testing (see Section E)

---

## D. Architecture Notes

### Data Access Patterns
Two patterns coexist — both work with RLS after auth activation:

**Through API routes (preferred):**
clients list, new-client, jobs list, edit-job, invoices, business-settings, documents

**Direct Supabase from browser:**
workers CRUD, vehicles CRUD, carts CRUD, work-types CRUD, client-edit-modal UPDATE, new-job-form INSERT, clients-page stats

Not a blocker — direct calls carry user session cookies. For future encryption, writes should eventually route through APIs.

### Key Files
- `proxy.ts` — Next.js middleware, refreshes Supabase session on every request
- `components/auth/auth-provider.tsx` — React context with `useAuth()` hook
- `lib/supabase/admin.ts` — admin client using SUPABASE_SERVICE_ROLE_KEY
- `lib/supabase/server.ts` — cookie-aware server client
- `lib/supabase/client.ts` — browser client
- `lib/client-auth.ts` — old localStorage auth (still used pre-activation, preserved per user rule)
- `app/api/auth/setup-owner/route.ts` — one-time owner creation endpoint

---

## E. Manual Testing Plan (post-activation)

### Auth Flow
- Navigate to app → redirects to /auth/login
- Login with owner credentials → redirects to dashboard
- Refresh page → stays logged in
- Logout → redirects to login
- Access /jobs when logged out → redirects to login

### Read Operations
- Dashboard shows stats
- Clients, Jobs, Workers, Vehicles, Carts, Work Types, Invoices — all list correctly
- Settings → Business Info loads from DB

### Create Operations
- New client → appears in list
- New job (existing client) → appears in list
- New job (new client) → both client and job created
- New worker, vehicle, cart, work type → all appear

### Update Operations
- Edit client basic info, rates, payment logs
- Edit job → status recalculates
- Edit worker, vehicle
- Edit business settings

### Delete Operations
- Delete client, worker, vehicle, cart, work type → removed
- Soft-delete job → hidden; restore → visible again

### Invoices
- Create invoice from jobs → generated
- View invoice → correct line items
- PDF download → renders correctly

### Multi-user (after adding admin/staff accounts)
- Staff: read all, create/edit jobs, cannot delete or manage users
- Admin: everything except owner-level ops

---

## F. Deferred (post-V1)

- **DB encryption**: AES-256-GCM for PII columns (client email/phone/address, worker phone/address, business settings email/phone) — after auth+RLS stable
- **Real audit trail**: Replace fake data in settings with actual activity logging system
- **Email/accounting integrations**: Currently disabled with "(בקרוב)"
- **Calendar page**: Full implementation (currently stub with "coming soon")
- **Automated backup scheduling**: Backend for the settings UI
- **Cart edit modal**: Similar to worker/vehicle modals
