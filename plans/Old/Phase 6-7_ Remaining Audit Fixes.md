# \[ARCHIVED\] Phase 6\-7: Remaining Audit Fixes
All items completed per PROGRESS\_LOG\.md\.
## Fix \#8 — Auto\-create client from job form
**File:** `components/jobs/new-job-form.tsx` \(lines 206\-265\)
In `handleSubmit`, when `clientType === "new"`, insert the collected fields into the `clients` table before creating the job\. Use the returned client ID as `client_id` on the job record\. Fields to insert: `company_name` \(clientName\), `contact_person` \(clientPhone field — mislabeled but maps to contact\), `email` \(clientEmail\), `address` \(clientAddress\), `city` \(clientCity\), `po_box` \(clientPostalCode\), `payment_terms` \(clientPaymentTerms\)\. On failure, show error and abort job creation\.
## Fix \#9 — Replace Google Calendar with \.ics download
**Changes:**
1. Create `lib/ics-calendar.ts` — utility that generates an `.ics` string from job data \(VCALENDAR/VEVENT format\)\. Handles Hebrew shift types \(יום/לילה/כפול\) for start/end times\. Returns a downloadable Blob URL\.
2. `components/jobs/new-job-form.tsx` — after successful job creation, if `calendarSync` is true, trigger `.ics` download\. Change label from "הוסף ליומן גוגל" to "הוסף ליומן המכשיר"\.
3. `components/jobs/edit-job-modal.tsx` — same: change label, add \.ics download button\.
4. Delete `lib/calendar-service.ts` and `app/api/calendar/route.ts` — dead code\.
5. Update `new-job-form.tsx` calendar card text to reflect device\-native calendar\.
## Fix \#12 — Worker & Vehicle edit modals
**New files:**
1. `components/workers/worker-edit-modal.tsx` — Dialog modal matching the `/new` page fields \(name\*, phone\*, address, shift\_rate, availability, payment\_terms\_days, notes\)\. Loads current worker data, saves via direct Supabase update\. Uses `getModalClasses('lg', true)` for styling\.
2. `components/vehicles/vehicle-edit-modal.tsx` — Dialog modal with fields \(name\*, license\_plate\*, details\)\. Same pattern\.
**Modified files:**
3. `components/workers/workers-page.tsx` — Replace edit `<Link>` with `<Button onClick>` that opens `WorkerEditModal`\. Add state for `editingWorker` and `editModalOpen`\. On save, update the workers list in state\.
4. `components/vehicles/vehicles-page.tsx` — Same pattern for vehicles\.
## Fix \#14 — Client rate validation hybrid
**File:** `components/clients/client-edit-modal.tsx`
1. Remove the hard blocker in `handleSubmit` \(lines 196\-200\)\. Allow saving without rates\.
2. Show a warning dialog when saving without rates: "לקוח זה לא יהיה פעיל לשיוך עבודות עד שיוגדר תעריף ברירת מחדל לפחות לסוג עבודה אחד\. להמשיך?"
3. If confirmed, save\. If not, stay on form\.
**File:** `components/jobs/new-job-form.tsx`
When selecting an existing client, check if client has at least one rate > 0 \(security\_rate or installation\_rate from the clients data already fetched\)\. If no rates, show warning: "ללקוח זה לא הוגדרו תעריפים\. הגדר תעריף לפני שיוך לעבודה" and prevent job submission\.
## Fix \#16 — Skeleton loaders for modals
Replace generic loading states in `client-edit-modal.tsx` data loading with Skeleton components from `@/components/ui/skeleton`\. Apply to the rates tab and payment log tab while data loads\.
## Fix \#20 — Unify receipts → invoices
**File:** `app/api/invoices/[id]/pdf/route.ts`
Change `.from("receipts")` → `.from("invoices")`\. Map field names: `receipt_number` → `invoice_number`, `receipt_id` → `invoice_id`\. Keep the query structure the same\.
**File:** `app/api/invoices/[id]/line-items/route.ts`
Remove the "receipts" fallback \(lines 31\-87\)\. Only read from `invoice_line_items`\. If no line items found, return empty array \(not 404\)\.
**File:** `app/api/jobs/[id]/route.ts`
Check if `receipt_id` field reference needs updating to `invoice_id`\.
**Verify:** Check if `receipts` table has data before removing references — if it does, note it for migration\.