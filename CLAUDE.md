# Vazana — Claude Code Guide

> This file provides guidance to Claude Code when working with this repository.
> For safety rules see `.claude/GUIDELINES.md`. For session continuity see `docs/HANDOFF.md`.

## Project Overview

**Vazana** (וזאנה) is a Hebrew/English bilingual business management system for a road safety services company. It manages clients, jobs, workers, vehicles, carts, invoices, documents, and users.

- **Site**: https://vazana.vercel.app
- **Supabase Project**: `udxvtbwqmfwzghmubfdi`
- **Primary User**: David Vazana (דוד וזאנה) — staff role
- **Owner**: Amit Korach (amitkorach@gmail.com) — owner role

## Development Commands

```bash
pnpm install          # Install dependencies (NEVER use npm)
pnpm dev              # Start dev server (Next.js + Turbopack)
pnpm build            # Production build
pnpm start            # Run production server
pnpm test             # Run vitest tests
pnpm test:watch       # Watch mode tests
```

## Architecture

### Stack
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui (Radix), Lucide icons
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Language**: TypeScript strict, Hebrew-first (RTL)
- **Fonts**: Alef (Hebrew), Futura (English)

### Directory Structure
```
app/                    # Next.js App Router pages + API routes
  api/                  # 30+ REST API route handlers
  auth/                 # Login/signup pages
  jobs/, clients/, ...  # Feature pages
components/             # React components by feature
  auth/                 # Auth provider, login form
  dashboard/            # Dashboard stats, charts
  layout/               # Sidebar, navigation, loading
  ui/                   # shadcn/ui base components
  jobs/, clients/, ...  # Feature-specific components
entities/               # BaseEntity + 7 entity classes (all.ts)
lib/                    # Core utilities and services
  supabase/             # admin.ts, server.ts, client.ts
  types.ts              # All TypeScript interfaces
  api-client.ts         # Custom API client
  api-entities.ts       # API entity wrappers
  invoice-service.ts    # Invoice + PDF generation
  jobs-import-utils.ts  # CSV/Excel import
hooks/                  # Custom React hooks (7 files)
scripts/                # SQL migrations (43 files + 19 in migrations/)
plans/                  # Project planning documents
docs/                   # Protocol docs (HANDOFF, PROGRESS, etc.)
```

### Data Access Patterns

Two coexist — both work with RLS after auth:

**Through API routes** (preferred):
clients, jobs, invoices, documents, users, auth, business-settings

**Direct Supabase from browser**:
dashboard, vehicles, workers, carts, work-types, job form dropdowns, maintenance

### Key Files
| File | Purpose |
|------|---------|
| `proxy.ts` | Middleware — refreshes Supabase session every request |
| `components/auth/auth-provider.tsx` | `useAuth()` hook and React context |
| `lib/supabase/admin.ts` | Admin client (SERVICE_ROLE_KEY) |
| `lib/supabase/server.ts` | Cookie-aware server client |
| `lib/supabase/client.ts` | Browser client |
| `entities/all.ts` | BaseEntity + Client, Job, Worker, Vehicle, Cart, WorkType |
| `lib/types.ts` | TypeScript interfaces for all entities |
| `lib/api-entities.ts` | API entity wrappers for CRUD |
| `lib/invoice-service.ts` | Invoice generation + HTML-to-PDF |
| `lib/jobs-import-utils.ts` | CSV/Excel job import with validation |
| `lib/payment-utils.ts` | Payment status + calculations |
| `lib/stats.ts` | Dashboard statistics |
| `lib/language-context.tsx` | Hebrew/English i18n context |
| `lib/theme-context.tsx` | Theme provider (light/dark) |

### Authentication & Roles
- Supabase Auth (JWT sessions in cookies)
- `proxy.ts` refreshes session on every request
- Three roles: **owner** (full access), **admin** (jobs/clients/workers), **staff** (read + limited write)
- Users: owner (amitkorach@gmail.com), staff (david.vazana13, hanny22258)

### Database (24 tables, all with RLS)
Core: clients, jobs, workers, vehicles, carts, work_types
Financial: invoices, invoice_line_items, receipts
Auth: user_profiles, user_sessions, user_roles
Config: business_settings, user_preferences
Other: documents, maintenance_logs, audit_log, client_work_type_rates, client_payment_logs, schema_migrations

## Coding Conventions

### Hebrew-First UI
- All user-facing strings in Hebrew
- RTL layout: `dir="rtl"` on root `<html>`
- Use logical CSS: `start/end` not `left/right`
- Date format: he-IL locale
- Currency: ILS (₪), VAT 18%

### Payment Statuses (Hebrew)
- `"ממתין לתשלום"` — pending
- `"שולם"` — paid
- `"מאוחר"` — overdue
- `"לא רלוונטי"` — not applicable

### Shift Types
- `"יום"` — day, `"לילה"` — night, `"כפול"` — double

### Component Patterns
- Feature components in `components/{feature}/`
- shadcn/ui base in `components/ui/`
- Modals use `Dialog/DialogContent` from Radix + `getModalClasses()` from `lib/modal-utils.ts`
- `"use client"` only where needed (interactivity, browser APIs)

### API Route Patterns
- Return `{ data: T }` on success, `{ error: string }` on failure
- Use `createServerClient` from `lib/supabase/server.ts` for auth
- Use admin client from `lib/supabase/admin.ts` for privileged ops
- Set `is_sample: false` on user-created records
- Only `console.error` — no `console.log`

### Supabase Patterns
- Untyped tables: `(supabase.from('table') as any)`
- Entity classes in `entities/all.ts` extend BaseEntity with common CRUD
- Migrations in `scripts/migrations/` — sequential numbering, additive only

## Current Status

### Working
Dashboard, Jobs (CRUD + import + .ics), Clients (CRUD + rates + payment logs), Workers, Vehicles (CRUD + edit modals), Carts (CRUD, no edit modal), Work Types, Invoices (create + PDF), Business Settings, Documents, Settings (6 tabs), Auth (Supabase, login/logout), Maintenance page

### Deferred (post-V1)
- DB encryption (AES-256-GCM for PII via pgcrypto)
- Real audit trail
- Email/accounting integrations
- Full calendar page
- Cart edit modal
- Automated backup scheduling

## Session Protocol

See `docs/HANDOFF.md` for session continuity.
See `docs/PROGRESS.md` for current state.
See `.claude/GUIDELINES.md` for safety rules.
