# Vazana Studio — Codebase Audit
> Generated: 2026-03-03 | Audited against: commit 43567d6 (main)

## Legend
- **Health**: ✅ Working | ⚠️ Has Issues | ❌ Broken | 🔲 Not Implemented
- **DB**: 🟢 Connected & Correct | 🟡 Connected but Suspect | 🔴 Not Connected | ⬜ N/A (no DB needed)

---

## 1. AUTHENTICATION (app/auth/, lib/client-auth.ts)

### Login Page (app/auth/login/page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Username field | Input | Enter username | ⬜ | ✅ | Hardcoded auth via env vars |
| Password field | Input | Enter password | ⬜ | ✅ | Uses NEXT_PUBLIC_ROOT_PASSWORD |
| Login button | Button | Submit credentials | ⬜ | ✅ | Sets localStorage + cookie |
| Session cookie | Cookie | vazana-session | ⬜ | ⚠️ | Simple string, not JWT — no expiry logic |

### Sign-Up Page (app/auth/sign-up/page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Sign-up form | Form | User registration | 🔴 | ⚠️ | Uses Supabase Auth but app uses hardcoded auth — conflicting auth models |

**Issues Found:**
- Two conflicting auth systems: simple hardcoded auth (client-auth.ts) vs Supabase Auth (sign-up page)
- Session management uses localStorage — not secure for production
- Middleware checks for cookie but login sets localStorage — potential mismatch

---

## 2. SIDEBAR NAVIGATION (components/layout/sidebar-navigation.tsx)

| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| ניווט (Home) | NavLink | Dashboard → / | ⬜ | ✅ | |
| עבודות (Jobs) | NavLink | Jobs list → /jobs | ⬜ | ✅ | |
| עבודה חדשה | NavLink | New job → /jobs/new | ⬜ | ✅ | |
| לקוחות (Clients) | NavLink | Clients → /clients | ⬜ | ✅ | |
| הפקת חשבוניות | NavLink | New invoice → /invoices/new | ⬜ | ✅ | |
| ארכיון חשבוניות | NavLink | Invoice archive → /invoices/archive | ⬜ | ✅ | |
| ארכיון מסמכים | NavLink | Documents → /documents | ⬜ | ✅ | |
| מרכז תחזוקה | NavLink | Maintenance → /maintenance | ⬜ | ✅ | |
| הגדרות (Settings) | NavLink | Settings → /settings | ⬜ | ✅ | |
| Minimize toggle | Button | Collapse sidebar | ⬜ | ✅ | Persists via localStorage theme settings |
| Logout button | Button | Clear session, redirect | ⬜ | ✅ | Clears localStorage, redirects to /auth/login |
| User display | Text | Shows current user name | ⬜ | ✅ | From localStorage via clientAuth |

---

## 3. DASHBOARD (components/dashboard/dashboard.tsx)

| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Total Clients stat | Card | Count clients | 🟢 | ✅ | Via apiClient.getClients() → /api/clients |
| Active Jobs stat | Card | Count jobs | 🟢 | ✅ | Via apiClient.getJobs() → /api/jobs |
| Workers stat | Card | Count workers | 🟢 | ✅ | Via apiClient.getWorkers() → /api/workers |
| Vehicles stat | Card | Count vehicles | 🟢 | ✅ | Via apiClient.getVehicles() → /api/vehicles |
| Monthly Revenue | Card | Sum paid jobs | 🟢 | ✅ | Filters by payment_status="שולם" — **FIXED 2026-03-03** |
| Pending Jobs | Card | Count pending | 🟢 | ✅ | Filters by payment_status="ממתין לתשלום" — **FIXED 2026-03-03** |
| New Job button | Link | → /jobs/new | ⬜ | ✅ | |
| New Client button | Link | → /clients/new | ⬜ | ✅ | |
| Recent Jobs list | List | Last 5 jobs | 🟢 | ⚠️ | Uses job.job_date with optional fallback — OK |

**Issues Found:**
- ~~**CRITICAL**: Dashboard status mismatch~~ → **FIXED 2026-03-03**: Now uses Hebrew statuses, UI fully translated to Hebrew, RTL layout applied
- ~~Dashboard text is mostly English~~ → **FIXED 2026-03-03**: All UI text converted to Hebrew

