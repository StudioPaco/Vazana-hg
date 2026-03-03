# Vazana Studio ג€” Codebase Audit
> Generated: 2026-03-03 | Audited against: commit 43567d6 (main)

## Legend
- **Health**: ג… Working | ג ן¸ Has Issues | ג Broken | נ”² Not Implemented
- **DB**: נ¢ Connected & Correct | נ¡ Connected but Suspect | נ”´ Not Connected | ג¬ N/A (no DB needed)

---

## 1. AUTHENTICATION (app/auth/, lib/client-auth.ts)

### Login Page (app/auth/login/page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Username field | Input | Enter username | ג¬ | ג… | Hardcoded auth via env vars |
| Password field | Input | Enter password | ג¬ | ג… | Uses NEXT_PUBLIC_ROOT_PASSWORD |
| Login button | Button | Submit credentials | ג¬ | ג… | Sets localStorage + cookie |
| Session cookie | Cookie | vazana-session | ג¬ | ג ן¸ | Simple string, not JWT ג€” no expiry logic |

### Sign-Up Page (app/auth/sign-up/page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Sign-up form | Form | User registration | נ”´ | ג ן¸ | Uses Supabase Auth but app uses hardcoded auth ג€” conflicting auth models |

**Issues Found:**
- Two conflicting auth systems: simple hardcoded auth (client-auth.ts) vs Supabase Auth (sign-up page)
- Session management uses localStorage ג€” not secure for production
- Middleware checks for cookie but login sets localStorage ג€” potential mismatch

---

## 2. SIDEBAR NAVIGATION (components/layout/sidebar-navigation.tsx)

| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| ׳ ׳™׳•׳•׳˜ (Home) | NavLink | Dashboard ג†’ / | ג¬ | ג… | |
| ׳¢׳‘׳•׳“׳•׳× (Jobs) | NavLink | Jobs list ג†’ /jobs | ג¬ | ג… | |
| ׳¢׳‘׳•׳“׳” ׳—׳“׳©׳” | NavLink | New job ג†’ /jobs/new | ג¬ | ג… | |
| ׳׳§׳•׳—׳•׳× (Clients) | NavLink | Clients ג†’ /clients | ג¬ | ג… | |
| ׳”׳₪׳§׳× ׳—׳©׳‘׳•׳ ׳™׳•׳× | NavLink | New invoice ג†’ /invoices/new | ג¬ | ג… | |
| ׳׳¨׳›׳™׳•׳ ׳—׳©׳‘׳•׳ ׳™׳•׳× | NavLink | Invoice archive ג†’ /invoices/archive | ג¬ | ג… | |
| ׳׳¨׳›׳™׳•׳ ׳׳¡׳׳›׳™׳ | NavLink | Documents ג†’ /documents | ג¬ | ג… | |
| ׳׳¨׳›׳– ׳×׳—׳–׳•׳§׳” | NavLink | Maintenance ג†’ /maintenance | ג¬ | ג… | |
| ׳”׳’׳“׳¨׳•׳× (Settings) | NavLink | Settings ג†’ /settings | ג¬ | ג… | |
| Minimize toggle | Button | Collapse sidebar | ג¬ | ג… | Persists via localStorage theme settings |
| Logout button | Button | Clear session, redirect | ג¬ | ג… | Clears localStorage, redirects to /auth/login |
| User display | Text | Shows current user name | ג¬ | ג… | From localStorage via clientAuth |

---

## 3. DASHBOARD (components/dashboard/dashboard.tsx)

| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Total Clients stat | Card | Count clients | נ¢ | ג… | Via apiClient.getClients() ג†’ /api/clients |
| Active Jobs stat | Card | Count jobs | נ¢ | ג… | Via apiClient.getJobs() ג†’ /api/jobs |
| Workers stat | Card | Count workers | נ¢ | ג… | Via apiClient.getWorkers() ג†’ /api/workers |
| Vehicles stat | Card | Count vehicles | נ¢ | ג… | Via apiClient.getVehicles() ג†’ /api/vehicles |
| Monthly Revenue | Card | Sum paid jobs | נ¢ | ג… | Filters by payment_status="׳©׳•׳׳" ג€” **FIXED 2026-03-03** |
| Pending Jobs | Card | Count pending | נ¢ | ג… | Filters by payment_status="׳׳׳×׳™׳ ׳׳×׳©׳׳•׳" ג€” **FIXED 2026-03-03** |
| New Job button | Link | ג†’ /jobs/new | ג¬ | ג… | |
| New Client button | Link | ג†’ /clients/new | ג¬ | ג… | |
| Recent Jobs list | List | Last 5 jobs | נ¢ | ג ן¸ | Uses job.job_date with optional fallback ג€” OK |

