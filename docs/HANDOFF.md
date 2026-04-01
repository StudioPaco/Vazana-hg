# Session Handoff

> Generated: 2026-04-02
> Git HEAD: bcc2476
> Branch: main

## Read These Files First

1. `CLAUDE.md` — Project overview, architecture, conventions
2. `docs/PROGRESS.md` — Current feature completeness
3. `docs/HANDOFF.md` — This file (current state + next steps)
4. `plans/hanny-uat-tests.md` — Hebrew test checklist for Hanny
5. `plans/resilience-test-plan.md` — Code health + stress testing plan

## Current State

### What's Been Done (V1.0 + V1.1)
- Full CRUD for all entities (jobs, clients, workers, vehicles, carts, invoices, documents)
- Dashboard with role-based statistics
- Calendar page with availability tracking + clash detection
- Invoice system with manual items, preview modal, print, PDF
- Document management with upload, preview, sub-filters
- Worker/vehicle conflict check in new job form
- File attachment badges on job/client/invoice rows
- Activity logging (login, job creation)
- Notifications + activity_log tables in DB
- All Supabase security issues resolved
- Comprehensive RTL layout fixes
- Hebrew UAT tests written for Hanny

### DB State
| Table | Rows |
|-------|------|
| user_profiles | 3 (owner + 2 staff) |
| clients | 4+ |
| jobs | 12+ |
| workers | 5 |
| vehicles | 4 |
| carts | 3 |
| work_types | 5 (including פיקוח) |
| invoices | 3+ |
| documents | varies |
| notifications | 0 |
| activity_log | growing |

### Remaining Work (In Progress)
1. Worker weekly shift availability table
2. Job import column mapping UI improvements
3. Deploy to Vercel for live testing
4. Hanny UAT execution
5. David UAT execution

### V1.2 Backlog
- Google OAuth connection (needs deploy + credentials)
- Email integration (Gmail/IMAP)
- DB encryption for PII
- Real audit trail expansion
- Automated Google Drive backup scheduling

## Key Contacts
- **Amit Korach** (amitkorach@gmail.com) — Owner, developer
- **David Vazana** (david.vazana13@gmail.com) — Main user, staff role
- **Hanny Korach** (hanny22258@gmail.com) — Staff role, tech-savvy tester

## Supabase
- Project: `udxvtbwqmfwzghmubfdi`
- Storage bucket: `documents` (private, RLS)
- Security: all views dropped, RLS on all tables
