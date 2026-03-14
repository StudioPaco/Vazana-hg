# Vazana V1 — Plan

> Last updated: 2026-03-14 | Branch: main

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

## A. Code Fixes ✅

### A1. Invoice field name mismatch ✅
### A2. handleDeleteUser doesn't delete from DB ✅
Now deletes from both `auth.users` and `user_profiles` via admin API.
### A3. Calendar page layout ✅
### A4. Audit trail fake data ✅
### A5. Settings switches — disable non-functional ones ✅
### A6. User Preferences API ✅
Wired GET/POST to `user_preferences` DB table using Supabase Auth session (upsert on write).

---

## B. Auth Activation ✅
Completed. Owner user created, Supabase Auth live, login working.

---

## C. Post-Activation Checklist

- [x] Maintenance page: migrated to `useAuth()` from Supabase Auth
- [x] Wire `user-preferences` API to `user_preferences` DB table
- [x] Verify CHECK constraints on `jobs.payment_status` — fixed mismatch (app sent `'ממתין'`, DB requires `'לא רלוונטי'`)
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
- `lib/client-auth.ts` — old localStorage auth (preserved per user rule, no longer imported)
- `app/api/auth/setup-owner/route.ts` — one-time owner creation endpoint
- `app/api/auth/create-user/route.ts` — creates auth.users + user_profiles
- `app/api/auth/change-password/route.ts` — updates Supabase Auth password

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