**Issues Found:**
- ~~**CRITICAL**: Dashboard status mismatch~~ ג†’ **FIXED 2026-03-03**: Now uses Hebrew statuses, UI fully translated to Hebrew, RTL layout applied
- ~~Dashboard text is mostly English~~ ג†’ **FIXED 2026-03-03**: All UI text converted to Hebrew

---

## 4. CLIENTS MODULE

### Clients Page (components/clients/clients-page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Search input | Input | Filter by name/contact/city | נ¢ | ג… | Client-side filter on fetched data |
| "׳”׳•׳¡׳£ ׳׳§׳•׳—" button | Button | Open new client modal | ג¬ | ג… | |
| Avg security rate stat | StatsContainer | Calculate avg rate | נ¢ | ג… | Computed from fetched clients |
| Active clients stat | StatsContainer | Count status="active" | נ¢ | ג… | |
| Most active client stat | StatsContainer | Client with most jobs | נ¢ | ג… | Fetches job counts per client via Supabase direct |
| Client card | Card | Display client info | נ¢ | ג… | |
| "׳”׳¢׳×׳§" button | Button | Copy client info to clipboard | ג¬ | ג… | |
| "׳¢׳¨׳•׳" button | Button | Open edit modal | ג¬ | ג… | |
| Status badge | Badge | active/inactive | נ¢ | ג… | |
| Job history toggle | Button | Expand to show last 10 jobs | נ¢ | ג… | Fetches from Supabase direct (not API route) |
|| Delete client | Function | Remove client | נ¢ | ג… | Calls DELETE /api/clients/{id} then updates state ג€” **FIXED 2026-03-03** |

### New Client Modal (components/clients/new-client-modal.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| ׳©׳ ׳”׳—׳‘׳¨׳” * | Input | Company name (required) | נ¢ | ג… | Maps to company_name |
| ׳׳™׳© ׳§׳©׳¨ * | Input | Contact person (required) | נ¢ | ג… | Maps to contact_person |
| ׳“׳•׳"׳ * | Input | Email (required) | נ¢ | ג… | |
| ׳˜׳׳₪׳•׳ * | Input | Phone (required) | נ¢ | ג… | |
| ׳›׳×׳•׳‘׳× | Input | Address | נ¢ | ג… | |
| ׳¢׳™׳¨ | Input | City | נ¢ | ג… | |
| ׳×׳™׳‘׳× ׳“׳•׳׳¨ | Input | PO Box | נ¢ | ג… | Maps to po_box |
|| ׳׳•׳₪׳ ׳×׳©׳׳•׳ | Select | Payment method | נ¢ | ג… | Now stores Hebrew values ("׳׳™׳™׳“׳™", "׳©׳•׳˜׳£ +30" etc) ג€” **FIXED 2026-03-03** |
|| ׳×׳¢׳¨׳™׳£ ׳׳‘׳˜׳—׳” | Input | Security rate | נ¢ | ג… | Label corrected to match DB field ג€” **FIXED 2026-03-03** |
|| ׳×׳¢׳¨׳™׳£ ׳”׳×׳§׳ ׳” | Input | Installation rate | נ¢ | ג… | Label corrected to match DB field ג€” **FIXED 2026-03-03** |
| ׳”׳¢׳¨׳•׳× | Textarea | Notes | נ¢ | ג… | |
| ׳”׳•׳¡׳£ ׳׳§׳•׳— (Submit) | Button | POST /api/clients | נ¢ | ג… | |
| ׳‘׳™׳˜׳•׳ (Cancel) | Button | Close + reset form | ג¬ | ג… | |

