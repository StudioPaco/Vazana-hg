# Vazana-HG Task Registry

> Last updated: 2026-03-13
> Status: Active Development

---

## MASTER TASK LIST (In Priority Order)

### Phase 1: Critical Infrastructure (CURRENT)

| # | Task | Status | Blocking | Action Required |
|---|------|--------|----------|-----------------|
| 1.1 | Run encryption migration 011 | PENDING | Yes | Run SQL in Supabase |
| 1.2 | Run business settings migration 012 | PENDING | 1.1 | Run SQL in Supabase |
| 1.3 | Set DB_ENCRYPTION_KEY env var | PENDING | 1.1 | Add to Vercel project |
| 1.4 | Verify encryption functions work | PENDING | 1.1-1.3 | Test in maintenance page |

### Phase 2: Authentication Consolidation

| # | Task | Status | Blocking | Action Required |
|---|------|--------|----------|-----------------|
| 2.1 | Remove localStorage auth from client-auth.ts | TODO | 1.x | Code changes |
| 2.2 | Update components to use cookie-based auth | TODO | 2.1 | Code changes (~15 files) |
| 2.3 | Update middleware for unified session | TODO | 2.1 | Code changes |
| 2.4 | Test login/logout flow end-to-end | TODO | 2.1-2.3 | Manual testing |

### Phase 3: Data Migration (localStorage to DB)

| # | Task | Status | Blocking | Action Required |
|---|------|--------|----------|-----------------|
| 3.1 | Migrate business info to DB | TODO | 1.2 | Code changes |
| 3.2 | Migrate payment terms to DB | TODO | 1.2 | Code changes |
| 3.3 | Migrate bank info to encrypted DB | TODO | 1.1 | Code changes |
| 3.4 | Update invoice components to use DB | TODO | 3.1-3.3 | Code changes |

### Phase 4: Polish & Cleanup

| # | Task | Status | Blocking | Action Required |
|---|------|--------|----------|-----------------|
| 4.1 | Clean up duplicate RLS policies | TODO | None | SQL cleanup |
| 4.2 | Remove deprecated backup files | DONE | None | .gitignore updated |
| 4.3 | Archive old SQL scripts | TODO | None | File organization |

---

## YOUR ACTION ITEMS (Step by Step)

### Step 1: Run Encryption Migrations

1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `scripts/migrations/011-add-field-encryption.sql`
3. Run the SQL
4. Copy contents of `scripts/migrations/012-expand-business-settings.sql`
5. Run the SQL

### Step 2: Set Environment Variable

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add new variable:
   - Key: `DB_ENCRYPTION_KEY`
   - Value: Generate a strong 32+ character key (e.g., `openssl rand -base64 32`)
   - Environment: Production, Preview, Development

### Step 3: Verify in Maintenance Page

1. Go to `/maintenance` in your app
2. Run "Full System Check"
3. Check the "Encryption" section shows green status

---

## SYSTEM AUDIT RESULTS

### Pages (29 total)

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Home/Dashboard | `/` | Working | Main dashboard |
| Login | `/auth/login` | Working | Uses client-auth.ts |
| Sign Up | `/auth/sign-up` | Working | Uses auth-custom.ts |
| Jobs List | `/jobs` | Working | |
| New Job | `/jobs/new` | Working | |
| Clients List | `/clients` | Working | |
| New Client | `/clients/new` | Working | |
| Edit Client | `/clients/[id]/edit` | Working | |
| Invoices List | `/invoices` | Working | |
| New Invoice | `/invoices/new` | Working | Uses localStorage for business info |
| Invoice Archive | `/invoices/archive` | Working | |
| Workers | `/workers` | Working | |
| Vehicles | `/vehicles` | Working | |
| Carts | `/carts` | Working | |
| Calendar | `/calendar` | Working | |
| Documents | `/documents` | Working | |
| Settings | `/settings` | Working | Main settings hub |
| Settings - Resources | `/settings/resources` | Working | |
| Settings - Workers | `/settings/resources/workers` | Working | |
| New Worker | `/settings/resources/workers/new` | Working | |
| Settings - Vehicles | `/settings/resources/vehicles` | Working | |
| New Vehicle | `/settings/resources/vehicles/new` | Working | |
| Settings - Carts | `/settings/resources/shopping-carts` | Working | |
| New Cart | `/settings/resources/shopping-carts/new` | Working | |
| Job Types | `/settings/resources/job-types` | Working | |
| New Job Type | `/settings/resources/job-types/new` | Working | |
| Users List | `/users` | Working | |
| Edit User | `/settings/users/[id]/edit` | Working | |
| Maintenance | `/maintenance` | Working | Admin only |

### API Routes (21 total)

