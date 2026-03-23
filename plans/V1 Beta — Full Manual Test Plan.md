# V1 Beta — Full Manual Test Plan
Site: [https://vazana\\\.vercel\\\.app](https://vazana.vercel.app)
## DB State \(verified 2026\-03\-14\)
* business\_settings: 1 row \(וזאנה אבטחת כבישים, david\.vazana13@gmail\.com\) ✅
* user\_profiles: 3 users \(owner: amitkorach@gmail\.com, staff: david\.vazana13, hanny22258\) ✅
* clients: 3 rows ✅
* vehicles: 4 rows ✅
* workers: 5 rows ✅
* carts: 3 rows ✅
* work\_types: 4 rows ✅
* jobs: 10 rows ✅
* invoices: 0 \(empty — needs first creation test\)
* maintenance\_logs: 0 \(empty — will populate during testing\)
* documents: 0 \(empty\)
## API Routes \(verified via curl — all return 401 without auth ✅\)
All 14 routes respond correctly: /api/auth/profile, /api/users, /api/clients, /api/jobs, /api/vehicles, /api/workers, /api/carts, /api/work\-types, /api/invoices, /api/maintenance\-logs, /api/documents, /api/business\-settings, /api/notifications, /api/user\-preferences
## Architecture note
Pages using API routes \(server\-side auth\): Jobs, Clients, Invoices, Documents, Users, Auth
Pages using browser Supabase \(client\-side session\): Dashboard, Vehicles, Workers, Carts, Work Types, Business Settings, Maintenance, Job Form dropdowns
Both should work after login since browser Supabase client picks up session cookies\. Business settings save confirmed working\.
***
# TEST 1 — Auth: Login
**Page:** /auth/login
**Steps:**
1. Open [https://vazana\\\.vercel\\\.app](https://vazana.vercel.app) in incognito browser
2. Verify login page loads \(no infinite spinner\)
3. Try empty submit → expect validation error
4. Try wrong password → expect error message \(in Hebrew\)
5. Login with amitkorach@gmail\.com \+ correct password
6. Expect redirect to dashboard \(/\)
**Expected:** Dashboard loads with sidebar, no errors in console
**PASS/FAIL:** \_\_\_
***
# TEST 2 — Dashboard: Data loads
**Page:** / \(after login\)
**Steps:**
1. Verify "approaching jobs" section shows jobs \(if any within 7 days\)
2. Verify client stats widget shows: totalClients=3
3. Check browser console \(F12\) for any red errors
4. Verify sidebar navigation links all work
**Expected:** Dashboard renders, stats populate \(may show 0 for some\), no JS errors
**PASS/FAIL:** \_\_\_
***
# TEST 3 — Jobs List
**Page:** /jobs
**Steps:**
1. Navigate to Jobs from sidebar
2. Verify 10 jobs appear in the list \(some may be filtered by preferences\)
3. Use search bar — type a client name → verify filtering works
4. Use status filter dropdown → verify filtering works
5. Click a job row to expand it → verify details show
6. Test sort by number / sort by date
**Expected:** All 10 jobs visible \(unless hidden by show\_finished\_jobs pref\), search/filter functional
**PASS/FAIL:** \_\_\_
***
# TEST 4 — Create New Job
**Page:** /jobs/new
**Steps:**
1. Click "עבודה חדשה" \(New Job\) button
2. Verify job number auto\-increments \(should show 0011 since 10 exist\)
3. **CRITICAL:** Verify ALL dropdowns load data:
    * סוג עבודה \(work type\): should show 4 types
    * עובד \(worker\): should show 5 workers
    * רכב \(vehicle\): should show 4 vehicles
    * עגלה \(cart\): should show 3 carts
    * לקוח קיים \(existing client\): should show 3 clients
4. Fill in ALL required fields:
    * Select work type
    * Pick today's date
    * Enter site: "אתר בדיקות"
    * Select shift type: "יום"
    * Enter city: "תל אביב"
    * Select existing client
    * Select worker
    * Select vehicle
5. Submit → expect success alert and redirect to /jobs
6. Verify new job appears in jobs list as \#0011
**Expected:** All dropdowns populated, job created in DB, redirected to list
**PASS/FAIL:** \_\_\_
***
# TEST 5 — Edit Job
**Page:** /jobs \(click edit on any job\)
**Steps:**
1. Click the edit icon \(pencil\) on any job
2. Verify edit modal opens with job data pre\-filled
3. Change the city to "חיפה"
4. Change the shift type
5. Save → expect success message
6. Verify the change appears in the jobs list
**Expected:** Modal loads with correct data, edits persist
**PASS/FAIL:** \_\_\_
***
# TEST 6 — Delete & Restore Job
**Page:** /jobs
**Steps:**
1. Click delete \(trash icon\) on the TEST job created in Test 4
2. Confirm the delete dialog
3. Verify job disappears from list \(soft delete: is\_deleted=true\)
4. Go to Settings > General > toggle "Show deleted jobs"
5. Return to /jobs → verify deleted job appears with restore option
6. Click restore → verify job returns to active list
**Expected:** Soft delete works, restore works, job number updates on restore
**PASS/FAIL:** \_\_\_
***
# TEST 7 — Clients List
**Page:** /clients
**Steps:**
1. Navigate to Clients from sidebar
2. Verify 3 clients appear
3. Search by company name → verify filtering
4. Verify stats header shows: active clients count, average rate
5. Click expand on a client → verify job history loads
**Expected:** 3 clients visible, search works, stats populated
**PASS/FAIL:** \_\_\_
***
# TEST 8 — Create New Client
**Page:** /clients \(click "לקוח חדש"\)
**Steps:**
1. Click "לקוח חדש" button
2. Fill in:
    * שם חברה: "חברת בדיקות"
    * איש קשר: "יוסי ישראלי"
    * טלפון: "050\-1234567"
    * אימייל: "test@test\.com"
    * עיר: "ירושלים"
    * תעריף אבטחה: 100
3. Save
4. Verify new client appears in list \(should now be 4 clients\)
**Expected:** Client created, appears in list
**PASS/FAIL:** \_\_\_
***
# TEST 9 — Edit Client
**Page:** /clients \(click edit on "חברת בדיקות"\)
**Steps:**
1. Click edit on the test client
2. Change phone to "050\-9876543"
3. Change security rate to 150
4. Save
5. Verify changes visible in client card
**Expected:** Edits persist and display correctly
**PASS/FAIL:** \_\_\_
***
# TEST 10 — Delete Client
**Page:** /clients
**Steps:**
1. Click delete on "חברת בדיקות" \(test client\)
2. Confirm delete
3. Verify client removed from list \(back to 3 clients\)
**Expected:** Client deleted from list and DB
**PASS/FAIL:** \_\_\_
***
# TEST 11 — Vehicles Page
**Page:** /vehicles
**Steps:**
1. Navigate to Vehicles from sidebar
2. Verify 4 vehicles appear with license plates and names
3. Search for a vehicle
4. Click Edit on any vehicle → change a detail → Save
5. Verify edit persists
6. Click "הוסף רכב" → add test vehicle \(name: "רכב בדיקה", plate: "000\-00\-000"\)
7. Verify new vehicle appears \(5 total\)
8. Delete the test vehicle → verify back to 4
**Expected:** Full CRUD works on vehicles
**PASS/FAIL:** \_\_\_
***
# TEST 12 — Workers Page
**Page:** /workers
**Steps:**
1. Navigate to Workers from sidebar
2. Verify 5 workers appear with names and phone numbers
3. Search for a worker
4. Click Edit on any worker → change shift\_rate → Save
5. Verify edit persists
6. Add new worker: "עובד בדיקה", phone: "050\-0000000", rate: 200
7. Verify 6 workers shown
8. Delete test worker → verify back to 5
**Expected:** Full CRUD works on workers
**PASS/FAIL:** \_\_\_
***
# TEST 13 — Carts Page
**Page:** /carts
**Steps:**
1. Navigate to Carts from sidebar
2. Verify 3 carts appear
3. Add new cart: "עגלת בדיקה"
4. Verify 4 carts shown
5. Delete test cart → verify back to 3
**Expected:** Full CRUD works on carts
**PASS/FAIL:** \_\_\_
***
# TEST 14 — Settings: General Tab
**Page:** /settings?tab=general
**Steps:**
1. Navigate to Settings from sidebar
2. Verify General tab is active
3. Toggle dark/light mode → verify UI changes
4. Change font size slider → verify text changes
5. Toggle "show deleted jobs" → verify persists after page reload
6. Toggle "show finished jobs" → verify persists
**Expected:** All preferences save and persist \(stored in localStorage/user\_preferences DB\)
**PASS/FAIL:** \_\_\_
***
# TEST 15 — Settings: Business Info Tab
**Page:** /settings?tab=business
**Steps:**
1. Switch to Business tab
2. Verify current data loads: company name "וזאנה אבטחת כבישים", email, phone, registration, address
3. Change phone number to a test value
4. Click Save button → expect success message
5. Refresh page → verify the change persisted
6. Revert phone back to original
**Expected:** Business data loads from DB, saves correctly, persists
**PASS/FAIL:** \_\_\_
***
# TEST 16 — Settings: Users Tab
**Page:** /settings?tab=users
**Steps:**
1. Switch to Users tab
2. Verify 3 users appear:
    * Amit Korach \(owner\)
    * דוד וזאנה \(staff\)
    * חני קורח \(staff\)
3. Click "הוסף משתמש" \(Add User\)
4. Test validation: leave fields empty and submit → expect RED inline error \(NOT browser alert\)
5. Enter bad email "notanemail" → expect inline error
6. Enter short password "abc" → expect inline error
7. Enter password without uppercase "abcdefgh" → expect inline error
8. Fill valid data: email=test@test\.com, name=Test User, password=TestPass123, role=staff
9. Submit → expect GREEN inline success message, dialog auto\-closes
10. Verify 4 users now shown
11. Click Edit on test user → change phone → Save → verify
12. Click Delete on test user → confirm → verify 3 users remain
**Expected:** Inline validation works \(no browser alert popups\), full CRUD works
**PASS/FAIL:** \_\_\_
***
# TEST 17 — Settings: Resources Tab
**Page:** /settings?tab=resources
**Steps:**
1. Switch to Resources tab
2. Verify counts shown for Workers, Vehicles, Carts, Job Types
3. Click each resource link → verify opens correct management page
**Expected:** Counts accurate, links navigate correctly
**PASS/FAIL:** \_\_\_
***
# TEST 18 — Settings: Work Types \(Job Types\)
**Page:** /settings/resources/job\-types
**Steps:**
1. Navigate to Job Types settings
2. Verify 4 work types appear
3. Add new type: "סוג עבודה בדיקה"
4. Verify 5 types shown
5. Delete test type → verify back to 4
**Expected:** CRUD on work\_types works
**PASS/FAIL:** \_\_\_
***
# TEST 19 — Invoices Page
**Page:** /invoices
**Steps:**
1. Navigate to Invoices from sidebar
2. Verify empty state shows "no invoices" message \(0 in DB\)
3. Click "חשבונית חדשה" → navigate to /invoices/new
4. Verify client dropdown loads
5. Select a client, set date, add a line item
6. Save → verify invoice appears in list
7. Click download PDF on the invoice → verify PDF generates
**Expected:** Invoice creation flow works end\-to\-end
**PASS/FAIL:** \_\_\_
***
# TEST 20 — Maintenance Page
**Page:** /maintenance
**Steps:**
1. Navigate to Maintenance from sidebar
2. Verify access granted \(owner/admin only\)
3. Click "Run System Check" button
4. Verify check completes: Database, API endpoints, Auth
5. Verify logs populate in real\-time
6. Click Export Logs → verify JSON file downloads
**Expected:** System checks pass, logs work, export works
**PASS/FAIL:** \_\_\_
***
# TEST 21 — Auth: Logout
**Steps:**
1. Click logout button in sidebar
2. Verify redirect to /auth/login
3. Try accessing /jobs directly → verify redirect to login
**Expected:** Session cleared, protected routes redirect to login
**PASS/FAIL:** \_\_\_
***
# TEST 22 — Auth: Staff Login Permissions
**Steps:**
1. Login as david\.vazana13@gmail\.com \(staff role\)
2. Navigate to /jobs → verify jobs load
3. Navigate to /settings?tab=users → verify Add User button NOT visible \(staff only sees own profile\)
4. Navigate to /maintenance → verify access denied or restricted
5. Logout
**Expected:** Staff has read access to all data, limited write/admin access
**PASS/FAIL:** \_\_\_
***
# TEST 23 — Data Export/Import
**Page:** /settings?tab=data
**Steps:**
1. Switch to Data tab in Settings
2. Click Export → verify JSON download with all data
3. Verify exported file contains clients, jobs, workers, vehicles, carts
**Expected:** Export contains valid JSON with real DB data
**PASS/FAIL:** \_\_\_
***
# TEST 24 — Documents Page
**Page:** /documents
**Steps:**
1. Navigate to Documents from sidebar
2. Verify page loads \(may show empty state\)
3. Test upload functionality if available
**Expected:** Page loads without errors
**PASS/FAIL:** \_\_\_
***
# TEST 25 — Calendar Page
**Page:** /calendar
**Steps:**
1. Navigate to Calendar from sidebar
2. Verify "coming soon" placeholder shows \(this is expected\)
**Expected:** Placeholder page loads correctly
**PASS/FAIL:** \_\_\_
***
# TEST 26 — Cross\-Browser / Mobile Responsiveness
**Steps:**
1. Open site on mobile phone browser
2. Verify sidebar collapses/works on mobile
3. Verify RTL layout is correct throughout
4. Verify forms are usable on mobile
**Expected:** Responsive design works, RTL correct
**PASS/FAIL:** \_\_\_
***
# Known Issues / Risks
1. The `new-job-form.tsx` handleSubmit \(line 290\) uses browser Supabase `.insert()` directly instead of an API route — this works only if the browser session is active
2. Vehicles/Workers/Carts pages use browser Supabase directly — confirmed working with active session, but if session expires these pages will show empty
3. `carts-page.tsx` has some English text that should be Hebrew \("Search carts\.\.\.", "No carts found", "Details:", "Edit"\)
4. The `notifications` table doesn't exist in DB — the /api/notifications route will fail
5. `client_rates` and `payment_logs` tables don't exist — related features will fail
6. `invoice_line_items` table exists but is empty
***
# Post\-Testing Cleanup
After all tests pass, delete any test data created during testing:
* Delete test job \#0011 \(if created\)
* Delete test client "חברת בדיקות" \(if created\)
* Delete test vehicle "רכב בדיקה" \(if created\)
* Delete test worker "עובד בדיקה" \(if created\)
* Delete test cart "עגלת בדיקה" \(if created\)
* Delete test user test@test\.com \(if created\)
