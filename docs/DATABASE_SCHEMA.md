# Vazana — Database Schema Reference

> Supabase PostgreSQL. Project: `udxvtbwqmfwzghmubfdi`
> All tables have RLS enabled. 12 migrations applied.

## Conventions

| Convention | Value |
|-----------|-------|
| Primary Keys | UUID (`gen_random_uuid()`) |
| Timestamps | `created_date`, `updated_date` (TIMESTAMPTZ) |
| Soft Delete | `is_deleted` boolean (jobs) |
| Sample Flag | `is_sample` boolean |
| Currency | ILS (₪), stored as DECIMAL |
| VAT | 17% (Israeli standard) |
| Naming | snake_case for columns |

## Core Tables

### clients
id, company_name, contact_person, phone, email, address, city, po_box, payment_method, security_rate, installation_rate, current_job_rate, notes, status, created_date, updated_date, created_by, is_sample

### jobs
id, job_number, client_id, client_name, job_date, work_type, shift_type (day/night/double), site, city, service_description, worker_id, worker_name, cart_id, cart_name, vehicle_id, vehicle_name, job_specific_shift_rate, total_amount, payment_status, receipt_id, notes, add_to_calendar, is_deleted, created_date, updated_date, created_by, is_sample

### workers
id, name, phone_number, address, shift_rate, payment_terms_days, availability (JSONB), notes, created_date, updated_date, created_by, is_sample

### vehicles
id, name, license_plate, details, created_date, updated_date, created_by, is_sample

### carts
id, name, details, created_date, updated_date, created_by, is_sample

### work_types
id, name_en, name_he, created_date, updated_date, created_by, is_sample

## Financial Tables

### invoices
id, invoice_number, client_id, total_amount, status, invoice_date, due_date, notes, created_date, updated_date

### invoice_line_items
id, invoice_id (FK→invoices), job_id, description, quantity, unit_price, line_total, work_type, job_date, site_location

### receipts
id, receipt_number, client_id, total_amount, status, issue_date, due_date, notes, created_date, updated_date, created_by, is_sample

## Client Extension Tables

### client_work_type_rates
id, client_id (FK→clients), work_type_id (FK→work_types), rate DECIMAL, created_at, updated_at
UNIQUE(client_id, work_type_id)

### client_payment_logs
id, client_id (FK→clients), month TEXT (YYYY-MM), invoice_sent, invoice_sent_date, payment_received, payment_received_date, amount DECIMAL, notes, created_at, updated_at
UNIQUE(client_id, month)

## Auth Tables

### user_profiles
id, username, email, full_name, password_hash, role (owner/admin/staff), is_active, permissions, last_login, created_at, updated_at

### user_sessions
id, user_id, session_token, expires_at, created_at

### user_roles
(RLS-managed role assignments)

## Config Tables

### business_settings
company_name, company_email, registration_number, address, phone, vat_percentage, auto_invoice_sync, day_shift_end_time, night_shift_end_time, bank_account_name, bank_name, bank_branch, bank_account_number

### user_preferences
id, user_id (UNIQUE), show_deleted_jobs, show_finished_jobs, add_to_calendar_default, jobs_view_mode, default_status_filter, default_client_filter, created_at, updated_at

## Other Tables

### documents
id, filename, file_path, file_size, mime_type, entity_type, entity_id, uploaded_by

### maintenance_logs
id, timestamp, level, message, component, details (JSONB), session_user

### audit_log
(System activity tracking — 16 rows)

### schema_migrations
(Tracks applied migrations — 12 rows)

## Row Counts (2026-03-24)

| Table | Rows |
|-------|------|
| user_profiles | 3 |
| clients | 4 |
| jobs | 12 |
| workers | 5 |
| vehicles | 4 |
| carts | 3 |
| work_types | 4 |
| client_work_type_rates | 5 |
| invoices | 0 |
| maintenance_logs | 0 |