---

## 4. CLIENTS MODULE

### Clients Page (components/clients/clients-page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Search input | Input | Filter by name/contact/city | 🟢 | ✅ | Client-side filter on fetched data |
| "הוסף לקוח" button | Button | Open new client modal | ⬜ | ✅ | |
| Avg security rate stat | StatsContainer | Calculate avg rate | 🟢 | ✅ | Computed from fetched clients |
| Active clients stat | StatsContainer | Count status="active" | 🟢 | ✅ | |
| Most active client stat | StatsContainer | Client with most jobs | 🟢 | ✅ | Fetches job counts per client via Supabase direct |
| Client card | Card | Display client info | 🟢 | ✅ | |
| "העתק" button | Button | Copy client info to clipboard | ⬜ | ✅ | |
| "ערוך" button | Button | Open edit modal | ⬜ | ✅ | |
| Status badge | Badge | active/inactive | 🟢 | ✅ | |
| Job history toggle | Button | Expand to show last 10 jobs | 🟢 | ✅ | Fetches from Supabase direct (not API route) |
|| Delete client | Function | Remove client | 🟢 | ✅ | Calls DELETE /api/clients/{id} then updates state — **FIXED 2026-03-03** |

### New Client Modal (components/clients/new-client-modal.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| שם החברה * | Input | Company name (required) | 🟢 | ✅ | Maps to company_name |
| איש קשר * | Input | Contact person (required) | 🟢 | ✅ | Maps to contact_person |
| דוא"ל * | Input | Email (required) | 🟢 | ✅ | |
| טלפון * | Input | Phone (required) | 🟢 | ✅ | |
| כתובת | Input | Address | 🟢 | ✅ | |
| עיר | Input | City | 🟢 | ✅ | |
| תיבת דואר | Input | PO Box | 🟢 | ✅ | Maps to po_box |
| אופן תשלום | Select | Payment method | 🟢 | ⚠️ | Stores English value ("immediate") but label shows Hebrew — confusing for reports |
| תעריף שעתי | Input | Hourly/security rate | 🟢 | ⚠️ | Label says "hourly" but maps to security_rate — misleading label |
| תעריף הערכה | Input | Installation rate | 🟢 | ⚠️ | Label says "assessment" but maps to installation_rate — misleading label |
| הערות | Textarea | Notes | 🟢 | ✅ | |
| הוסף לקוח (Submit) | Button | POST /api/clients | 🟢 | ✅ | |
| ביטול (Cancel) | Button | Close + reset form | ⬜ | ✅ | |

### Client Edit Modal (components/clients/client-edit-modal.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Basic Info tab | Form | Edit all basic fields | 🟢 | ✅ | Direct Supabase update |
| Rates tab | Form | Work-type-specific rates | 🟡 | ⚠️ | Fetches /api/clients/{id}/rates — **API route may not exist** |
| Payment Log tab | Form | Monthly payment tracking | 🟡 | ⚠️ | Fetches /api/clients/{id}/payment-logs — **API route may not exist** |
| "הוסף תעריף" button | Button | Add work type rate row | ⬜ | ✅ | |
| "הוסף רשומה" button | Button | Add payment log entry | ⬜ | ✅ | |
| Work type dropdown | Select | Pick work type for rate | 🟢 | ✅ | Fetches from /api/work-types |
| Custom rates 1-5 | Input | Custom rate fields | 🟡 | ⚠️ | Fields custom_rate_1..5 may not exist in DB schema |
| Save button | Button | Submit update | 🟢 | ✅ | Uses Supabase direct (not API route) |
| Rate validation | Logic | Require at least 1 rate | ⬜ | ⚠️ | Forces rate entry even if not needed |

**Issues Found:**
- Client edit uses **direct Supabase** while client create uses **API route** — inconsistent pattern
- /api/clients/{id}/rates and /api/clients/{id}/payment-logs routes likely don't exist (404s silently ignored)
- ~~Delete only removes from React state~~ → **FIXED 2026-03-03**: Now calls DELETE /api/clients/{id}

---

## 5. JOBS MODULE