### Client Edit Modal (components/clients/client-edit-modal.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Basic Info tab | Form | Edit all basic fields | נ¢ | ג… | Direct Supabase update |
| Rates tab | Form | Work-type-specific rates | נ¡ | ג ן¸ | Fetches /api/clients/{id}/rates ג€” **API route may not exist** |
| Payment Log tab | Form | Monthly payment tracking | נ¡ | ג ן¸ | Fetches /api/clients/{id}/payment-logs ג€” **API route may not exist** |
| "׳”׳•׳¡׳£ ׳×׳¢׳¨׳™׳£" button | Button | Add work type rate row | ג¬ | ג… | |
| "׳”׳•׳¡׳£ ׳¨׳©׳•׳׳”" button | Button | Add payment log entry | ג¬ | ג… | |
| Work type dropdown | Select | Pick work type for rate | נ¢ | ג… | Fetches from /api/work-types |
| Custom rates 1-5 | Input | Custom rate fields | נ¡ | ג ן¸ | Fields custom_rate_1..5 may not exist in DB schema |
| Save button | Button | Submit update | נ¢ | ג… | Uses Supabase direct (not API route) |
| Rate validation | Logic | Require at least 1 rate | ג¬ | ג ן¸ | Forces rate entry even if not needed |

**Issues Found:**
- Client edit uses **direct Supabase** while client create uses **API route** ג€” inconsistent pattern
- /api/clients/{id}/rates and /api/clients/{id}/payment-logs routes likely don't exist (404s silently ignored)
- ~~Delete only removes from React state~~ ג†’ **FIXED 2026-03-03**: Now calls DELETE /api/clients/{id}

---

## 5. JOBS MODULE

### Jobs Page (components/jobs/jobs-page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| "׳¢׳‘׳•׳“׳” ׳—׳“׳©׳”" button | Link | ג†’ /jobs/new | ג¬ | ג… | |
| View mode toggle | Button | Switch grid/list | ג¬ | ג… | Persisted via user preferences API |
| Sort toggle (number/date) | Button | Change sort order | ג¬ | ג… | |
| Revenue stat | Card | Sum total_amount | נ¢ | ג… | |
| Pending jobs stat | Card | Count ׳׳׳×׳™׳/׳‘׳×׳”׳׳™׳ | נ¢ | ג… | |
| Urgent jobs stat | Card | Count ׳“׳—׳•׳£ | נ¢ | ג… | |
| Completed stat | Card | Count ׳”׳•׳©׳׳ | נ¢ | ג… | |
| Status filter | Select | Filter by job status | ג¬ | ג… | |
| Client filter | Select | Filter by client | ג¬ | ג… | Dynamic from loaded jobs |
| Show deleted checkbox | Checkbox | Toggle deleted visibility | נ¢ | ג… | Persisted via user preferences |
| Show finished checkbox | Checkbox | Toggle completed visibility | נ¢ | ג… | Persisted via user preferences |
| Search input | Input | Search jobs | ג¬ | ג… | Client-side filter |
| Job card (expand/collapse) | Card | Show/hide job details | ג¬ | ג… | |
| "׳¢׳¨׳•׳" button | Button | Open edit modal | ג¬ | ג… | |
| "׳׳—׳§" button | Button | Soft-delete job | נ¢ | ג… | PATCH /api/jobs/{id} with is_deleted=true |
| "׳©׳—׳–׳¨" button | Button | Restore deleted job | נ¢ | ג… | PATCH + reassigns job number |
| Status badge | Badge | Shows job_status | נ¢ | ג… | |
| Payment badge | Badge | Shows payment_status | נ¢ | ג… | Only in expanded view |

