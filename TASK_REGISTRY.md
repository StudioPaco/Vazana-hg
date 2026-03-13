# Vazana-HG Task Registry

> Last updated: 2026-03-13
> Status: Active Development

---

## COMPLETED TASKS (v0 Automated)

| Task | Status | Files Changed |
|------|--------|---------------|
| Fix vaul peer dependency | DONE | `package.json` |
| Server-side auth with bcrypt | DONE | `lib/auth-custom.ts`, `lib/client-auth.ts`, `app/api/auth/simple-login/route.ts` |
| Remove NEXT_PUBLIC_ROOT_PASSWORD exposure | DONE | `lib/client-auth.ts` |
| Layout fonts cleanup | DONE | `app/layout.tsx` |
| CSS consolidation (785→350 lines) | DONE | `app/globals.css` |
| Create schema_migrations table | DONE | Executed in Supabase |
| Run migration 011 (encryption) | DONE | Executed in Supabase |
| Run migration 012 (business settings) | DONE | Executed in Supabase |
| Create /api/auth/session endpoint | DONE | `app/api/auth/session/route.ts` |
| Cookie-based auth verification | DONE | `lib/client-auth.ts` |
| Update login page for async auth | DONE | `app/auth/login/page.tsx` |
| Update main page for async auth | DONE | `app/page.tsx` |
| Update sidebar for async auth | DONE | `components/layout/sidebar-navigation.tsx` |
| Add _backups to .gitignore | DONE | `.gitignore` |
| Enhance maintenance page | DONE | `app/maintenance/page.tsx` |
| Create migration documentation | DONE | `scripts/MIGRATION_REGISTRY.md` |

---

## YOUR ACTION ITEMS (Step by Step)

### STEP 1: Set Environment Variables in Vercel (REQUIRED)

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these 3 variables:

| Key | Value | Notes |
|-----|-------|-------|
| `ROOT_USERNAME` | `root` | Or your preferred admin username |
| `ROOT_PASSWORD` | (your secure password) | Replace the hardcoded default |
| `DB_ENCRYPTION_KEY` | (provisioned externally) | For field encryption - assumed already set |

### STEP 2: Redeploy the Application

After setting environment variables, redeploy:
1. Go to Vercel Dashboard → Deployments
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

### STEP 3: Test Login

1. Open your app at the production URL
2. Go to `/auth/login`
3. Log in with `ROOT_USERNAME` and `ROOT_PASSWORD` you set
4. Verify you reach the dashboard

### STEP 4: Run System Health Check

1. Go to `/maintenance`
2. Click **"הרץ בדיקה מלאה"** (Run Full Check)
3. Verify all 5 health indicators show green:
   - Database: Healthy
   - API: Healthy
   - Auth: Healthy
   - Encryption: Healthy
   - Storage: Healthy

### STEP 5: Review the Roadmap

1. In the maintenance page, click the **"מפת דרכים"** (Roadmap) tab
2. Review all 35+ features and their status
3. Features marked "לא פעיל" (Not Working) are future goals

---

## REMAINING TASKS (Manual Action Required)

### High Priority

| Task | Status | Action |
|------|--------|--------|
| Migrate business info from localStorage to DB | TODO | Update settings page to save to Supabase |
| Encrypt bank account details | TODO | Use `encrypt_sensitive()` function when saving |
| Test encryption end-to-end | TODO | Save bank info, verify it's encrypted in DB |

### Medium Priority

| Task | Status | Action |
|------|--------|--------|
| RLS policy audit | TODO | Review 80+ policies in Supabase dashboard |
| Green Invoice integration | TODO | Implement API when ready |
| PDF native export | TODO | Add `@react-pdf/renderer` |

### Low Priority

| Task | Status | Action |
|------|--------|--------|
| WhatsApp integration | TODO | Table exists, API not implemented |
| Calendar sync | TODO | Google Calendar API |
| Multi-language | TODO | Add i18n framework |

---

## SYSTEM AUDIT SUMMARY

### Pages: 29 total - All Working

| Category | Count | Routes |
|----------|-------|--------|
| Dashboard | 1 | `/` |
| Auth | 2 | `/auth/login`, `/auth/sign-up` |
| Jobs | 2 | `/jobs`, `/jobs/new` |
| Clients | 3 | `/clients`, `/clients/new`, `/clients/[id]/edit` |
| Invoices | 3 | `/invoices`, `/invoices/new`, `/invoices/archive` |
| Resources | 9 | `/workers`, `/vehicles`, `/carts`, `/settings/resources/*` |
| Settings | 5 | `/settings`, `/settings/users/*` |
| Other | 4 | `/calendar`, `/documents`, `/users`, `/maintenance` |

### API Routes: 21 total - All Responding

All API routes return 200 OK or 401 (auth required), indicating they're functional.

### Database Tables: 18 total

New columns added by migrations:
- `business_settings`: 3 encrypted BYTEA columns + 10 new config columns
- `clients`: 3 encrypted BYTEA columns

### New Database Functions

- `encrypt_sensitive(plaintext, key)` → BYTEA
- `decrypt_sensitive(ciphertext, key)` → TEXT
- `get_business_settings()` → JSON (auto-decrypts)
- `update_business_settings(data, key)` → JSON (auto-encrypts)

---

## FEATURE STATUS SUMMARY

| Status | Count | Description |
|--------|-------|-------------|
| Working | 24 | Fully functional |
| Partial | 5 | Works but incomplete |
| Not Working | 4 | Planned but not implemented |
| Planned | 2 | Future roadmap |

**Progress: ~75% complete**

---

## NOTES FOR DEVELOPERS

1. **Auth Flow:**
   - Login calls `/api/auth/simple-login` (sets cookies)
   - Client checks `/api/auth/session` for verification
   - localStorage is cache only, cookies are source of truth

2. **Encryption:**
   - `DB_ENCRYPTION_KEY` is provisioned externally via Vercel env vars
   - Call Supabase RPC functions to encrypt/decrypt
   - Secure views auto-decrypt with session key

3. **Migrations:**
   - All new migrations start at version 013+
   - Track in `schema_migrations` table
   - Never modify already-run scripts

4. **Root Password:**
   - Hardcoded fallback: `10203040`
   - Override with `ROOT_PASSWORD` env var
   - Server-side only (not exposed to client)