### Jobs Page (components/jobs/jobs-page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| "עבודה חדשה" button | Link | → /jobs/new | ⬜ | ✅ | |
| View mode toggle | Button | Switch grid/list | ⬜ | ✅ | Persisted via user preferences API |
| Sort toggle (number/date) | Button | Change sort order | ⬜ | ✅ | |
| Revenue stat | Card | Sum total_amount | 🟢 | ✅ | |
| Pending jobs stat | Card | Count ממתין/בתהליך | 🟢 | ✅ | |
| Urgent jobs stat | Card | Count דחוף | 🟢 | ✅ | |
| Completed stat | Card | Count הושלם | 🟢 | ✅ | |
| Status filter | Select | Filter by job status | ⬜ | ✅ | |
| Client filter | Select | Filter by client | ⬜ | ✅ | Dynamic from loaded jobs |
| Show deleted checkbox | Checkbox | Toggle deleted visibility | 🟢 | ✅ | Persisted via user preferences |
| Show finished checkbox | Checkbox | Toggle completed visibility | 🟢 | ✅ | Persisted via user preferences |
| Search input | Input | Search jobs | ⬜ | ✅ | Client-side filter |
| Job card (expand/collapse) | Card | Show/hide job details | ⬜ | ✅ | |
| "ערוך" button | Button | Open edit modal | ⬜ | ✅ | |
| "מחק" button | Button | Soft-delete job | 🟢 | ✅ | PATCH /api/jobs/{id} with is_deleted=true |
| "שחזר" button | Button | Restore deleted job | 🟢 | ✅ | PATCH + reassigns job number |
| Status badge | Badge | Shows job_status | 🟢 | ✅ | |
| Payment badge | Badge | Shows payment_status | 🟢 | ✅ | Only in expanded view |

### New Job Form (components/jobs/new-job-form.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Job number display | Text | Auto-generated | 🟢 | ✅ | Fetches all jobs, finds highest active number |
| סוג עבודה * | DatabaseDropdown | Work type from DB | 🟢 | ✅ | From work_types table |
| תאריך * | Input[date] | Job date | ⬜ | ✅ | |
| אתר * | Input | Site/location | ⬜ | ✅ | |
| סוג משמרת * | Select | Day/Night/Double | ⬜ | ✅ | Hebrew values: יום, לילה, כפול |
| עיר * | Input | City | ⬜ | ✅ | |
| Client type toggle | Button×2 | existing/new client | ⬜ | ✅ | |
| Existing client dropdown | DatabaseDropdown | Pick from DB | 🟢 | ✅ | From clients table |
| New client fields (7 fields) | Inputs | Create client inline | ⬜ | ⚠️ | **New client NOT saved to DB** — only the name goes to job record |
| עובד * | DatabaseDropdown | Worker from DB | 🟢 | ✅ | From workers table |
| רכב * | DatabaseDropdown | Vehicle from DB | 🟢 | ✅ | From vehicles table |
| עגלה | DatabaseDropdown | Cart from DB (optional) | 🟢 | ✅ | From carts table |
| תיאור | Textarea | Description | ⬜ | ✅ | |
| Calendar sync toggle | Switch | Add to Google Calendar | ⬜ | 🔲 | **Stored but not implemented** — no actual calendar integration |
| "יצר עבודה" submit | Button | Insert to DB | 🟢 | ✅ | Direct Supabase insert (not API route) |
| "איפוס טיוטה" | Button | Clear auto-save + reset | ⬜ | ✅ | |
| ביטול | Button | Navigate back | ⬜ | ✅ | |
| Auto-save | Background | Save draft to localStorage | ⬜ | ✅ | SimpleAutoSave with 15-min expiry |

**Issues Found:**
- New job form submits **directly to Supabase** while jobs-page reads via **/api/jobs** — inconsistent
- API route validates shift_type as English ("day","night","double") but form sends Hebrew ("יום","לילה","כפול") — **form bypasses API route entirely via direct Supabase**
- "New client" mode only passes client_name to job — doesn't create a client record
- Calendar sync toggle has no actual integration

