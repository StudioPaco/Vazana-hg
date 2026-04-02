/**
 * Shared enum constants used across the application.
 * Single source of truth for status values, shift types, etc.
 */

// --- Payment Statuses ---
export const PAYMENT_STATUS = {
  PENDING: "ממתין לתשלום",
  PAID: "שולם",
  OVERDUE: "מאוחר",
  NOT_APPLICABLE: "לא רלוונטי",
} as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  PAYMENT_STATUS.PENDING,
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.OVERDUE,
  PAYMENT_STATUS.NOT_APPLICABLE,
]

// --- Shift Types ---
export const SHIFT_TYPE = {
  DAY: "יום",
  NIGHT: "לילה",
  DOUBLE: "כפול",
} as const

export type ShiftType = (typeof SHIFT_TYPE)[keyof typeof SHIFT_TYPE]

export const SHIFT_TYPE_OPTIONS: ShiftType[] = [
  SHIFT_TYPE.DAY,
  SHIFT_TYPE.NIGHT,
  SHIFT_TYPE.DOUBLE,
]

// --- Job Statuses (calculated from date) ---
export const JOB_STATUS = {
  COMPLETED: "הושלם",
  IN_PROGRESS: "בתהליך",
  PENDING: "ממתין",
} as const

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS]

// --- Invoice Statuses ---
export const INVOICE_STATUS = {
  DRAFT: "טיוטה",
  SENT: "נשלח",
  PAID: "שולם",
  CANCELLED: "בוטל",
} as const

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS]

// --- User Roles ---
export const USER_ROLE = {
  OWNER: "owner",
  ADMIN: "admin",
  STAFF: "staff",
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

// --- Payment Methods ---
export const PAYMENT_METHOD: Record<string, string> = {
  "1": "מיידי",
  "2": "שוטף +15",
  "3": "שוטף +30",
  "4": "שוטף +60",
  "5": "שוטף +90",
}
