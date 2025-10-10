/**
 * Calculate payment due date based on payment terms
 * @param paymentTerms - Payment terms string (e.g., "immediate", "current+15", "current+30")
 * @param invoiceDate - Date when invoice was issued (optional, defaults to today)
 * @returns Due date for the payment
 */
export function calculatePaymentDueDate(paymentTerms: string, invoiceDate?: Date): Date {
  const issueDate = invoiceDate || new Date()
  
  switch (paymentTerms) {
    case "immediate":
      return new Date(issueDate) // Same day
      
    case "current+15":
    case "current+30": 
    case "current+60":
    case "current+90":
      // שוטף means until the end of current month
      const endOfCurrentMonth = new Date(issueDate.getFullYear(), issueDate.getMonth() + 1, 0)
      
      // Extract additional days from the payment terms (e.g., "current+30" -> 30)
      const additionalDaysMatch = paymentTerms.match(/current\+(\d+)/)
      const additionalDays = additionalDaysMatch ? parseInt(additionalDaysMatch[1]) : 0
      
      // Add the additional days to the end of month
      const dueDate = new Date(endOfCurrentMonth)
      dueDate.setDate(dueDate.getDate() + additionalDays)
      return dueDate
      
    default:
      // For custom or unknown terms, default to 30 days from issue date
      const defaultDueDate = new Date(issueDate)
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      return defaultDueDate
  }
}

/**
 * Get Hebrew display text for payment terms
 */
export function getPaymentTermsDisplayText(paymentTerms: string): string {
  switch (paymentTerms) {
    case "immediate":
      return "מיידי"
    case "current+15":
      return "שוטף +15"
    case "current+30":
      return "שוטף +30"
    case "current+60":
      return "שוטף +60"
    case "current+90":
      return "שוטף +90"
    default:
      return paymentTerms
  }
}

/**
 * Calculate days until payment is due
 */
export function getDaysUntilDue(paymentTerms: string, invoiceDate?: Date): number {
  const dueDate = calculatePaymentDueDate(paymentTerms, invoiceDate)
  const today = new Date()
  const timeDiff = dueDate.getTime() - today.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}