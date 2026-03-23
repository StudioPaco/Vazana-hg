# Job Import from Excel
## Problem
User needs to bulk\-import jobs from an Excel file\. Currently jobs can only be created one at a time\.
## Current State
* Jobs API POST at `app/api/jobs/route.ts` validates required fields: `work_type`, `job_date`, `shift_type`, `site`, `city`, `client_name`, `worker_name`, `worker_id`, `vehicle_name`, `vehicle_id`
* `shift_type` must be `day`/`night`/`double`; `payment_status` must be one of 4 Hebrew values
* Jobs page toolbar \(`components/jobs/jobs-page.tsx:344-397`\) has "עבודה חדשה", view toggle, sort toggle
* No xlsx library installed yet
* Existing modal pattern: `Dialog`/`DialogContent` from radix, `getModalClasses()` from `lib/modal-utils.ts`
* Reference data \(clients, workers, vehicles, work types, carts\) already loaded via hooks in `new-job-form.tsx`
## Proposed Changes
### 1\. Install `xlsx` \(SheetJS\)
`npm install xlsx` — lightweight, client\-side Excel read/write, no server dependency\.
### 2\. Create `lib/jobs-import-utils.ts`
Pure utility functions:
* **Template column definitions** — array defining each column with: DB field name, Hebrew header, required flag, validation function
* **`generateTemplate()`** — creates an empty `.xlsx` with Hebrew column headers, mandatory columns colored orange, and a legend row\. Columns:
    * סוג עבודה\* \(work\_type\)
    * תאריך\* \(job\_date, format YYYY\-MM\-DD\)
    * סוג משמרת\* \(shift\_type: יום/לילה/כפול\)
    * אתר\* \(site\)
    * עיר\* \(city\)
    * שם לקוח\* \(client\_name\)
    * שם עובד\* \(worker\_name\)
    * רכב\* \(vehicle\_name — license plate or name\)
    * עגלה \(cart\_name, optional\)
    * תעריף למשמרת \(job\_specific\_shift\_rate, optional\)
    * סכום כולל \(total\_amount, optional\)
    * תיאור \(service\_description, optional\)
    * הערות \(notes, optional\)
* **`parseAndValidateFile(file, lookups)`** — reads uploaded xlsx, resolves names → IDs using lookup maps \(clients, workers, vehicles, carts\), validates each row\. Returns `{ validRows: JobData[], errors: { row: number, field: string, message: string }[] }`
### 3\. Create `components/jobs/import-jobs-modal.tsx`
Three\-step modal:
* **Step 1 — Upload/Download**: Two buttons — "הורד תבנית ריקה" \(download template\) and file dropzone/input for upload
* **Step 2 — Preview**: Table showing validation results\. Valid rows get ✓, error rows get ✗ with per\-field error details\. Summary: "X תקינות, Y שגויות"\. Two action buttons: "ייבא X עבודות תקינות" and "בטל"
* **Step 3 — Result**: Summary of imported jobs count, with any server\-side errors listed
The modal fetches reference data \(clients, workers, vehicles, work types, carts\) via the existing API endpoints to build lookup maps for name→ID resolution\.
### 4\. Create `app/api/jobs/import/route.ts`
Bulk POST endpoint\. Accepts `{ jobs: JobData[] }` \(pre\-validated array\)\. Inserts via `supabase.from('jobs').insert(jobs).select()`\. Returns `{ imported: number, errors: { row: number, error: string }[] }` for any rows that failed at DB level\.
### 5\. Wire into `jobs-page.tsx`
* Add `Upload` icon import from lucide
* Add "ייבוא מקובץ" button next to "עבודה חדשה"
* Add `<ImportJobsModal>` with open state
* After successful import, refresh job list
