# \[ARCHIVED\] Phase 8: Remaining Fixes, Cross\-Verification, Encryption & Blueprint
All code\-only fixes applied per PROGRESS\_LOG\.md\. DB migration \(009\) still needs to be run — tracked in active Hardening plan\.
## A\. New Issues Found During Cross\-Verification
Code review of every component against its API route, DB schema, and data flow uncovered these issues:
### A1\. Client Edit Modal — Broken Data Persistence \(HIGH\)
**Files:** `components/clients/client-edit-modal.tsx`, missing API routes
* **Payment terms mismatch**: Edit modal sends English values \(`immediate`, `current+30`\) but new\-client\-modal sends Hebrew \(`מיידי`, `שוטף +30`\)\. DB column is `payment_method`\.
* **Timestamp field wrong**: Sends `updated_at` \(line 231\) but DB column is `updated_date`\.
* **Work type rates never saved**: The `workTypeRates` state is loaded from `/api/clients/{id}/rates` \(doesn't exist, returns 404\) and never written back to DB on save\. The UI works but data is lost on modal close\.
* **Payment logs never saved**: Same issue — `/api/clients/{id}/payment-logs` doesn't exist\. UI lets you add entries but they're never persisted\.
**Fix:** Create `/api/clients/[id]/rates/route.ts` and `/api/clients/[id]/payment-logs/route.ts`\. Fix payment\_terms values to Hebrew\. Fix `updated_at` → `updated_date`\. Save workTypeRates and paymentLogs in handleSubmit\.
**DB prerequisite:** Need `client_work_type_rates` and `client_payment_logs` tables in Supabase\.
### A2\. Documents API — Uses Supabase Auth \(BROKEN\)
**File:** `app/api/documents/route.ts`, `lib/document-service.ts`
* Both GET and POST call `supabase.auth.getUser()` — always returns 401 since app uses hardcoded auth
* Document upload/download is completely non\-functional
**Fix:** Switch to hardcoded userId pattern matching other API routes\.
### A3\. Notifications API — Uses Supabase Auth \(BROKEN\)
**File:** `app/api/notifications/route.ts`
* Uses `supabase.auth.getUser()` — always returns 401
**Fix:** Switch to hardcoded userId pattern\. Note: email\-service dependency needs verification\.
### A4\. User Preferences API — Non\-Persistent \(BROKEN\)
**File:** `app/api/user-preferences/route.ts`
* GET returns hardcoded defaults, POST receives data but discards it
* Jobs page view mode, deleted/finished toggles, filters — all reset on refresh
**Fix:** Store in `user_preferences` table \(migration script exists at `scripts/create-user-preferences.sql`\) or use business\_settings as fallback\.
### A5\. API Routes Set `is_sample: true` on New Records \(BUG\)
**Files:** `app/api/workers/route.ts:50`, `app/api/vehicles/route.ts:50`, `app/api/carts/route.ts:50`
* All three POST handlers mark new records as `is_sample: true`
* User\-created data should be `is_sample: false`
**Fix:** Change to `is_sample: false` in all three\.
### A6\. Console\.logs Still in API Routes \(CLEANUP\)
**Files:** All API routes under `app/api/`
* Phase 5 removed `[v0]` prefix logs from components but API routes still have `console.log` for fetching/creating
**Fix:** Remove non\-error console\.logs from API routes\.
### A7\. Business Settings — Missing Bank Columns \(LIKELY BUG\)
**File:** `components/settings/settings-business-info.tsx`, `scripts/06-create-business-settings.sql`
* Component saves `bank_account_name`, `bank_name`, `bank_branch`, `bank_account_number`
* Original SQL schema doesn't include these columns
* These may have been added manually to the live DB, or they silently fail
**Fix:** Need to verify against live DB\. If missing, create migration to add columns\.
### A8\. Audit Summary Stale Entries
**File:** `CODEBASE_AUDIT.md` Section 11
* Items \#8 \(new client from job\), \#12 \(worker/vehicle edit\) were fixed in Phase 6\-7 but not strikethrough'd in the summary due to encoding issues
**Fix:** Update audit summary section\.
## B\. Fixes I Can Implement Now \(Code\-Only\)
These require no DB changes and can be done immediately:
1. **A5**: Fix `is_sample: true` → `false` in workers/vehicles/carts POST routes
2. **A6**: Remove console\.logs from API routes
3. **A2**: Fix documents API auth \(switch to hardcoded userId\)
4. **A3**: Fix notifications API auth \(switch to hardcoded userId\)
5. **A1 partial**: Fix payment\_terms Hebrew values in client\-edit\-modal, fix `updated_at` → `updated_date`
6. **A8**: Update audit summary
## C\. Fixes Requiring DB Changes \(Need User to Run SQL\)
These need SQL executed in Supabase Dashboard:
1. **Client work type rates table** — new table `client_work_type_rates`
2. **Client payment logs table** — new table `client_payment_logs`
3. **Bank columns on business\_settings** — verify/add `bank_account_name`, `bank_name`, `bank_branch`, `bank_account_number`
4. **User preferences table** — run `scripts/create-user-preferences.sql` if not already run
5. **RLS policies** — all current policies use `auth.uid() = created_by_id` which returns NULL with anon key\. Either RLS is disabled \(data exposed\) or needs anon\-compatible policies\.
## D\. Encryption \(Separate Phase\)
Supabase provides encryption at rest by default \(PostgreSQL \+ disk\-level encryption\)\. For column\-level encryption of sensitive fields:
* Supabase supports `pgcrypto` extension for encrypting specific columns
* Candidate fields: `client.email`, `client.phone`, `worker.phone_number`, `business_settings.*bank*`
* This requires:
    1. Enable `pgcrypto` extension in Supabase Dashboard
    2. Create encrypt/decrypt functions
    3. Migrate existing plaintext data
    4. Update all read/write queries to use encrypt/decrypt
* **Recommendation:** Do this AFTER auth/RLS is in place, since encryption without access control has limited value\.
## E\. Suggested Priority Order
1. **Now — Code fixes \(Section B\)**: Fix the 6 code\-only issues
2. **Next — DB setup \(Section C\)**: Create missing tables, verify bank columns
3. **Then — Auth & RLS \(Blueprint Phase 1\)**: Supabase Auth, standardize data access, RLS
4. **Then — Encryption \(Blueprint Phase 2\)**: pgcrypto for sensitive columns
5. **Then — RBAC \(Blueprint Phase 3\)**: Owner/Admin/Staff roles, invite\-only
## F\. Pages Closest to Complete
Ranked by how much work remains to be fully functional:
1. **Dashboard** — ✅ Fully working
2. **Jobs list/create/edit/delete** — ✅ Working \(minor: direct Supabase for create vs API for rest\)
3. **Invoices list/create/PDF** — ✅ Working
4. **Workers list/edit/delete** — ✅ Working \(edit modal \+ direct Supabase\)
5. **Vehicles list/edit/delete** — ✅ Working \(edit modal \+ direct Supabase\)
6. **Business Settings** — ✅ Working \(bank fields need DB column verification\)
7. **Clients list/create/delete** — ✅ Working
8. **Client edit modal** — ⚠️ Basic info tab works, rates/payments tabs are UI\-only \(no persistence\)
9. **Carts** — ⚠️ Similar to workers/vehicles but less tested, no edit modal
10. **Documents** — ❌ Broken \(Supabase Auth in API\)
11. **Notifications** — ❌ Broken \(Supabase Auth in API\)
12. **User Preferences** — ❌ Non\-persistent
