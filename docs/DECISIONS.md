# Vazana — Decision Log

> Architectural decisions with context. Immutable — add new, don't delete old.

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| D001 | Pre-2026 | Supabase over custom backend | Managed PostgreSQL + Auth + RLS + realtime. No backend to maintain. |
| D002 | Pre-2026 | Hebrew-first RTL layout | Primary user (David) is Hebrew-speaking. `dir="rtl"` on root `<html>`. |
| D003 | Pre-2026 | shadcn/ui + Radix primitives | Copy-paste component model, full control, Tailwind integration. |
| D004 | Pre-2026 | Next.js App Router | File-based routing, Server Components, API routes in same project. |
| D005 | Pre-2026 | Custom entity classes (entities/all.ts) | BaseEntity pattern for consistent CRUD across all business entities. |
| D006 | 2026-03 | Supabase Auth over localStorage | Phases 1-5 migration. JWT in cookies, server-side session refresh via proxy.ts. Old localStorage auth preserved but unused. |
| D007 | 2026-03 | Dual data access patterns | API routes for server-auth pages, direct browser Supabase for others. Both work with RLS. Not a blocker. |
| D008 | 2026-03 | Soft delete for jobs | `is_deleted` flag instead of hard delete. Restore functionality for accidental deletions. |
| D009 | 2026-03 | .ics download over Google Calendar API | Device-native calendar integration, no OAuth complexity. Replaces broken Google Calendar code. |
| D010 | 2026-03 | Receipts unified to invoices | Single `invoices` + `invoice_line_items` tables. `receipts` table kept for backward compat but not actively used. |
| D011 | 2026-03 | 17% VAT hardcoded | Israeli standard VAT rate. Stored in business_settings for future flexibility. |
| D012 | 2026-03 | Defer encryption to post-V1 | pgcrypto for PII columns — only valuable after auth+RLS stable. Priority: working app first. |
| D013 | 2026-03-24 | Ralph protocol for session continuity | Adapted from Play project (Studio Paco CRM). docs/ directory with HANDOFF, PROGRESS, BUILD_PHASES, etc. |
| D014 | 2026-03-24 | CLAUDE.md replaces WARP.md | AI guidance file for Claude Code. WARP.md kept as archive. |
