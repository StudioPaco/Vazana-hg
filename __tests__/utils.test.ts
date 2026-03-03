import { describe, it, expect } from "vitest"
import {
  formatCurrency,
  formatDate,
  getHebrewDayName,
  validateIsraeliPhone,
  calculateInvoiceTotals,
  getHebrewPaymentStatus,
  createPageUrl,
} from "@/utils"

describe("formatCurrency", () => {
  it("formats with default shekel symbol", () => {
    expect(formatCurrency(100)).toBe("₪100.00")
  })

  it("formats decimal amounts", () => {
    expect(formatCurrency(99.5)).toBe("₪99.50")
  })
})

describe("createPageUrl", () => {
  it("maps known page names to routes", () => {
    expect(createPageUrl("Dashboard")).toBe("/")
    expect(createPageUrl("Jobs")).toBe("/jobs")
    expect(createPageUrl("Clients")).toBe("/clients")
    expect(createPageUrl("Settings")).toBe("/settings")
  })

  it("appends query params", () => {
    expect(createPageUrl("Jobs", { id: "123" })).toBe("/jobs?id=123")
  })

  it("falls back to lowercase for unknown pages", () => {
    expect(createPageUrl("Unknown")).toBe("/unknown")
  })
})

describe("getHebrewDayName", () => {
  it("returns correct Hebrew day names", () => {
    expect(getHebrewDayName(0)).toBe("ראשון")
    expect(getHebrewDayName(6)).toBe("שבת")
  })
})

describe("validateIsraeliPhone", () => {
  it("accepts valid phone numbers", () => {
    expect(validateIsraeliPhone("050-1234567")).toBe(true)
    expect(validateIsraeliPhone("0521234567")).toBe(true)
  })

  it("rejects invalid phone numbers", () => {
    expect(validateIsraeliPhone("123")).toBe(false)
    expect(validateIsraeliPhone("")).toBe(false)
  })
})

describe("calculateInvoiceTotals", () => {
  it("calculates subtotal, vat, and total", () => {
    const items = [{ amount: 100 }, { amount: 200 }]
    const result = calculateInvoiceTotals(items)
    expect(result.subtotal).toBe(300)
    expect(result.vatAmount).toBeCloseTo(54) // 300 * 0.18
    expect(result.total).toBeCloseTo(354)
  })

  it("handles empty items", () => {
    const result = calculateInvoiceTotals([])
    expect(result.subtotal).toBe(0)
    expect(result.total).toBe(0)
  })
})

describe("getHebrewPaymentStatus", () => {
  it("translates known statuses", () => {
    expect(getHebrewPaymentStatus("pending")).toBe("ממתין")
    expect(getHebrewPaymentStatus("paid")).toBe("שולם")
  })

  it("returns input for unknown statuses", () => {
    expect(getHebrewPaymentStatus("other")).toBe("other")
  })
})