| Route | Method | Status | Notes |
|-------|--------|--------|-------|
| `/api/auth/simple-login` | POST | Working | Root + DB auth |
| `/api/business-settings` | GET/POST | Working | |
| `/api/carts` | GET/POST | Working | |
| `/api/clients` | GET/POST | Working | |
| `/api/clients/[id]` | GET/PUT/DELETE | Working | |
| `/api/clients/[id]/rates` | GET/POST | Working | |
| `/api/clients/[id]/payment-logs` | GET/POST | Working | |
| `/api/documents` | GET/POST | Working | |
| `/api/invoices` | GET/POST | Working | |
| `/api/invoices/[id]/line-items` | GET/POST | Working | |
| `/api/invoices/[id]/pdf` | GET | Working | |
| `/api/jobs` | GET/POST | Working | |
| `/api/jobs/[id]` | GET/PUT/DELETE | Working | |
| `/api/migrate` | POST | Caution | Migration utility |
| `/api/notifications` | GET | Working | |
| `/api/sample-data/invoices` | GET | Working | |
| `/api/user-preferences` | GET/POST | Working | |
| `/api/users` | GET/POST | Working | |
| `/api/vehicles` | GET/POST | Working | |
| `/api/work-types` | GET/POST | Working | |
| `/api/workers` | GET/POST | Working | |

### Database Tables (18 total)

| Table | Records | RLS | Encryption | Notes |
|-------|---------|-----|------------|-------|
| users | - | Yes | No | Legacy Supabase auth |
| user_profiles | - | Yes | bcrypt on password | Main user table |
| business_settings | - | Yes | PENDING | Needs encryption |
| clients | - | Yes | PENDING | Contact info encryption |
| workers | - | Yes | No | |
| vehicles | - | Yes | No | |
| carts | - | Yes | No | |
| work_types | - | Yes | No | |
| jobs | - | Yes | No | |
| invoices | - | Yes | No | |
| invoice_line_items | - | Yes | No | |
| receipts | - | Yes | No | |
| documents | - | Yes | No | |
| user_preferences | - | Yes | No | |
| user_roles | - | Yes | No | |
| payment_terms | - | Yes | No | |
| audit_log | - | Yes | No | |
| schema_migrations | 9 | No | No | Migration tracker |

### localStorage Keys (to migrate)

| Key | Used By | Migrate To | Priority |
|-----|---------|------------|----------|
| `vazana_user` | Auth session | Cookie session | HIGH |
| `vazana_logged_in` | Auth state | Cookie session | HIGH |
| `vazana-business-name` | Invoices | business_settings table | HIGH |
| `vazana-business-address` | Invoices | business_settings table | HIGH |
| `vazana-business-phone` | Invoices | business_settings table | HIGH |
| `vazana-business-email` | Invoices | business_settings table | HIGH |
| `vazana-business-vat-id` | Invoices | business_settings table | HIGH |
| `vazana-bank-*` | Invoices | business_settings (encrypted) | HIGH |
| `vazana-payment-terms` | Settings | payment_terms table | MEDIUM |
| `bankAccountInfo` | Settings | business_settings (encrypted) | HIGH |
| `vazana_theme_settings` | Theme | Keep in localStorage | LOW |
| `vazana_language` | i18n | Keep in localStorage | LOW |
| `vazana-font-size` | Accessibility | Keep in localStorage | LOW |
| `vazana-auto-save-forms` | UX preference | Keep in localStorage | LOW |
| `new-job-draft` | Form draft | Keep in localStorage | LOW |
| `new-invoice-draft` | Form draft | Keep in localStorage | LOW |
| `approachingJobsCount` | Cache | Keep in localStorage | LOW |
| `maintenance:lastCheck` | Cache | Keep in localStorage | LOW |

---

## FILES AFFECTED BY AUTH MIGRATION

The following files use `localStorage` for auth and need to be updated:

1. `lib/client-auth.ts` - Main auth class (remove localStorage session)
2. `components/layout/sidebar-navigation.tsx` - Logout handler
3. `components/layout/navigation.tsx` - User display, logout
4. `components/dashboard/simple-dashboard.tsx` - User display
5. `app/clients/page.tsx` - Auth check
6. `app/jobs/page.tsx` - Auth check
7. `app/jobs/new/page.tsx` - Auth check
8. `app/maintenance/page.tsx` - Auth check
9. `hooks/useUserPreferences.ts` - User context

---

## TESTS TO ADD TO MAINTENANCE PAGE

### Working Tests (Green)
- [x] Database connection
- [x] API endpoints health
- [x] Authentication system
- [x] User creation flow
- [x] Data integrity checks

### Tests to Add (Yellow - Not Yet Implemented)
- [ ] Encryption function test
- [ ] Business settings DB test
- [ ] Cookie session validation
- [ ] RLS policy verification
- [ ] Invoice generation test
- [ ] PDF generation test
- [ ] WhatsApp integration test

### Future Tests (Red - Feature Not Built)
- [ ] Email notifications
- [ ] Scheduled jobs
- [ ] Report generation
- [ ] Data export/import
- [ ] Backup/restore

---

## NOTES

- All SQL migrations start at version 010+
- Never delete or modify already-run migration scripts
- Use `schema_migrations` table to track what's been applied
- Root password is hardcoded until manually verified and migrated to DB