### New Job Form (components/jobs/new-job-form.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Job number display | Text | Auto-generated | נ¢ | ג… | Fetches all jobs, finds highest active number |
| ׳¡׳•׳’ ׳¢׳‘׳•׳“׳” * | DatabaseDropdown | Work type from DB | נ¢ | ג… | From work_types table |
| ׳×׳׳¨׳™׳ * | Input[date] | Job date | ג¬ | ג… | |
| ׳׳×׳¨ * | Input | Site/location | ג¬ | ג… | |
| ׳¡׳•׳’ ׳׳©׳׳¨׳× * | Select | Day/Night/Double | ג¬ | ג… | Hebrew values: ׳™׳•׳, ׳׳™׳׳”, ׳›׳₪׳•׳ |
| ׳¢׳™׳¨ * | Input | City | ג¬ | ג… | |
| Client type toggle | Buttonֳ—2 | existing/new client | ג¬ | ג… | |
| Existing client dropdown | DatabaseDropdown | Pick from DB | נ¢ | ג… | From clients table |
| New client fields (7 fields) | Inputs | Create client inline | ג¬ | ג ן¸ | **Now auto-creates client via /api/clients — **FIXED 2026-03-03**** ג€” only the name goes to job record |
| ׳¢׳•׳‘׳“ * | DatabaseDropdown | Worker from DB | נ¢ | ג… | From workers table |
| ׳¨׳›׳‘ * | DatabaseDropdown | Vehicle from DB | נ¢ | ג… | From vehicles table |
| ׳¢׳’׳׳” | DatabaseDropdown | Cart from DB (optional) | נ¢ | ג… | From carts table |
| ׳×׳™׳׳•׳¨ | Textarea | Description | ג¬ | ג… | |
| Calendar sync toggle | Switch | Add to Google Calendar | ג¬ | נ”² | **Device-native .ics calendar file on job creation — **FIXED 2026-03-03** |
| "׳™׳¦׳¨ ׳¢׳‘׳•׳“׳”" submit | Button | Insert to DB | נ¢ | ג… | Direct Supabase insert (not API route) |
| "׳׳™׳₪׳•׳¡ ׳˜׳™׳•׳˜׳”" | Button | Clear auto-save + reset | ג¬ | ג… | |
| ׳‘׳™׳˜׳•׳ | Button | Navigate back | ג¬ | ג… | |
| Auto-save | Background | Save draft to localStorage | ג¬ | ג… | SimpleAutoSave with 15-min expiry |

