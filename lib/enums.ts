/**
 * Shared constants that NEVER change (structural, code-level).
 * For configurable statuses (payment, invoice, client) use lib/status-options.ts
 * which reads from the status_options DB table.
 */

// --- Shift Types (structural — tied to scheduling logic) ---
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

// --- Job Statuses (calculated from date — not user-configurable) ---
export const JOB_STATUS = {
  COMPLETED: "הושלם",
  IN_PROGRESS: "בתהליך",
  PENDING: "ממתין",
} as const

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS]

// --- User Roles (structural — tied to auth logic) ---
export const USER_ROLE = {
  OWNER: "owner",
  ADMIN: "admin",
  STAFF: "staff",
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

// --- Payment Methods (structural — tied to payment terms calculation) ---
export const PAYMENT_METHOD: Record<string, string> = {
  "1": "מיידי",
  "2": "שוטף +15",
  "3": "שוטף +30",
  "4": "שוטף +60",
  "5": "שוטף +90",
}
