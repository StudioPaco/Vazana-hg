# Vazana V1 — Hardening & Activation
Single active plan\. All prior plans \(Auth Overhaul, Data Flow Audit, Phase 6\-7, Phase 8\) are archived\.
## A\. Code Fixes \(do now\)
### A1\. Invoice field name mismatch \(CRITICAL\)
The `invoices` DB table uses `invoice_number` and `invoice_date`, but `InvoicesPage` component reads `receipt_number` and `issue_date` \(old `receipts` schema\)\. Displays `undefined` / `Invalid Date`\.
**Fix**: Update `components/invoices/invoices-page.tsx` interface and all references to use `invoice_number`, `invoice_date`\.
### A2\. handleDeleteUser doesn't delete from DB
`app/settings/page.tsx` line 426: only removes from React state, never calls Supabase delete\. User reappears on refresh\.
**Fix**: Add `await supabase.from('user_profiles').delete().eq('id', userId)`\.
### A3\. Calendar page layout
`app/calendar/page.tsx` — hardcoded `mr-64`, doesn't use `useSidebar()`\. Breaks when sidebar is minimized\.
**Fix**: Add `useSidebar` hook like other pages\.
### A4\. Audit trail fake data
Settings → Users tab shows hardcoded fake activity entries and a console\.log button\.
**Fix**: Replace with empty state placeholder \("אין פעילות מתועדת עדיין"\)\.
### A5\. Settings switches — disable non\-functional ones
Multiple switches have no state binding or persistence:
* General: 2FA, activity logging, sound alerts
* Business: holiday calendar, invoice numbering format/number
* Integrations: sync conflict settings, WhatsApp save \(console\.log only\)
* Data: backup scheduling \(all inputs\), hardcoded date "2025\-10\-09"
**Fix**: Add `disabled` \+ "\(בקרוב\)" label to features that can't work yet\. For invoice numbering \+ WhatsApp tokens, wire to localStorage on save\.
### A6\. User Preferences API
`app/api/user-preferences/route.ts` — returns hardcoded defaults, discards POST input\.
**Fix**: Defer to post\-auth\. Preferences currently managed via localStorage in the client\.
## B\. Auth Activation \(tomorrow — Vercel agent\)
All code committed\. These are manual steps:
1. Add Vercel env vars: `SUPABASE_SERVICE_ROLE_KEY` \(service\_role JWT from Supabase → Settings → API\), `SETUP_SECRET=vazana-setup-2024`
2. Run `scripts/migrations/009-phase8-missing-tables.sql` in Supabase SQL Editor \(creates client\_work\_type\_rates, client\_payment\_logs, bank columns, user\_preferences\)
3. Run `scripts/014-migrate-user-profiles.sql` in Supabase SQL Editor
4. Call POST `/api/auth/setup-owner` with header `x-setup-secret: vazana-setup-2024` and body `{"email":"amitkorach@gmail.com","password":"<PASSWORD>","username":"amit","full_name":"Amit Korach"}`
5. Run `scripts/015-rls-policies.sql` in Supabase SQL Editor
6. Test login flow
## C\. Post\-Activation Checklist
* Maintenance page \(`app/maintenance/page.tsx`\): update `clientAuth.*` calls to use Supabase Auth
* Wire user\-preferences API to `user_preferences` DB table
* Verify CHECK constraints on `jobs.payment_status` match app values
* Manual testing: auth flow → read all pages → CRUD → invoices → multi\-user
## D\. Deferred \(post\-V1\)
* DB encryption \(AES\-256\-GCM for PII columns\) — after auth\+RLS stable
* Real audit trail system
* Email/accounting integrations
* Calendar page implementation
* Automated backup scheduling
