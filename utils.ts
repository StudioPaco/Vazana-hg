// Utility functions for Vazana Studio

// Create page URLs for navigation
export function createPageUrl(pageName: string, params?: Record<string, string>): string {
  const pageRoutes: Record<string, string> = {
    // Main pages
    Dashboard: "/",
    Clients: "/clients",
    Jobs: "/jobs",
    NewJob: "/jobs/new",
    Workers: "/workers",
    Vehicles: "/vehicles",
    Carts: "/carts",
    Invoices: "/invoices",
    ReceiptArchive: "/invoices",
    Documents: "/documents",

    // Settings pages
    Settings: "/settings",
    SettingsUsers: "/settings/users",
    SettingsBusinessInfo: "/settings/business-info",
    SettingsCarts: "/settings/carts",
    SettingsVehicles: "/settings/vehicles",
    SettingsInvoice: "/settings/invoice",
    SettingsWorkers: "/settings/workers",
    SettingsWorkTypes: "/settings/work-types",
    SettingsAccounts: "/settings/accounts",

    // Invoice pages
    ViewInvoice: "/invoices/view",
    GenerateInvoice: "/invoices/generate",
  }

  let url = pageRoutes[pageName] || `/${pageName.toLowerCase()}`

  // Add query parameters if provided
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  return url
}

// Format currency for display
export function formatCurrency(amount: number, currency = "₪"): string {
  return `${currency}${amount.toFixed(2)}`
}

// Format date for display
export function formatDate(date: string | Date, locale = "he-IL"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString(locale)
}

// Get Hebrew day name
export function getHebrewDayName(dayIndex: number): string {
  const hebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]
  return hebrewDays[dayIndex] || ""
}

// Validate Israeli phone number
export function validateIsraeliPhone(phone: string): boolean {
  const phoneRegex = /^(\+972|0)([23489]|5[0248]|77)[0-9]{7}$/
  return phoneRegex.test(phone.replace(/[-\s]/g, ""))
}

// Validate Israeli VAT ID
export function validateIsraeliVAT(vatId: string): boolean {
  const vatRegex = /^[0-9]{9}$/
  return vatRegex.test(vatId)
}

// Generate random ID (fallback if needed)
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Parse worker availability JSON
export function parseWorkerAvailability(availabilityJson: string): Record<string, { day: boolean; night: boolean }> {
  try {
    return JSON.parse(availabilityJson)
  } catch {
    return {
      sun: { day: true, night: true },
      mon: { day: true, night: true },
      tue: { day: true, night: true },
      wed: { day: true, night: true },
      thu: { day: true, night: true },
      fri: { day: false, night: false },
      sat: { day: false, night: false },
    }
  }
}

// Calculate invoice totals
export function calculateInvoiceTotals(lineItems: Array<{ amount: number }>, vatRate = 0.18) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const vatAmount = subtotal * vatRate
  const total = subtotal + vatAmount

  return {
    subtotal,
    vatAmount,
    total,
  }
}

// Get payment status in Hebrew
export function getHebrewPaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "ממתין",
    paid: "שולם",
    overdue: "לתשלום",
    cancelled: "בוטל",
  }
  return statusMap[status] || status
}

// Get English payment status
export function getEnglishPaymentStatus(hebrewStatus: string): string {
  const statusMap: Record<string, string> = {
    ממתין: "pending",
    שולם: "paid",
    לתשלום: "overdue",
    בוטל: "cancelled",
  }
  return statusMap[hebrewStatus] || hebrewStatus
}
