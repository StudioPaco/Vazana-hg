// Invoice generation service with PDF creation
interface InvoiceData {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  clientName: string
  clientAddress: string
  clientCity: string
  clientEmail: string
  jobs: Array<{
    jobNumber: string
    jobDate: string
    description: string
    workType: string
    site: string
    workerName: string
    amount: number
  }>
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  notes?: string
}

export class InvoiceService {
  // Generate invoice HTML for PDF conversion
  generateInvoiceHTML(data: InvoiceData): string {
    const formatCurrency = (amount: number) => `₪${amount.toLocaleString()}`
    const formatDate = (date: string) => new Date(date).toLocaleDateString("he-IL")

    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <title>חשבונית ${data.invoiceNumber}</title>
    <style>
        @page { size: A4 landscape; margin: 10mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
        body { direction: rtl; color: #1a1a1a; padding: 24px; background: white; font-size: 13px; }
        
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #f5f5f5; border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 600; }
        td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
        h1 { font-size: 28px; color: #0d9488; }
        h2 { font-size: 18px; }
        h3 { font-size: 15px; color: #374151; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .header-right { text-align: right; }
        .header-left { text-align: left; }
        .client-box { background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
        .summary { width: 280px; margin-left: auto; margin-top: 16px; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; }
        .summary-total { font-size: 18px; font-weight: 700; border-top: 2px solid #0d9488; padding-top: 8px; }
        .notes { background: #f9fafb; padding: 12px; border-radius: 6px; margin: 16px 0; }
        .bank { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px; }
    </style>
</head>
<body>
    <!-- Header: business right, invoice left -->
    <div class="header">
        <div class="header-right">
            <h2 style="margin-bottom:4px">${data.clientName ? 'וזאנה אבטחת כבישים' : 'וזאנה'}</h2>
            <p style="font-size:12px;color:#6b7280">טלפון: ${data.clientEmail ? '' : ''}</p>
        </div>
        <div class="header-left">
            <h1>חשבונית</h1>
            <p>מספר: ${data.invoiceNumber}</p>
            <p>תאריך: ${formatDate(data.issueDate)}</p>
            <p>תאריך פרעון: ${formatDate(data.dueDate)}</p>
        </div>
    </div>

    <!-- Client -->
    <div class="client-box">
        <h3 style="margin-bottom:4px">לכבוד:</h3>
        <p style="font-weight:600">${data.clientName}</p>
        ${data.clientAddress ? `<p>${data.clientAddress}${data.clientCity ? `, ${data.clientCity}` : ''}</p>` : ''}
        ${data.clientEmail ? `<p>${data.clientEmail}</p>` : ''}
    </div>

    <!-- Jobs Table — RTL order: job# right, amount left -->
    <table>
        <thead>
            <tr>
                <th>מספר עבודה</th>
                <th>תאריך</th>
                <th>סוג עבודה</th>
                <th>אתר</th>
                <th style="text-align:left">סכום (₪)</th>
            </tr>
        </thead>
        <tbody>
            ${data.jobs.map(job => `
            <tr>
                <td>#${job.jobNumber}</td>
                <td>${formatDate(job.jobDate)}</td>
                <td>${job.workType}</td>
                <td>${job.site}</td>
                <td style="text-align:left;font-weight:600">${formatCurrency(job.amount)}</td>
            </tr>`).join('')}
        </tbody>
    </table>

    <!-- Summary — aligned left -->
    <div class="summary">
        <div class="summary-row">
            <span>סכום חלקי:</span>
            <span>${formatCurrency(data.subtotal)}</span>
        </div>
        <div class="summary-row">
            <span>מע״מ (18%):</span>
            <span>${formatCurrency(data.tax)}</span>
        </div>
        <div class="summary-row summary-total">
            <span>סכום כולל:</span>
            <span>${formatCurrency(data.total)}</span>
        </div>
    </div>

    <!-- Payment Terms -->
    <div style="margin-top:16px">
        <h3>תנאי תשלום:</h3>
        <p>${data.paymentMethod}</p>
    </div>

    ${data.notes ? `<div class="notes"><h3>הערות:</h3><p>${data.notes}</p></div>` : ''}

    <div class="bank">
        <h3>פרטי חשבון בנק:</h3>
        <p>וזאנה אבטחת כבישים</p>
    </div>
    </div>
</body>
</html>
    `
  }

  // Generate invoice PDF (using Puppeteer or similar service)
  async generateInvoicePDF(data: InvoiceData): Promise<{ success: boolean; pdfBuffer?: Buffer; error?: string }> {
    try {
      const html = this.generateInvoiceHTML(data)

      // In a real implementation, you would use Puppeteer or a PDF service
      // For now, we'll return the HTML and suggest using a PDF conversion service
      const response = await fetch("https://api.htmlcsstoimage.com/v1/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HTML_CSS_TO_IMAGE_API_KEY}`,
        },
        body: JSON.stringify({
          html,
          css: "",
          format: "pdf",
          width: 800,
          height: 1200,
        }),
      })

      if (!response.ok) {
        throw new Error("PDF generation service error")
      }

      const pdfBuffer = Buffer.from(await response.arrayBuffer())
      return { success: true, pdfBuffer }
    } catch (error) {
      console.error("PDF generation error:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Calculate invoice totals
  calculateTotals(jobs: Array<{ amount: number }>) {
    const subtotal = jobs.reduce((sum, job) => sum + job.amount, 0)
    const tax = subtotal * 0.17 // 17% VAT in Israel
    const total = subtotal + tax

    return { subtotal, tax, total }
  }

  // Generate invoice number
  generateInvoiceNumber(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const timestamp = now.getTime().toString().slice(-6)
    return `INV-${year}${month}-${timestamp}`
  }
}

export const invoiceService = new InvoiceService()
