# \[ARCHIVED\] Data Flow Audit, DB Encryption & Manual Testing Plan
Critical fixes applied \(commit 0e2010f\)\. Encryption deferred\. Testing plan moved to active Hardening plan\.
## Part 1: Data Flow Audit — Issues Found
### Critical: Hardcoded stale auth values
* `components/jobs/new-job-form.tsx (278)`: `created_by: "root"` hardcoded — should use authenticated user
* `components/jobs/new-job-form.tsx (258)`: `sampleUserId` still defined \(unused but messy\)
* `components/jobs/new-job-form.tsx (279)`: `created_by_id` commented out — new jobs get `null`, which means the owner setup won't claim them
### Critical: Mixed data access \(direct Supabase vs API routes\)
Some components bypass API routes and call Supabase directly from the browser\. This works with RLS but skips server\-side validation:
**Direct Supabase client \(bypasses API routes\):**
* `workers-page.tsx` — SELECT, DELETE via `supabase.from("workers")`
* `vehicles-page.tsx` — SELECT, DELETE via `supabase.from("vehicles")`
* `carts-page.tsx` — SELECT, DELETE via `supabase.from("carts")`
* `work-types-page.tsx` — SELECT, INSERT, UPDATE, DELETE via `supabase.from("work_types")`
* `client-edit-modal.tsx` — UPDATE via `supabase.from("clients")` \(line 226\)
* `new-job-form.tsx` — INSERT via `supabase.from("jobs")` \(line 294\)
* `clients-page.tsx` — stats query via `supabase.from("jobs")` \(line 91\)
**Through API routes \(correct pattern\):**
* `clients-page.tsx` — fetch list via `/api/clients`
* `new-client-modal.tsx` — POST via `/api/clients`
* `jobs-page.tsx` — fetch list via `/api/jobs`
* `edit-job-modal.tsx` — PATCH via `/api/jobs/[id]`
* `client-edit-modal.tsx` — rates/payment\-logs via API, but main client UPDATE is direct
* `invoices-page.tsx`, `settings-business-info.tsx`, `documents-page.tsx` — via API
**Recommendation:** The direct Supabase calls will work with RLS \(the browser client carries the user's session cookies\), so this isn't a blocker\. However, for consistency and to enable encryption, we should eventually migrate all writes to go through API routes\. **For now, fix only the critical hardcoded values\.**
### Moderate: Stale sample data fallback
* `carts-page.tsx (30-48)`: Falls back to hardcoded sample data on error instead of empty state
### Moderate: Potential DB constraint mismatch
* `new-job-form.tsx (277)`: Sets `payment_status: "ממתין לתשלום"` but the DB CHECK constraint \(from migration 09\) only allows `('ממתין', 'בוצע', 'לתשלום', 'שולם')`\. This will cause INSERT failures\.
* Need to verify the actual constraint in the live DB — may have been altered by later migrations\.
### Field\-to\-DB Mapping Summary
All field mappings are correct — form field names match DB column names properly:
* clients: `company_name`, `contact_person`, `email`, `phone`, `address`, `city`, `po_box`, `payment_method`, `security_rate`, `installation_rate`, `notes`, `status` ✓
* jobs: `job_number`, `work_type`, `job_date`, `site`, `shift_type`, `city`, `client_name`, `client_id`, `worker_name`, `worker_id`, `vehicle_name`, `vehicle_id`, `cart_name`, `cart_id`, `service_description`, `total_amount`, `job_specific_shift_rate`, `notes`, `payment_status` ✓
* workers: `name`, `phone_number`, `address`, `shift_rate`, `payment_terms_days`, `availability`, `notes` ✓
* vehicles: `name`, `license_plate`, `details` ✓
* carts: `name`, `details` ✓
* work\_types: `name_he`, `name_en` ✓
## Part 2: DB Encryption Scoping
### What Supabase already provides
* **At\-rest encryption**: All data stored on disk is encrypted \(AES\-256\) by default
* **In\-transit encryption**: All connections use TLS/SSL
* **Backups**: Encrypted
### What we should add: Application\-level column encryption
For GDPR/privacy compliance, sensitive PII columns should be encrypted at the application layer so even a DB admin or leaked backup can't read them\.
**Sensitive columns to encrypt:**
* `clients.email`, `clients.phone`, `clients.address`
* `workers.phone_number`, `workers.address`
* `user_profiles.email`
* `business_settings.company_email`, `business_settings.phone`
**Approach:** AES\-256\-GCM encryption/decryption in API routes using a server\-side `ENCRYPTION_KEY` env var\. Data stored as encrypted base64 strings\. Search/filter on encrypted columns requires exact\-match lookup via hash index\.
**Tradeoff:** Encrypting columns means you can't search/filter them in SQL\. For this app, search is only on `company_name`, `contact_person`, `worker.name` — none of which are PII that needs encryption\. So this is safe\.
**Implementation:**
1. Create `lib/encryption.ts` with `encrypt(plaintext)` and `decrypt(ciphertext)` functions
2. Add `ENCRYPTION_KEY` to env vars
3. Modify API routes to encrypt on write, decrypt on read
4. Create a migration to encrypt existing plaintext data
5. Direct Supabase client calls from the browser won't encrypt — this is another reason to eventually route all writes through APIs
**Priority:** Medium — do this after auth is fully working end\-to\-end\.
## Part 3: Immediate Fixes \(Pre\-Testing\)
Before manual testing, fix these:
1. Remove `created_by: "root"` from new\-job\-form\.tsx
2. Fix `payment_status` value in new\-job\-form\.tsx \(verify constraint\)
3. Remove sample data fallback in carts\-page\.tsx
## Part 4: Manual Testing Plan
### Prerequisites
* Auth activation complete \(014 migration \+ setup\-owner \+ 015 RLS\)
* Owner can log in successfully
### Test Sequence
**Phase A: Auth Flow**
* A1\. Navigate to app → should redirect to /auth/login
* A2\. Login with owner credentials → should redirect to dashboard
* A3\. Refresh page → should stay logged in \(session persists\)
* A4\. Click logout → should redirect to login page
* A5\. Try accessing /jobs directly when logged out → should redirect to login
**Phase B: Read Operations \(all pages load data\)**
* B1\. Dashboard → shows stats \(clients count, jobs count\)
* B2\. Clients page → lists all clients
* B3\. Jobs page → lists all jobs
* B4\. Workers page → lists all workers
* B5\. Vehicles page → lists all vehicles
* B6\. Carts page → lists all carts
* B7\. Work Types page → lists work types
* B8\. Invoices page → lists invoices
* B9\. Settings → Business Info loads
**Phase C: Create Operations**
* C1\. Create new client → appears in clients list
* C2\. Create new job \(existing client\) → appears in jobs list
* C3\. Create new job \(new client\) → client AND job created
* C4\. Create new worker → appears in workers list
* C5\. Create new vehicle → appears in vehicles list
* C6\. Create new cart → appears in carts list
* C7\. Create new work type → appears in work types list
**Phase D: Update Operations**
* D1\. Edit client \(basic info tab\) → changes saved
* D2\. Edit client \(rates tab\) → work type rates saved
* D3\. Edit client \(payments tab\) → payment logs saved
* D4\. Edit job → changes saved, status recalculates
* D5\. Edit worker → changes saved
* D6\. Edit vehicle → changes saved
* D7\. Edit business settings → changes saved
**Phase E: Delete Operations**
* E1\. Delete client → removed from list
* E2\. Soft\-delete job → marked as deleted, hidden by default
* E3\. Restore deleted job → visible again with new number
* E4\. Delete worker → removed from list
* E5\. Delete vehicle → removed from list
* E6\. Delete cart → removed from list
* E7\. Delete work type → removed from list
**Phase F: Invoices**
* F1\. Create invoice from jobs → invoice generated
* F2\. View invoice → shows correct line items
* F3\. Invoice PDF generation → renders correctly
**Phase G: Multi\-user \(after adding admin/staff accounts\)**
* G1\. Staff user can read all data
* G2\. Staff user can create/edit jobs
* G3\. Staff user CANNOT delete clients or manage users
* G4\. Admin can do everything except owner\-level operations
