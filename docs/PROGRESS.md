# Vazana — Progress Snapshot

> Last updated: 2026-04-02

## Current Position
- **Phase**: V1.1 — Feature expansion + polish
- **Milestone**: Testing complete, refining UX + adding new features
- **Branch**: main

## Feature Completeness

### Core Features (100%)
- [x] Dashboard with role-based stats (admin bottom row), quick actions, greeting
- [x] Jobs — list/table views, grid alignment, create, edit, soft-delete/restore, .ics export, Excel import, worker/vehicle conflict check, file badges
- [x] Clients — list/table views, create with tabs (basic+rates), edit, delete, job history with pagination, file badges
- [x] Workers — list, create, edit modal, delete
- [x] Vehicles — list, create, edit modal, delete
- [x] Carts — list, create, edit modal (with license plate), delete
- [x] Work Types — full CRUD with default_rate field
- [x] Invoices — create from jobs + manual items, list/table views, PDF preview modal, print, line items, payment terms
- [x] Business Settings — DB-backed save/load, shift times
- [x] Documents — upload (Supabase Storage), download, preview modal (images/PDF/other), file association (job/client/invoice), sub-filters
- [x] Job Form Template — editable 10x10 table at /documents/form, save to job
- [x] Calendar (יומן) — week/month views, resource availability, clash detection, cross-view, export
- [x] Settings — 7 tabs (general, business, resources, users, integrations, data, maintenance)

### Auth System (100%)
- [x] Supabase Auth with login retry (role delay fix)
- [x] Login/logout flow with RTL
- [x] Session refresh via proxy.ts
- [x] Role-based access (owner/admin/staff)
- [x] Admin can change other user's password
- [x] Business/maintenance tabs hidden for non-admin
- [x] Last login tracking

### Infrastructure (100%)
- [x] All DB migrations run + security views dropped
- [x] RLS on all tables including schema_migrations
- [x] Notifications table + activity_log table created
- [x] Activity logging on login + job creation
- [x] 30+ API routes
- [x] Vercel deployment working
- [x] Supabase Storage bucket (documents) with proper policies

### Integrations
- [x] Google connection UI (OAuth placeholder, paths config)
- [x] Email integration UI (Gmail/IMAP/Resend options)
- [x] Manual backup (JSON/CSV/XLSX download)
- [x] Google Drive backup button (disabled until OAuth connected)
- [x] Calendar sync toggle (.ics working, Google Calendar placeholder)

### UI/UX
- [x] RTL layout across all pages
- [x] Dialog X button on left (RTL correct)
- [x] Sticky dialog headers
- [x] Print CSS hides sidebar
- [x] Favicon (business logo)
- [x] "Vazana" branding (not "Vazana Studio")
- [x] Sort direction toggle on all list pages
- [x] Clear filters button on jobs, clients, invoices
- [x] View preferences persisted (localStorage)
- [x] Invoice template shared component (preview + print identical)

## Known Technical Debt

| Issue | Severity | Notes |
|-------|----------|-------|
| Job form uses direct Supabase insert | Low | Works, could move to API route |
| entities/all.ts schema drift | Low | Entity classes not used by most code |
| Minimal test coverage | Medium | Only __tests__/utils.test.ts |
| Google OAuth not connected | Medium | UI built, needs credentials on deploy |
| Supabase password reset email not branded | Low | Needs custom SMTP (Pro plan) |

## Current Tasks

1. Worker weekly shift availability table (edit modal + new worker form)
2. Job import column mapping UI improvements
3. Update HANDOFF.md and masterplan
4. Prepare for Hanny UAT (Hebrew tests ready at plans/hanny-uat-tests.md)
5. Deploy to Vercel for production testing
