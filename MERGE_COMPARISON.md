# Merge Comparison: v0 Branch (PR #2) vs Main (479c82f)

## Executive Summary

**Main branch (Warp)** implemented a **proper Supabase Auth integration** using Next.js 16 patterns.
**PR #2 (v0)** implemented **band-aid fixes** trying to work around auth issues.

**Recommendation: Use Main as the base, cherry-pick specific valuable changes from v0.**

---

## Architecture Comparison

| Aspect | Main (Warp) | PR #2 (v0) |
|--------|-------------|------------|
| **Auth Strategy** | Supabase Auth via `@supabase/ssr` | localStorage + custom cookies |
| **Session Management** | `proxy.ts` handles cookies automatically | Manual `credentials: 'include'` on 40+ fetches |
| **Middleware** | `proxy.ts` (Next.js 16 pattern) | `middleware.ts` (disabled/no-op) |
| **Cookie Handling** | Automatic via Supabase SSR | Manual response.cookies.set() |
| **Security** | Supabase-managed sessions | Custom bcrypt + server env vars |

---

## Main Branch (Warp) - What It Has Right

1. **`proxy.ts`** - Next.js 16's replacement for middleware.ts, properly integrated with Supabase
2. **`@supabase/ssr`** - Official Supabase package for server-side rendering with cookie management
3. **Automatic cookie handling** - No need for `credentials: 'include'` everywhere
4. **Clean architecture** - Session state managed in one place

---

## PR #2 (v0) - What to Keep

### KEEP - These are valuable improvements:

1. **`package.json`** - `vaul` upgraded from 0.9.9 to ^1.1.2 (React 19 compatibility fix)
   - This is a critical fix that should be merged

2. **`lib/auth-custom.ts`** - bcrypt password hashing
   - Changed from plaintext comparison to `bcrypt.compare()`
   - Improved session token generation with `crypto.getRandomValues()`
   - **Keep the bcrypt changes** if not already in main

3. **Server-side root credentials**
   - Changed from `NEXT_PUBLIC_ROOT_PASSWORD` to `ROOT_PASSWORD` (server-only)
   - Prevents credential exposure in client bundles
   - **Keep this security improvement**

4. **Database Migrations Applied** (already in Supabase, keep):
   - Migration 009: `client_work_type_rates`, `client_payment_logs` tables
   - Migration 010: `schema_migrations` tracking table
   - Migration 011: Field encryption functions (`encrypt_sensitive`, `decrypt_sensitive`)
   - Migration 012: Expanded `business_settings` columns

5. **`scripts/MIGRATION_REGISTRY.md`** - Documentation of migration history

6. **`scripts/migrations/`** folder structure - Clean organization for future migrations

### DISCARD - These were band-aids that main's architecture solves properly:

1. **All `credentials: 'include'` additions** - ~40 files modified unnecessarily
   - Main's `proxy.ts` + `@supabase/ssr` handles this automatically

2. **`middleware.ts` modifications** - Made it a no-op
   - Main uses `proxy.ts` instead, which is the correct Next.js 16 pattern

3. **`app/api/auth/simple-login/route.ts`** modifications
   - Manual cookie setting with `response.cookies.set()`
   - Main's Supabase Auth handles this properly

4. **`app/api/auth/session/route.ts`** - Custom session verification
   - Supabase Auth provides this out of the box

5. **`lib/client-auth.ts`** localStorage-first changes
   - The async methods I added that check localStorage first
   - Main's Supabase Auth is the proper solution

6. **`app/globals.css`** consolidation
   - Check if main already has CSS improvements
   - My 785→350 line reduction may conflict with main's styling

---

## Files Comparison

### Files ONLY in v0 branch (NEW):
```
/scripts/migrations/010-add-schema-migrations-tracker.sql
/scripts/migrations/011-add-field-encryption.sql
/scripts/migrations/012-expand-business-settings.sql
/scripts/MIGRATION_REGISTRY.md
/TASK_REGISTRY.md
/V0_SESSION_CHANGES.md
/MERGE_COMPARISON.md (this file)
/_backups/globals.css.backup-2026-03-03
```

### Files MODIFIED in v0 that conflict with main:
```
/middleware.ts                    → DISCARD v0's version, use main's proxy.ts
/lib/client-auth.ts              → DISCARD most changes, possibly keep bcrypt
/lib/auth-custom.ts              → KEEP bcrypt changes if not in main
/app/api/auth/simple-login/route.ts → DISCARD, main has proper auth
/app/api/auth/session/route.ts   → DISCARD, main has proper auth
/app/globals.css                 → COMPARE carefully, may want v0's consolidation
/package.json                    → KEEP vaul upgrade to ^1.1.2
```

### Files MODIFIED in v0 that are probably safe to discard:
```
All files with credentials: 'include' additions:
- /lib/api-client.ts
- /lib/api-entities.ts
- /hooks/use-resources.ts
- /hooks/useUserPreferences.ts
- /components/jobs/jobs-page.tsx
- /components/jobs/new-job-form.tsx
- /components/jobs/edit-job-modal.tsx
- /components/clients/clients-page.tsx
- /components/clients/new-client-modal.tsx
- /components/clients/client-edit-modal.tsx
- /components/invoices/invoices-page.tsx
- /components/users/users-page.tsx
- /components/documents/documents-page.tsx
- /components/notifications/notification-center.tsx
- /components/settings/settings-business-info.tsx
- /components/settings/data-export-import.tsx
- /components/ui/database-dropdown.tsx
- /app/maintenance/page.tsx
... and more
```

---

## Recommended Merge Strategy

### Option A: Use Main, Cherry-Pick from v0 (RECOMMENDED)

1. **Resolve conflict by accepting main's version** for all auth-related files
2. **Cherry-pick these specific changes from v0:**
   - `package.json`: vaul version upgrade
   - `lib/auth-custom.ts`: bcrypt password hashing (if not in main)
   - Server-side env var changes (`ROOT_PASSWORD` instead of `NEXT_PUBLIC_ROOT_PASSWORD`)
   - New migration files in `scripts/migrations/`
   - `scripts/MIGRATION_REGISTRY.md`

3. **Copy these new files from v0:**
   ```
   scripts/migrations/010-add-schema-migrations-tracker.sql
   scripts/migrations/011-add-field-encryption.sql
   scripts/migrations/012-expand-business-settings.sql
   scripts/MIGRATION_REGISTRY.md
   ```

4. **Discard everything else from v0**

### Option B: Manual Merge

If main's version is missing security improvements:
1. Accept main for architecture (proxy.ts, Supabase Auth)
2. Manually add bcrypt to main's auth-custom.ts
3. Manually add server-side env vars
4. Copy migration files

---

## Database State (Independent of Code)

These migrations have been applied to Supabase and should work with either codebase:
- `schema_migrations` table exists with versions 001-012
- `client_work_type_rates` table exists
- `client_payment_logs` table exists
- Encryption functions `encrypt_sensitive()` and `decrypt_sensitive()` exist
- `business_settings` has expanded columns

---

## Questions for Decision

1. Does main's `auth-custom.ts` use bcrypt? If not, port v0's bcrypt changes.
2. Does main use server-side `ROOT_PASSWORD` env var? If not, port this security fix.
3. Does main have the vaul ^1.1.2 upgrade? If not, this is critical for React 19.
4. Do you want v0's CSS consolidation (785→350 lines) or keep main's CSS?
