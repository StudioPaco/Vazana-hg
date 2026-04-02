# Vazana — Autonomous Development Guidelines

> These rules govern AI-assisted autonomous development.
> They protect the codebase, user data, and project integrity.

---

## NEVER (always ask Amit first)

1. **No destructive DB commands** — `DROP TABLE`, `DELETE FROM` without `WHERE`, `TRUNCATE`, `supabase db reset`
2. **No git force operations** — `reset --hard`, `push --force`, `checkout .`, `clean -f`
3. **No deleting existing files** — refactoring is fine, removing working features is not
4. **No changing auth/security** — passwords, RLS policies that restrict access, service role keys
5. **No removing features** — may refactor but never remove working functionality
6. **No overwriting existing plans** — new plans extend, they don't replace without approval

---

## DO AUTONOMOUSLY (but always document)

1. **Create new files** — components, schemas, actions, migrations
2. **Edit existing files** — bug fixes, feature additions, refactoring
3. **Run additive DB migrations** — CREATE TABLE, ALTER TABLE ADD COLUMN, CREATE INDEX
4. **Commit + push** — after each meaningful chunk, with descriptive commit messages
5. **Update protocol docs** — PROGRESS.md, FEATURE_REGISTRY.md, HANDOFF.md after every commit

---

## ALWAYS (built-in habits)

1. **Read before writing** — never edit a file without reading it first
2. **Verify after changing** — run dev server, check pages still work
3. **Backward compat** — legacy data paths always work alongside new features
4. **Hebrew-first i18n** — every new UI string in Hebrew
5. **pnpm only** — never npm
6. **RTL logical CSS** — start/end, not left/right
7. **`(supabase.from('table') as any)`** — for untyped tables
8. **Descriptive commits** — what changed, why, what to verify

---

## After Each Meaningful Chunk

1. **Full health check** — verify all pages load, DB connectivity works, test key flows
2. **DB scan** — run row count queries via Supabase MCP to verify data integrity
3. **Shake test** — actively try to break what was built (edge cases, empty states, errors)
4. **Suggestion summary** — list ideas for improvements, to be reviewed/approved by Amit
5. **Commit with descriptive message** — what changed, why, what to verify
6. **Update docs** — PROGRESS.md and HANDOFF.md reflect current state

---

## Big Changes Protocol

1. **Write a plan first** — explain what will change and why
2. **Get approval OR backup old** — preferably both
3. **Test locally first** — verify in dev before deploying
4. **Never overwrite existing plan** — extend it, don't replace without confirmation

---

## Before ANY Commit

1. Verify no server errors on key pages
2. Ensure all modified pages work correctly
3. Write clear commit message describing what changed and why
4. Update protocol docs if feature state changed

---

## Supabase Access Rules

**Allowed autonomously:**
- SELECT queries (read data, count rows, verify state)
- list_tables, list_migrations, get_advisors

**Requires Amit's approval:**
- Any DDL (CREATE/ALTER/DROP via apply_migration)
- Data modifications (INSERT/UPDATE/DELETE)
- Edge function deployments
- RLS policy changes

---

## Communication

- Amit is always available for questions, ideas, and corrections
- Good ideas and dilemmas should be raised, not buried
- Suggestions go into a revision list for manual approval/decline
- Don't assume silence means approval — ask when uncertain

---

_Last updated: 2026-03-24_