### Edit Job Modal (components/jobs/edit-job-modal.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| All job fields | Form | Edit existing job | 🟢 | ✅ | Uses PATCH /api/jobs/{id} |
| Auto status calc | Display | Shows calculated status | ⬜ | ✅ | Based on date comparison |
| Payment status | Display | Auto based on job status | ⬜ | ✅ | |
| Invoice status | Display | Shows invoice state | ⬜ | ✅ | |
| Total amount | Input | Manual entry | 🟢 | ✅ | |
| Shift rate | Input | Per-job rate override | 🟢 | ✅ | |
| Save button | Button | Submit PATCH | 🟢 | ✅ | |

---

## 6. INVOICES MODULE

### Invoices Page (components/invoices/invoices-page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Search input | Input | Filter by number/client | ⬜ | ✅ | Client-side |
| Status filter | Select | Filter by status | ⬜ | ✅ | |
| Revenue stat | StatsContainer | Sum paid invoices | 🟢 | ✅ | |
| Pending stat | StatsContainer | Count "sent" invoices | 🟢 | ✅ | |
| Overdue stat | StatsContainer | Count overdue | 🟢 | ✅ | |
| "הורד PDF" button | Button | Generate PDF download | 🟢 | ✅ | Calls /api/invoices/{id}/pdf — **FIXED 2026-03-03** (auth removed) |
| View button | Button | View invoice details | ⬜ | ✅ | |

### Invoice API (/api/invoices/route.ts)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
|| GET | API | List invoices | 🟢 | ✅ | Uses hardcoded userId pattern — **FIXED 2026-03-03** |
|| POST | API | Create invoice | 🟢 | ✅ | Uses hardcoded userId pattern — **FIXED 2026-03-03** |

**Issues Found:**
- ~~**CRITICAL**: Invoice API uses Supabase Auth~~ → **FIXED 2026-03-03**: All 3 invoice routes (main, pdf, line-items) now use hardcoded userId
- Invoice table name is "invoices" but Receipt entity points to "receipts" — possible table name conflict

---

## 7. WORKERS MODULE (components/workers/workers-page.tsx)

| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| "הוסף עובד" button | Link | → /settings/resources/workers/new | ⬜ | ✅ | |
| Search input | Input | Filter workers | ⬜ | ✅ | Placeholder is English "Search workers..." |
| Worker card | Card | Display worker info | 🟢 | ✅ | Direct Supabase query |
| Availability badges | Badge | Show available days | 🟢 | ✅ | Parsed from JSON availability field |
| Delete button | Button | Delete worker | 🟢 | ⚠️ | Direct Supabase delete — no soft-delete, no confirmation in Hebrew |
| Edit button | Link | → /settings/resources/workers/{id}/edit | ⬜ | ⚠️ | **Route may not exist** |

**Issues Found:**
- Mixed English/Hebrew UI text
- Hard delete (no soft-delete like jobs have)
- Edit link route likely returns 404

---

## 8. VEHICLES MODULE (components/vehicles/vehicles-page.tsx)

| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| "הוסף רכב" button | Link | → /settings/resources/vehicles/new | ⬜ | ✅ | |
| Search input | Input | Filter vehicles | ⬜ | ✅ | Placeholder English |
| Vehicle card | Card | Display vehicle info | 🟢 | ✅ | Direct Supabase |
| Delete button | Button | Delete vehicle | 🟢 | ⚠️ | Hard delete, English confirm |
| Edit button | Link | → /settings/resources/vehicles/{id}/edit | ⬜ | ⚠️ | **Route may not exist** |
| **Sample data fallback** | Logic | Shows fake data on DB error | ⬜ | ❌ | **Shows hardcoded sample vehicles when Supabase errors — misleading** |

---

## 9. SETTINGS MODULE

### Settings Page (app/settings/page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Resources links | Links | Workers/Vehicles/Carts/Job Types | ⬜ | ✅ | |
| Business Info link | Link | → settings-business-info | ⬜ | ✅ | |
| Users link | Link | → /settings/users | ⬜ | ✅ | |

