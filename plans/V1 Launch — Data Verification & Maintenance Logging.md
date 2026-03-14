# V1 Launch — Data Verification & Maintenance Logging
## Problem
The app is functionally built but needs two things before real users can use it:
1. **Data persistence verification** — every form/CRUD operation must be confirmed to actually write to Supabase and survive a page refresh\.
2. **Maintenance page with persistent logs** — current logs are in\-memory only \(lost on refresh\)\. Need a `maintenance_logs` table in Supabase so both you and I can read logs remotely to troubleshoot\.
## What You \(Amit\) Need to Do Now
### 1\. Run the pending SQL migrations in Supabase SQL Editor
Go to your Supabase dashboard → SQL Editor → paste and run these **in order**:
* `scripts/migrations/009-phase8-missing-tables.sql` — creates `client_work_type_rates`, `client_payment_logs`, bank columns on `business_settings`, `user_preferences`
* `scripts/014-migrate-user-profiles.sql` — adds `email` column to `user_profiles`, updates constraints
* `scripts/015-rls-policies.sql` — enables RLS policies
These are prerequisite for auth activation and for the new `maintenance_logs` table I'll add\.
### 2\. Set the correct Supabase Service Role Key
In your Vercel dashboard \(or `.env.local` for local dev\), ensure `SUPABASE_SERVICE_ROLE_KEY` is the **service\_role JWT** from Supabase → Settings → API \(NOT the database password\)\. It starts with `eyJ...`\.
### 3\. Create the root/owner user
After the SQL migrations are done and the env var is set, call:
```warp-runnable-command
POST /api/auth/setup-owner
Header: x-setup-secret: vazana-setup-2024
Body: {"email":"amitkorach@gmail.com","password":"YOUR_PASSWORD","username":"amit","full_name":"Amit Korach"}
```
You can do this with curl, Postman, or the browser console\.
### 4\. Create additional users
Once logged in as owner, go to Settings → Users tab → add users with the Add User dialog\. They'll get `admin` or `user` roles\.
### 5\. Seed initial business data
Go to Settings → Business tab and fill in:
* Company name, registration number, address, phone, email
* Bank account details
* VAT percentage, shift times
This data is saved to the `business_settings` Supabase table\.
***
## What I Will Build
### Phase 1: Maintenance Logs to Supabase
**Goal**: Every log from the maintenance page persists to a `maintenance_logs` table so we can both query it remotely\.
**Changes**:
* New migration SQL: `scripts/migrations/010-maintenance-logs.sql`
    * Creates `maintenance_logs` table \(id, timestamp, level, message, component, details jsonb, session\_user text\)
    * RLS: admin/owner can read/write; anon blocked
* New API route: `app/api/maintenance-logs/route.ts`
    * GET: fetch logs with optional filters \(level, component, date range, limit\)
    * POST: write a single log entry
    * DELETE: clear old logs \(admin only\)
* Update `app/maintenance/page.tsx`:
    * `addLog()` → also POSTs to `/api/maintenance-logs`
    * New "Log History" tab showing persisted logs from DB \(paginated\)
    * "Export Logs" button → downloads JSON
    * On page load, fetch last 50 logs from DB to show recent history
### Phase 2: Data Persistence Audit
**Goal**: Walk through every write path in the app and verify each one actually saves to Supabase\. Fix any that don't\.
Write paths to verify \(and fix if broken\):
* **Jobs**: create \(new\-job\-form → `supabase.from('jobs').insert`\), edit \(`/api/jobs/[id]` PUT\), soft\-delete/restore
* **Clients**: create \(`/api/clients` POST\), edit \(`/api/clients/[id]` PUT\), delete
* **Workers**: create/edit/delete \(`/api/workers` POST/PUT/DELETE\)
* **Vehicles**: create/edit/delete \(`/api/vehicles` POST/PUT/DELETE\)
* **Carts**: create/delete \(`/api/carts` POST/DELETE\)
* **Work Types**: create/edit/delete \(`/api/work-types` POST/PUT/DELETE\)
* **Invoices**: create \(`/api/invoices` POST\), line items
* **Business Settings**: save \(`/api/business-settings` PUT — upsert\)
* **User Management**: create \(settings → `supabase.from('user_profiles').insert`\), delete \(A2 fix done\), edit \(user\-edit\-modal\)
* **Documents**: upload/download \(`/api/documents`\)
For each: I'll trace the code path from UI → API/Supabase call → confirm the `.select()` returns data → confirm the UI updates\.
### Phase 3: Maintenance Page Enhancements
Additional checks to add to the "full system check":
* **Write test**: Insert \+ delete a test row in `maintenance_logs` to confirm write access
* **Invoice table check**: verify `invoices` \+ `invoice_line_items` tables accessible
* **Business settings check**: confirm row exists and is populated
* **User profiles check**: count active users, verify root exists
* **Table row counts dashboard**: show count of rows per table \(jobs, clients, workers, etc\.\)
* **Stale data warning**: flag records with `updated_date` older than 90 days
***
## File Changes Summary
* `scripts/migrations/010-maintenance-logs.sql` — new
* `app/api/maintenance-logs/route.ts` — new
* `app/maintenance/page.tsx` — major update \(persistent logs, history tab, export, enhanced checks\)
* Various components — minor fixes if any write paths are broken during audit
