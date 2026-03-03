# Vazana Studio — Progress Log

## Audit & Fix Round (2025)

### 1. Build Fix — Initial
- Created `.env.example` and `.env.local` with placeholder Supabase values
- Made Supabase client/server initialization resilient to missing env vars
- Added `"use client"` directive to 5 pages that were missing it
- Added `force-dynamic` to sign-up page
- Lazy-initialized entities in `entities/all.ts`
- **PR #1 merged** on `fix/build-and-audit`

### 2. Supabase Connection
- Updated `.env.local` with correct Supabase URL (`https://udxvtbwqmfwzghmubfdi.supabase.co`)
- Anon key placeholder added — user must paste their real key on line 5

### 3. Hardcoded Credentials → Env Vars
- Moved root username/password from hardcoded strings to `NEXT_PUBLIC_ROOT_USERNAME` / `NEXT_PUBLIC_ROOT_PASSWORD`
- Updated `lib/client-auth.ts` (login check + register check)
- Updated `app/api/auth/simple-login/route.ts`
- Added defaults in `.env.local` and `.env.example`

### 4. Route Protection Middleware
- Created new `middleware.ts` protecting `/api/*` routes (except `/api/auth/*`)
- Checks for `vazana-session` or `session_token` cookies
- Old `middleware.ts.backup` moved to `_backups/`

### 5. Pin Dependency Versions
- Replaced all `"latest"` versions in `package.json` with exact installed versions from `node_modules`

### 6. Remove react-router-dom
- Removed `react-router-dom` from `package.json`
- Migrated `components/invoices/view-invoice.tsx` — changed `Link to=` → `Link href=`, replaced `useNavigate` with Next.js `useRouter`
- Migrated `components/settings/settings-business-info.tsx` — same pattern

### 7. Organize Backup Files
- Moved 6 backup/temp files to `_backups/` directory:
  - `globals.css.backup`, `middleware.ts.backup`, `temp_settings_backup.tsx`
  - `new-job.tsx.backup`, `dashboard.tsx.backup`, `settings-users.tsx.backup`

### 8. Consolidate MainContent Export
- `sidebar-navigation.tsx` is the canonical `MainContent` (used by 14+ files)
- `main-content.tsx` now re-exports from `sidebar-navigation.tsx`
- Updated `app/settings/resources/job-types/new/page.tsx` import

### 9. Add Vitest + React Testing Library
- Installed `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Created `vitest.config.ts` and `vitest.setup.ts`
- Created `__tests__/utils.test.ts` with 12 tests covering utility functions
- All 12 tests passing
- Added `test` and `test:watch` scripts to `package.json`

### 10. Improve Type Safety
- Created `lib/types.ts` with TypeScript interfaces for all DB tables:
  Client, Job, Worker, Vehicle, Cart, WorkType, Receipt, UserProfile, BusinessSettings, Document
- Updated `lib/api-client.ts` with proper generic types

### 11. Simplify globals.css RTL Overrides
- Removed invalid CSS selectors (`:contains()`, `:has-text()`) from `app/globals.css`
- Kept all valid functional RTL rules

### 12. Fix api-client.ts Base URL
- Replaced hardcoded `https://your-domain.com` with relative `/api` URLs

### Additional Fixes (during build verification)
- Fixed type error in `components/dashboard/dashboard.tsx:263` — added fallback for optional `job.job_date`
- Fixed remaining `<Link to=...>` → `<Link href=...>` in `components/invoices/view-invoice.tsx` (lines 354, 387)

---

## Known Issues / Next Steps
- **Supabase anon key**: User must paste real key into `.env.local` line 5
- **Test coverage**: Only utility functions tested so far — add component tests next
- **react-router-dom**: Fully removed from package.json; all navigation uses Next.js router
- **Entity typing**: `entities/all.ts` still uses `any` internally — consider typing with `lib/types.ts` interfaces
- **Authentication**: Still uses simple hardcoded auth — consider implementing proper auth (Supabase Auth or NextAuth)