### Business Info (components/settings/settings-business-info.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Business name | Input | Company name | 🔴 | ⚠️ | **Stored only in localStorage** — not synced to DB |
| Business address | Input | Address | 🔴 | ⚠️ | localStorage only |
| Business phone | Input | Phone | 🔴 | ⚠️ | localStorage only |
| VAT ID | Input | Tax number | 🔴 | ⚠️ | localStorage only |
| Business email | Input | Email | 🔴 | ⚠️ | localStorage only |
| Bank account fields (4) | Inputs | Banking details | 🔴 | ⚠️ | localStorage only |
| Save button | Button | Save to localStorage | ⬜ | ✅ | Works but not persistent across devices |
| Apply to Invoices | Button | Update active invoices | 🔴 | 🔲 | **Placeholder only** — shows mock alert |
| Back to Settings | Button | Navigate back | ⬜ | ⚠️ | Uses `createPageUrl("Settings")` — **likely broken** (old framework pattern) |

**Issues Found:**
- **All business settings stored in localStorage only** — lost on browser clear, not shared across devices
- BusinessSettings interface exists in lib/types.ts but is never used
- "Apply to Invoices" is completely non-functional
- Uses `createPageUrl` from `@/utils` which is a leftover from a previous framework

---

## 10. API ROUTES — Cross-Cutting Issues

### Authentication Inconsistency
| Route | Auth Method | Health |
|-------|-----------|--------|
| /api/clients | None (hardcoded userId) | ⚠️ |
| /api/jobs | None (hardcoded userId) | ⚠️ |
| /api/workers | Unknown | ⚠️ |
|| /api/invoices | None (hardcoded userId) | ✅ **FIXED** |
| /api/calendar | Unknown | ⚠️ |
| /api/documents | Unknown | ⚠️ |

### Data Access Inconsistency
| Component | Data Source | Pattern |
|-----------|-----------|---------|
| Clients list | fetch("/api/clients") | API route |
| Client create | fetch("/api/clients") | API route |
| Client edit | supabase.from("clients").update() | Direct Supabase |
|| Client delete | fetch("/api/clients/{id}") DELETE | API route — **FIXED 2026-03-03** |
| Client job history | supabase.from("jobs") | Direct Supabase |
| Jobs list | fetch("/api/jobs") | API route |
| Job create | supabase.from("jobs").insert() | Direct Supabase |
| Job edit | fetch("/api/jobs/{id}") PATCH | API route |
| Job delete | fetch("/api/jobs/{id}") PATCH | API route |
| Workers list | supabase.from("workers") | Direct Supabase |
| Vehicles list | supabase.from("vehicles") | Direct Supabase |
|| Invoices list | fetch("/api/invoices") | API route — **FIXED 2026-03-03** |

---

## 11. GLOBAL ISSUES SUMMARY

### Critical (must fix before production)
1. ~~**Invoice API requires Supabase Auth but app uses hardcoded auth**~~ → ✅ **FIXED 2026-03-03** (all invoice routes use hardcoded userId)
2. ~~**Dashboard revenue/pending counts always show 0**~~ → ✅ **FIXED 2026-03-03** (Hebrew statuses + full Hebrew UI + RTL)
3. ~~**Client delete doesn't hit database**~~ → ✅ **FIXED 2026-03-03** (now calls DELETE /api/clients/{id})
4. **Business settings only in localStorage** → lost on clear, not shared

### High Priority
5. **Inconsistent data access patterns** → mix of API routes and direct Supabase calls
6. **No auth on most API routes** → any user can access any data
7. **Vehicle page shows fake sample data on DB error** → misleading
8. **New client from job form doesn't create client record** → orphaned client_name strings
9. **Calendar sync toggle stored but never implemented**

### Medium Priority
10. **[v0] debug console.logs throughout codebase** → should be removed
11. **Mixed English/Hebrew UI** — workers, vehicles, dashboard have English text
12. **No edit routes for workers/vehicles** → edit buttons likely 404
13. **Misleading form labels** in new client modal (hourly rate → security_rate)
14. **Client edit rate validation** forces rate entry even when not applicable
15. **Payment method stores English values** ("immediate") but displays Hebrew

### Low Priority / Polish
16. **No loading states for some modals**
17. **Confirm dialogs mix English and Hebrew**
18. **Worker availability uses English day names** (Sun, Mon) instead of Hebrew
19. **createPageUrl utility** is a leftover from previous framework
20. **Receipt entity** references "receipts" table but invoices may use "invoices" table
