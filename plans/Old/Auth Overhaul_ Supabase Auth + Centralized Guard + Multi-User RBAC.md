# \[ARCHIVED\] Auth Overhaul: Supabase Auth Migration
All 5 phases complete\. Code committed \(479c82f, 6364875\)\. Activation steps moved to the active Hardening plan\.
## Problem
Current auth is broken/inconsistent:
* `proxy.ts` checks for cookies that are never set \(login only writes localStorage\)
* API routes use 3 different patterns: direct anon client \(most\), Supabase Auth server client \(`users`\), or hardcoded userId
* Every page duplicates its own auth guard in `useEffect`
* Root user credentials exposed in `NEXT_PUBLIC_*` env vars \(visible in browser\)
* RLS policies are permissive "allow all" — no actual row\-level security
## Current State
* `@supabase/ssr` already installed
* `lib/supabase/server.ts` already configured with cookie\-based session handling
* `lib/supabase/client.ts` already uses `createBrowserClient`
* `app/api/users/route.ts` already uses Supabase Auth pattern \(`supabase.auth.getUser()`\)
* `lib/client-auth.ts` is the custom auth class \(localStorage \+ bcrypt \+ env vars\)
* 18\+ API routes use direct `createClient` from `@supabase/supabase-js` with anon key
## Roles
* **owner**: Full access, can manage users, settings, billing\. One per system\.
* **admin**: Can manage jobs, clients, workers, vehicles, invoices\. Cannot manage owner\-level settings\.
* **staff**: Read \+ create jobs, limited editing\. Cannot delete or manage users\.
## Plan — 5 Phases \(atomic, sequential\)
### Phase 1: Proxy \+ Auth Guard \(no breaking changes\)
Goal: Centralize auth checking, stop per\-page duplication\.
**1a\. Update `proxy.ts`** to refresh Supabase sessions on every request:
* Use `createServerClient` from `@supabase/ssr` to read/write auth cookies
* On protected routes: check for valid Supabase session
* Exempt `/auth/*` and `/api/auth/*` routes
* Redirect unauthenticated page requests to `/auth/login`
* Return 401 JSON for unauthenticated API requests
**1b\. Create `components/auth/auth-guard.tsx`**:
* Single wrapper component that checks Supabase session client\-side
* Shows loading skeleton while checking
* Redirects to `/auth/login` if not authenticated
* Provides user context via React context
**1c\. Update `app/layout.tsx`**:
* Wrap children in `AuthGuard` \(except `/auth/*` routes\)
* Remove per\-page auth checks from all page files
### Phase 2: Login Flow Migration
Goal: Switch login/logout from custom localStorage to Supabase Auth\.
**2a\. Create `/app/api/auth/login/route.ts`**:
* Accepts username\+password
* Uses Supabase Admin API to look up user by username in `user_profiles`, get their email
* Calls `supabase.auth.signInWithPassword({ email, password })`
* Returns session \(cookies are set automatically by `@supabase/ssr`\)
**2b\. Create `/app/api/auth/logout/route.ts`**:
* Calls `supabase.auth.signOut()`
* Clears session cookies
**2c\. Update `app/auth/login/page.tsx`**:
* Call `/api/auth/login` instead of `clientAuth.login()`
* Remove localStorage writes
* On success, router\.push\('/'\) — session is now in cookies
**2d\. Update logout handlers** in sidebar\-navigation\.tsx, navigation\.tsx, simple\-dashboard\.tsx:
* Call `/api/auth/logout` or `supabase.auth.signOut()`
* Remove localStorage cleanup
### Phase 3: API Route Migration
Goal: All API routes use authenticated Supabase server client\.
For each route in `app/api/`:
* Replace `createClient` from `@supabase/supabase-js` with `createClient` from `@/lib/supabase/server`
* Remove hardcoded userId / defaultUser
* Add `supabase.auth.getUser()` check at top
* The Supabase client now carries the user's JWT → RLS policies can use `auth.uid()`
Routes to migrate \(18 files\):
* `clients/route.ts`, `clients/[id]/route.ts`, `clients/[id]/rates/route.ts`, `clients/[id]/payment-logs/route.ts`
* `jobs/route.ts`, `jobs/[id]/route.ts`
* `workers/route.ts`, `vehicles/route.ts`, `carts/route.ts`
* `work-types/route.ts`
* `invoices/route.ts`, `invoices/[id]/pdf/route.ts`, `invoices/[id]/line-items/route.ts`
* `business-settings/route.ts`
* `notifications/route.ts`, `documents/route.ts`
* `user-preferences/route.ts`
* `sample-data/invoices/route.ts`
### Phase 4: Owner User Setup \+ Migration
Goal: Create owner account in Supabase Auth, seed user\_profiles\.
**4a\. Create migration `010-supabase-auth-setup.sql`**:
* Ensure `user_profiles` table has columns: `id` \(FK to auth\.users\), `username`, `email`, `full_name`, `role`, `is_active`, `permissions` \(JSONB\)
* Add `auth_user_id` column if `id` isn't already a UUID FK to auth\.users
**4b\. Create setup script** `/scripts/setup-owner.ts`:
* Uses Supabase Admin API \(service\_role key\) to create owner user in `auth.users`
* Inserts corresponding `user_profiles` row with `role = 'owner'`
* Owner credentials come from `SUPABASE_OWNER_EMAIL` and `SUPABASE_OWNER_PASSWORD` env vars \(server\-side only, NOT `NEXT_PUBLIC_`\)
**4c\. Remove** `NEXT_PUBLIC_ROOT_USERNAME` and `NEXT_PUBLIC_ROOT_PASSWORD` from `.env.local`
* These are a security risk \(exposed to browser\)
### Phase 5: RLS Policies
Goal: Replace permissive "allow all" with proper row\-level security\.
**5a\. Create migration `011-rls-policies.sql`**:
* Drop all "Allow all access" policies
* For each table, create policies based on `auth.uid()`:
    * `SELECT`: All authenticated users
    * `INSERT/UPDATE/DELETE`: Based on role from `user_profiles`
* Use a helper function: `get_user_role(auth.uid())` that reads from `user_profiles`
**5b\. Test all CRUD operations** with owner, admin, and staff roles
## What Stays
* `lib/client-auth.ts` — will be replaced by Supabase Auth client\-side helpers, but preserved until Phase 2 is complete \(per user rule: don't delete functionality\)
* URL masking \(`useUrlMasking`\) — stays active
* `user_profiles` table — stays, becomes the app\-level user metadata table
## Execution Order
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
Each phase is independently deployable and testable\. Build must pass after each phase\.
## Status
**All 5 phases complete\.** Code is committed and pushed\.
Commit 479c82f: Phases 1\-3 \(proxy, login, API routes\)
Commit 6364875: Phases 4\-5 \(owner setup, RLS policies\)
### Manual steps required to activate:
1. Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → Settings → API
2. Set it in `.env.local` \(and Vercel env vars\)
3. Run `scripts/014-migrate-user-profiles.sql` in Supabase SQL Editor
4. Call POST `/api/auth/setup-owner` with owner credentials
5. Run `scripts/015-rls-policies.sql` in Supabase SQL Editor
