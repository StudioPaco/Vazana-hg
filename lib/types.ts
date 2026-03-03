/**
 * TypeScript interfaces for Supabase database tables.
 * Derived from scripts/01-create-tables.sql and migration files.
 */

export interface Client {
  id: string
  company_name: string
  contact_person?: string
  phone?: string
  address?: string
  city?: string
  po_box?: string
  email?: string
  payment_method?: string
  security_rate?: number
  installation_rate?: number
  current_job_rate?: number
  notes?: string
  status?: string
  created_date?: string
  updated_date?: string
  created_by_id?: string
  created_by?: string
  is_sample?: boolean
}

export interface Job {
  id: string
  job_number: string
  client_id?: string
  client_name?: string
  job_date?: string
  work_type?: string
  shift_type?: "day" | "night"
  site?: string
  city?: string
  service_description?: string
  worker_id?: string
  worker_name?: string
  cart_id?: string
  cart_name?: string
  vehicle_id?: string
  vehicle_name?: string
  job_specific_shift_rate?: number
  total_amount?: number
  payment_status?: "ממתין לתשלום" | "שולם" | "מאוחר"
  receipt_id?: string
  notes?: string
  add_to_calendar?: boolean
  created_date?: string
  updated_date?: string
  created_by_id?: string
  created_by?: string
  is_sample?: boolean
}

export interface Worker {
  id: string
  name: string
  phone_number?: string
  address?: string
  shift_rate?: number
  payment_terms_days?: number
  availability?: Record<string, { day: boolean; night: boolean }>
  notes?: string
  created_date?: string
  updated_date?: string
  created_by_id?: string
  created_by?: string
  is_sample?: boolean
}

export interface Vehicle {
  id: string
  name: string
  license_plate?: string
  details?: string
  created_date?: string
  updated_date?: string
  created_by_id?: string
  created_by?: string
  is_sample?: boolean
}

export interface Cart {
  id: string
  name: string
  details?: string
  created_date?: string
  updated_date?: string
  created_by_id?: string
  created_by?: string
  is_sample?: boolean
}

export interface WorkType {
  id: string
  name_en: string
  name_he: string
  created_date?: string
  updated_date?: string
  created_by_id?: string
  created_by?: string
  is_sample?: boolean
}

export interface Receipt {
  id: string
  receipt_number?: string
  client_id?: string
  total_amount?: number
  status?: string
  issue_date?: string
  due_date?: string
  notes?: string
  created_date?: string
  updated_date?: string
  created_by_id?: string
  created_by?: string
  is_sample?: boolean
}

export interface UserProfile {
  id: string
  username: string
  password_hash?: string
  full_name?: string
  email?: string
  role?: string
  is_active?: boolean
  permissions?: Record<string, unknown>
  last_login?: string
  created_at?: string
  updated_at?: string
}

export interface BusinessSettings {
  id: string
  company_name?: string
  company_email?: string
  registration_number?: string
  address?: string
  phone?: string
  vat_percentage?: number
  auto_invoice_sync?: boolean
  day_shift_end_time?: string
  night_shift_end_time?: string
  bank_account_name?: string
  bank_name?: string
  bank_branch?: string
  bank_account_number?: string
  created_at?: string
  updated_at?: string
}

export interface Document {
  id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  entity_type: "job" | "client" | "invoice" | "general"
  entity_id?: string
  uploaded_by?: string
  created_at: string
  updated_at?: string
}
