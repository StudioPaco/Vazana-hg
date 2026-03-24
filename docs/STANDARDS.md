# Vazana Studio — Development Standards

> Enforced coding patterns. Follow these when writing any new code.

## Folder Structure

```
app/{feature}/page.tsx          — Page components (App Router)
app/api/{feature}/route.ts      — API route handlers
components/{feature}/*.tsx       — Feature components
components/ui/*.tsx              — shadcn/ui base components
lib/*.ts                         — Utilities, services, contexts
lib/supabase/*.ts                — Supabase client initialization
entities/all.ts                  — Entity classes
hooks/*.ts                       — Custom React hooks
scripts/migrations/*.sql         — Database migrations
```

## TypeScript Rules

- Strict mode enabled
- Interfaces in `lib/types.ts` for all entities
- `(supabase.from('table') as any)` for untyped Supabase tables
- Zod schemas for form validation
- No `console.log` in production code — only `console.error`

## Component Anatomy

```tsx
"use client" // Only if needed (interactivity, browser APIs)

import { useState } from "react"
// External imports
// Internal imports (@/ paths)

interface Props { /* typed props */ }

export function ComponentName({ prop }: Props) {
  // State
  // Effects
  // Handlers
  // Return JSX
}
```

## API Route Pattern

```typescript
import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase.from("table").select("*")
  if (error) {
    console.error("Table fetch error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json({ data })
}
```

## Hebrew UI Conventions

- All user-facing text in Hebrew
- RTL layout: logical CSS (`start/end`, not `left/right`)
- Date formatting: `he-IL` locale
- Payment statuses: `"ממתין לתשלום"`, `"שולם"`, `"מאוחר"`, `"לא רלוונטי"`
- Shift types: `"יום"`, `"לילה"`, `"כפול"`
- Font: Alef (Hebrew), Futura (English)

## Modal Pattern

```tsx
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { getModalClasses } from "@/lib/modal-utils"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className={getModalClasses("lg", true)}>
    {/* Modal content */}
  </DialogContent>
</Dialog>
```

## Database Conventions

- UUID primary keys (`gen_random_uuid()`)
- Timestamps: `created_date`, `updated_date` (TIMESTAMPTZ, DEFAULT NOW())
- Soft delete: `is_deleted` boolean where applicable
- Sample data flag: `is_sample` boolean (false for user-created)
- RLS enabled on all tables
- Migrations: sequential numbering in `scripts/migrations/`, additive only

## Git Workflow

- Branch: `main` (single branch for now)
- Commit after each meaningful chunk
- Descriptive messages: what changed, why, what to verify
- Never force push
- Tag before big refactors: `git tag pre-{milestone}`

## Package Manager

- **pnpm only** — never npm
- `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`