**Issues Found:**
- New job form submits **directly to Supabase** while jobs-page reads via **/api/jobs** ג€” inconsistent
- API route validates shift_type as English ("day","night","double") but form sends Hebrew ("׳™׳•׳","׳׳™׳׳”","׳›׳₪׳•׳") ג€” **form bypasses API route entirely via direct Supabase**
- ~~"New client" mode~~ → **FIXED 2026-03-03**: Auto-creates client via /api/clients`n- ~~Calendar sync toggle~~ → **FIXED 2026-03-03**: Replaced with .ics download

### Edit Job Modal (components/jobs/edit-job-modal.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| All job fields | Form | Edit existing job | נ¢ | ג… | Uses PATCH /api/jobs/{id} |
| Auto status calc | Display | Shows calculated status | ג¬ | ג… | Based on date comparison |
| Payment status | Display | Auto based on job status | ג¬ | ג… | |
| Invoice status | Display | Shows invoice state | ג¬ | ג… | |
| Total amount | Input | Manual entry | נ¢ | ג… | |
| Shift rate | Input | Per-job rate override | נ¢ | ג… | |
| Save button | Button | Submit PATCH | נ¢ | ג… | |

---

## 6. INVOICES MODULE

### Invoices Page (components/invoices/invoices-page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Search input | Input | Filter by number/client | ג¬ | ג… | Client-side |
| Status filter | Select | Filter by status | ג¬ | ג… | |
| Revenue stat | StatsContainer | Sum paid invoices | נ¢ | ג… | |
| Pending stat | StatsContainer | Count "sent" invoices | נ¢ | ג… | |
| Overdue stat | StatsContainer | Count overdue | נ¢ | ג… | |
| "׳”׳•׳¨׳“ PDF" button | Button | Generate PDF download | נ¢ | ג… | Calls /api/invoices/{id}/pdf ג€” **FIXED 2026-03-03** (auth removed) |
| View button | Button | View invoice details | ג¬ | ג… | |

### Invoice API (/api/invoices/route.ts)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
|| GET | API | List invoices | נ¢ | ג… | Uses hardcoded userId pattern ג€” **FIXED 2026-03-03** |
|| POST | API | Create invoice | נ¢ | ג… | Uses hardcoded userId pattern ג€” **FIXED 2026-03-03** |

**Issues Found:**
- ~~**CRITICAL**: Invoice API uses Supabase Auth~~ ג†’ **FIXED 2026-03-03**: All 3 invoice routes (main, pdf, line-items) now use hardcoded userId
- ~~Invoice/Receipt table conflict~~ → **FIXED 2026-03-03**: PDF + line-items unified to "invoices" table

---

## 7. WORKERS MODULE (components/workers/workers-page.tsx)

| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| "׳”׳•׳¡׳£ ׳¢׳•׳‘׳“" button | Link | ג†’ /settings/resources/workers/new | ג¬ | ג… | |
|| Search input | Input | Filter workers | ג¬ | ג… | Hebrew placeholder "׳—׳₪׳© ׳¢׳•׳‘׳“׳™׳..." ג€” **FIXED 2026-03-03** |
| Worker card | Card | Display worker info | נ¢ | ג… | Direct Supabase query |
| Availability badges | Badge | Show available days | נ¢ | ג… | Parsed from JSON availability field |
|| Delete button | Button | Delete worker | נ¢ | ג… | Hebrew confirm dialog + error handling ג€” **FIXED 2026-03-03** |
| Edit button | Link | ג†’ /settings/resources/workers/{id}/edit | ג¬ | ג ן¸ | **Route may not exist** |

**Issues Found:**
- ~~Mixed English/Hebrew UI text~~ ג†’ **FIXED 2026-03-03**: All text translated to Hebrew
- ~~Hard delete with English confirm~~ ג†’ **FIXED 2026-03-03**: Hebrew confirm + error handling
- ~~Edit link returns 404~~ → **FIXED 2026-03-03**: Modal-based editing

---

## 8. VEHICLES MODULE (components/vehicles/vehicles-page.tsx)

| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| "׳”׳•׳¡׳£ ׳¨׳›׳‘" button | Link | ג†’ /settings/resources/vehicles/new | ג¬ | ג… | |
|| Search input | Input | Filter vehicles | ג¬ | ג… | Hebrew placeholder "׳—׳₪׳© ׳¨׳›׳‘׳™׳..." ג€” **FIXED 2026-03-03** |
| Vehicle card | Card | Display vehicle info | נ¢ | ג… | Direct Supabase |
|| Delete button | Button | Delete vehicle | נ¢ | ג… | Hebrew confirm dialog + error handling ג€” **FIXED 2026-03-03** |
| Edit button | Link | ג†’ /settings/resources/vehicles/{id}/edit | ג¬ | ג ן¸ | **Route may not exist** |
|| ~~Sample data fallback~~ | Logic | ~~Shows fake data on DB error~~ | ג¬ | ג… | **FIXED 2026-03-03**: Removed fake fallback, shows empty state on error |

---

## 9. SETTINGS MODULE

### Settings Page (app/settings/page.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
| Resources links | Links | Workers/Vehicles/Carts/Job Types | ג¬ | ג… | |
| Business Info link | Link | ג†’ settings-business-info | ג¬ | ג… | |
| Users link | Link | ג†’ /settings/users | ג¬ | ג… | |

### Business Info (components/settings/settings-business-info.tsx)
| Element | Type | Purpose | DB | Health | Notes |
|---------|------|---------|-----|--------|-------|
|| Business name | Input | Company name | נ¢ | ג… | Loads from /api/business-settings, saves via PUT ג€” **FIXED 2026-03-03** |
|| Business address | Input | Address | נ¢ | ג… | DB-backed via API ג€” **FIXED 2026-03-03** |
|| Business phone | Input | Phone | נ¢ | ג… | DB-backed via API ג€” **FIXED 2026-03-03** |
|| VAT ID | Input | Tax number | נ¢ | ג… | DB-backed via API ג€” **FIXED 2026-03-03** |
|| Business email | Input | Email | נ¢ | ג… | DB-backed via API ג€” **FIXED 2026-03-03** |
|| Bank account fields (4) | Inputs | Banking details | נ¢ | ג… | DB-backed via API ג€” **FIXED 2026-03-03** |
|| Save button | Button | Save to DB via API | נ¢ | ג… | PUT /api/business-settings + localStorage cache |
| Apply to Invoices | Button | Update active invoices | נ”´ | נ”² | **Placeholder only** ג€” shows mock alert |
|| Back to Settings | Button | Navigate back | ג¬ | ג… | Now uses router.push("/settings") ג€” **FIXED 2026-03-03** |

**Issues Found:**
- ~~**All business settings stored in localStorage only**~~ ג†’ **FIXED 2026-03-03**: Now loads/saves via /api/business-settings (Supabase), localStorage as cache
- ~~BusinessSettings interface never used~~ ג†’ **FIXED 2026-03-03**: API route uses business_settings table
- "Apply to Invoices" is completely non-functional
- ~~Uses `createPageUrl` from `@/utils`~~ ג†’ **FIXED 2026-03-03**: Now uses router.push("/settings")

---

## 10. API ROUTES ג€” Cross-Cutting Issues

### Authentication Inconsistency
| Route | Auth Method | Health |
|-------|-----------|--------|
| /api/clients | None (hardcoded userId) | ג ן¸ |
| /api/jobs | None (hardcoded userId) | ג ן¸ |
| /api/workers | Unknown | ג ן¸ |
|| /api/invoices | None (hardcoded userId) | ג… **FIXED** |
| /api/calendar | Unknown | ג ן¸ |
| /api/documents | Unknown | ג ן¸ |

### Data Access Inconsistency
| Component | Data Source | Pattern |
|-----------|-----------|---------|
| Clients list | fetch("/api/clients") | API route |
| Client create | fetch("/api/clients") | API route |
| Client edit | supabase.from("clients").update() | Direct Supabase |
|| Client delete | fetch("/api/clients/{id}") DELETE | API route ג€” **FIXED 2026-03-03** |
| Client job history | supabase.from("jobs") | Direct Supabase |
| Jobs list | fetch("/api/jobs") | API route |
| Job create | supabase.from("jobs").insert() | Direct Supabase |
| Job edit | fetch("/api/jobs/{id}") PATCH | API route |
| Job delete | fetch("/api/jobs/{id}") PATCH | API route |
| Workers list | supabase.from("workers") | Direct Supabase |
| Vehicles list | supabase.from("vehicles") | Direct Supabase |
|| Invoices list | fetch("/api/invoices") | API route ג€” **FIXED 2026-03-03** |

---

## 11. GLOBAL ISSUES SUMMARY

### Critical (must fix before production)
1. ~~**Invoice API requires Supabase Auth but app uses hardcoded auth**~~ ג†’ ג… **FIXED 2026-03-03** (all invoice routes use hardcoded userId)
2. ~~**Dashboard revenue/pending counts always show 0**~~ ג†’ ג… **FIXED 2026-03-03** (Hebrew statuses + full Hebrew UI + RTL)
3. ~~**Client delete doesn't hit database**~~ ג†’ ג… **FIXED 2026-03-03** (now calls DELETE /api/clients/{id})
4. ~~**Business settings only in localStorage**~~ ג†’ ג… **FIXED 2026-03-03** (new /api/business-settings route, DB-backed)

### High Priority
5. **Inconsistent data access patterns** ג†’ mix of API routes and direct Supabase calls
6. **No auth on most API routes** ג†’ any user can access any data
7. ~~**Vehicle page shows fake sample data on DB error**~~ ג†’ ג… **FIXED 2026-03-03**
8. **New client from job form doesn't create client record** ג†’ orphaned client_name strings
9. ~~**Calendar sync toggle**~~ → ✅ **FIXED 2026-03-03** (replaced with .ics download)

### Medium Priority
10. ~~**[v0] debug console.logs throughout codebase**~~ ג†’ ג… **FIXED 2026-03-03** (84 removed across 16 files)
11. ~~**Mixed English/Hebrew UI**~~ ג†’ ג… **FIXED 2026-03-03** (workers + vehicles fully translated)
12. **No edit routes for workers/vehicles** ג†’ edit buttons likely 404
13. ~~**Misleading form labels**~~ ג†’ ג… **FIXED 2026-03-03** (׳×׳¢׳¨׳™׳£ ׳©׳¢׳×׳™ג†’׳×׳¢׳¨׳™׳£ ׳׳‘׳˜׳—׳”, ׳×׳¢׳¨׳™׳£ ׳”׳¢׳¨׳›׳”ג†’׳×׳¢׳¨׳™׳£ ׳”׳×׳§׳ ׳”)
14. ~~**Client edit rate validation**~~ → ✅ **FIXED 2026-03-03** (warning + blocks at job form)
15. ~~**Payment method stores English values**~~ ג†’ ג… **FIXED 2026-03-03** (now stores Hebrew)

### Low Priority / Polish
16. ~~**No loading states**~~ → ✅ **FIXED 2026-03-03** (skeleton loaders)
17. ~~**Confirm dialogs mix English and Hebrew**~~ ג†’ ג… **FIXED 2026-03-03** (workers + vehicles)
18. ~~**Worker availability uses English day names**~~ ג†’ ג… **FIXED 2026-03-03** (now uses ׳׳³, ׳‘׳³, etc)
19. ~~**createPageUrl utility** is a leftover~~ ג†’ ג… **FIXED 2026-03-03** (removed from view-invoice.tsx, function now unused)
20. ~~**Receipt entity**~~ → ✅ **FIXED 2026-03-03** (unified to "invoices" table)

