# Vazana Database Migration Registry

> Last verified against live Supabase DB: 2026-03-03
> Project ID: udxvtbwqmfwzghmubfdi

## Current Live Schema

### Tables (17 total)
| Table | RLS | Rows | Purpose |
|-------|-----|------|---------|
| `users` | yes | 0 | Supabase Auth user mirror (FK to auth.users) |
| `user_profiles` | yes | 0 | Username/password auth, roles, permissions |
| `user_roles` | yes | 0 | Role assignments (admin/user/viewer) |
| `user_preferences` | yes | 0 | Per-user UI preferences (language, theme, filters) |
| `clients` | yes | 0 | Customer companies |
| `workers` | yes | 0 | Field workers, shift rates, availability |
| `vehicles` | yes | 0 | Fleet vehicles |
| `carts` | yes | 0 | Equipment carts |
| `work_types` | yes | 0 | Job type definitions (bilingual) |
| `jobs` | yes | 0 | Core job records with status, shifts, locations |
| `invoices` | yes | 0 | Client invoices with auto-numbering |
| `invoice_line_items` | yes | 0 | Invoice detail lines linked to jobs |
| `receipts` | yes | 0 | Payment receipts |
| `payment_terms` | yes | 0 | Configurable payment term options |
| `business_settings` | yes | 0 | Company info, bank details, shift times |
| `documents` | yes | 0 | File uploads (jobs, clients, invoices) |
| `audit_log` | yes | 0 | Change tracking across tables |
| `resource_availability` | yes | 0 | Worker/vehicle/cart availability by date |
| `whatsapp_integration` | yes | 0 | WhatsApp Business API configuration |

### Installed Extensions
- `pgcrypto` v1.3 (cryptographic functions - ACTIVE)
- `uuid-ossp` v1.1 (UUID generation - ACTIVE)
- `pg_stat_statements` v1.11 (query stats - ACTIVE)
- `pgsodium` -- available but NOT installed

### Functions (14)
- `audit_log_changes()` -- trigger fn: logs INSERT/UPDATE/DELETE to audit_log
- `calculate_job_status()` -- derives job_status from job_date
- `check_user_permission(uuid, text)` -- checks user_profiles.permissions JSONB
- `create_root_user()` -- creates initial root admin profile
- `generate_invoice_number()` -- auto-generates sequential invoice numbers
- `get_current_user_email()` -- returns auth.email() of current user
- `refresh_all_job_statuses()` -- batch recalculates all job statuses
- `set_created_by()` -- trigger fn: sets created_by_id on insert
- `set_initial_timestamps()` -- trigger fn: sets created_date/updated_date
- `set_user_id()` -- trigger fn: sets user_id to auth.uid()
- `update_job_status_trigger()` -- trigger fn: auto-updates job_status
- `update_updated_at_column()` -- trigger fn: updates updated_at on changes
- `upsert_user_preference()` (x2 overloads) -- insert-or-update preference

### Triggers (20)
| Trigger | Table | Events |
|---------|-------|--------|
| `set_carts_created_by` | carts | INSERT |
| `audit_clients_changes` | clients | INSERT, UPDATE, DELETE |
| `set_clients_created_by` | clients | INSERT |
| `trigger_generate_invoice_number` | invoices | INSERT |
| `audit_jobs_changes` | jobs | INSERT, UPDATE, DELETE |
| `set_jobs_initial_timestamps` | jobs | INSERT |
| `set_jobs_user_id` | jobs | INSERT |
| `trigger_update_job_status` | jobs | INSERT, UPDATE |
| `update_jobs_updated_at` | jobs | UPDATE |
| `update_user_profiles_updated_at` | user_profiles | UPDATE |
| `set_vehicles_created_by` | vehicles | INSERT |
| `audit_workers_changes` | workers | INSERT, UPDATE, DELETE |
| `set_workers_created_by` | workers | INSERT |

---

## Script Archive: Canonical Order

The 57 scripts below were all run manually (not tracked by supabase_migrations).
They are listed here in the **logical order they should have been applied** to reach
the current DB state, grouped by phase.

### Phase 1: Foundation (tables, base schema)
| # | File | What it created/modified |
|---|------|------------------------|
| 01 | `scripts/01-create-tables.sql` | Core tables: users, clients, workers, vehicles, carts, work_types, jobs, receipts |
| 02 | `scripts/02-add-documents-table.sql` | documents table |
| 03 | `scripts/03-add-user-management.sql` | user_roles, user_preferences tables |
| 04 | `scripts/04-create-root-user.sql` | Root user profile creation |
| 05 | `scripts/05-update-schema-to-match-base44.sql` | Schema alignment with Base44 design |

### Phase 2: Business logic + Auth
| # | File | What it created/modified |
|---|------|------------------------|
| 06a | `scripts/06-create-business-settings.sql` | business_settings table |
| 06b | `scripts/06-create-root-user.sql` | DUPLICATE of 04 -- root user (redundant) |
| 07 | `scripts/07-username-auth-system.sql` | user_profiles with password_hash, session management |
| 08 | `scripts/08-fix-user-auth-table.sql` | Fixes to user_profiles schema |

### Phase 3: RLS + Policies
| # | File | What it created/modified |
|---|------|------------------------|
| 09a | `scripts/09-fix-rls-policies.sql` | Initial RLS policy fixes |
| 09b | `scripts/09-restore-database-schema.sql` | Schema restoration (redundant with 09a) |
| 10a | `scripts/10-fix-work-types-rls.sql` | work_types RLS policies |
| 10b | `scripts/10-add-sample-data.sql` | Sample data insertion |
| 11a | `scripts/11-enable-rls-all-tables.sql` | Enable RLS on all tables |
| 11b | `scripts/11-run-sample-data.sql` | More sample data (redundant with 10b) |

### Phase 4: Schema refinements + Data
| # | File | What it created/modified |
|---|------|------------------------|
| 12a | `scripts/12-add-required-columns.sql` | Missing columns added |
| 12b | `scripts/12-ensure-work-types-exist.sql` | Ensure work_types has default data |
| 13a | `scripts/13-reset-and-create-rls-policies.sql` | RLS policy reset |
| 13b | `scripts/13-comprehensive-test-data.sql` | Test data |
| 14 | `scripts/14-fix-dropdown-sample-data.sql` | Dropdown sample data fixes |
| 15 | `scripts/15-add-sample-clients.sql` | Sample clients |
| 16a | `scripts/16-fix-all-sample-data.sql` | Fix all sample data |
| 16b | `scripts/16-populate-all-tables.sql` | Populate tables |
| 17 | `scripts/17-fix-rls-and-created-by-defaults.sql` | RLS + created_by defaults |
| 18a | `scripts/18-fix-anonymous-user-constraints.sql` | Anonymous user constraint fixes |
| 18b | `scripts/18-verify-and-update-tables.sql` | Table verification |

### Phase 5: Migrations (formal)
| # | File | What it created/modified |
|---|------|------------------------|
| M001 | `scripts/migrations/001-multi-user-support.sql` | Multi-user support |
| M002 | `scripts/migrations/002-comprehensive-fixes-FINAL.sql` | Comprehensive fixes |
| M003 | `scripts/migrations/003-add-phone-column-fix.sql` | Phone column on user_profiles |
| M004 | `scripts/migrations/004-fix-job-timestamps.sql` | Job timestamp columns |
| M005 | `scripts/migrations/005-fix-payment-status-constraint.sql` | Payment status CHECK fix |
| M006 | `scripts/migrations/006-add-missing-pieces-only.sql` | Missing pieces |
| M007a | `scripts/migrations/007-add-bank-account-fields.sql` | Bank account fields on business_settings |
| M007b | `scripts/migrations/007-fix-job-status.sql` | Job status fix |
| M007c | `scripts/migrations/007-fix-job-status-CORRECTED.sql` | Job status (corrected) |
| M007d | `scripts/migrations/007-fix-job-status-CORRECTED-FINAL.sql` | Job status (final) |
| M008a | `scripts/migrations/008-fix-business-settings-rls.sql` | Business settings RLS |
| M008b | `scripts/migrations/008-fix-shift-types-and-payment-status.sql` | Shift types fix |
| M008c | `scripts/migrations/008-fix-shift-types-and-payment-status-SAFE.sql` | Shift types (safe) |
| M008d | `scripts/migrations/008-fix-shift-types-and-payment-status-ULTRA-SAFE.sql` | Shift types (ultra-safe) |
| M009a | `scripts/migrations/009-phase8-missing-tables.sql` | Missing tables (phase 8) |
| M009b | `scripts/migrations/009-settings-enhancement-database-integration.sql` | Settings enhancement |

### Phase 6: Hotfixes (unnumbered)
| File | Purpose |
|------|---------|
| `scripts/007-fix-job-status-FINAL.sql` | Job status hotfix (top-level) |
| `scripts/add-is-deleted-column.sql` | Soft delete column on jobs |
| `scripts/check-shift-types.sql` | Diagnostic: check shift type values |
| `scripts/create-default-user.sql` | Create default user profile |
| `scripts/create-user-preferences.sql` | user_preferences table creation |
| `scripts/final-user-profiles-rls-fix.sql` | Final user_profiles RLS fix |
| `scripts/fix-clients-rls.sql` | Clients RLS fix |
| `scripts/fix-jobs-rls.sql` | Jobs RLS fix |
| `scripts/fix-missing-columns.sql` | Add missing columns |
| `scripts/fix-shift-type-constraint.sql` | Shift type CHECK constraint fix |
| `scripts/fix-user-profiles-rls.sql` | user_profiles RLS fix |
| `scripts/simple-user-profiles-fix.sql` | Simple user_profiles fix |
| `scripts/test-job-status-functions.sql` | Diagnostic: test job status functions |
| `scripts/test-user-creation.sql` | Diagnostic: test user creation |
| `scripts/verify-migration.sql` | Diagnostic: verify migration state |

---

## Known Duplication Issues
1. **06-create-root-user.sql** duplicates **04-create-root-user.sql**
2. **007-fix-job-status** has 4 competing versions (007, CORRECTED, CORRECTED-FINAL, FINAL)
3. **008-fix-shift-types** has 3 competing versions (normal, SAFE, ULTRA-SAFE)
4. **009** has 2 unrelated scripts sharing the same number
5. Multiple RLS fix scripts overlap each other (09a, 13a, 17, and unnumbered hotfixes)
6. Sample data scripts (10b, 11b, 13b, 14, 15, 16a, 16b) overlap

## Going Forward
- All new migrations MUST go in `scripts/migrations/` with sequential numbering starting from `010-`
- Use `IF NOT EXISTS` / `CREATE OR REPLACE` to make scripts idempotent
- DO NOT delete or modify already-run scripts
- Consider adding a `schema_migrations` tracking table (see migration 010)
