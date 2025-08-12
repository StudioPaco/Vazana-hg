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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${data.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .invoice-header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .company-name-en {
            font-size: 18px;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        
        .invoice-title {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 18px;
            opacity: 0.9;
        }
        
        .invoice-details {
            padding: 30px;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .detail-section h3 {
            color: #2563eb;
            margin-bottom: 15px;
            font-size: 18px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
        }
        
        .detail-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        
        .detail-label {
            font-weight: bold;
            color: #374151;
        }
        
        .detail-value {
            color: #6b7280;
        }
        
        .jobs-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .jobs-table th {
            background: #f8fafc;
            padding: 15px;
            text-align: right;
            font-weight: bold;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .jobs-table td {
            padding: 15px;
            border-bottom: 1px solid #f1f5f9;
            text-align: right;
        }
        
        .jobs-table tr:hover {
            background: #f8fafc;
        }
        
        .amount-cell {
            font-weight: bold;
            color: #059669;
        }
        
        .totals-section {
            background: #f8fafc;
            padding: 30px;
            border-top: 2px solid #e5e7eb;
        }
        
        .totals-grid {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 15px;
            max-width: 400px;
            margin-right: 0;
        }
        
        .total-label {
            font-weight: bold;
            color: #374151;
        }
        
        .total-value {
            font-weight: bold;
            text-align: left;
        }
        
        .final-total {
            font-size: 20px;
            color: #059669;
            border-top: 2px solid #059669;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .payment-info {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .payment-info h4 {
            color: #92400e;
            margin-bottom: 10px;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: #f8fafc;
            color: #6b7280;
            font-size: 14px;
        }
        
        .footer-logo {
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        
        @media print {
            body { padding: 0; }
            .invoice-container { border: none; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="company-name">וזאנה אבטחת כבישים</div>
            <div class="company-name-en">Vazana Road Safety</div>
            <div class="invoice-title">חשבונית</div>
            <div class="invoice-number">מספר: ${data.invoiceNumber}</div>
        </div>
        
        <div class="invoice-details">
            <div class="details-grid">
                <div class="detail-section">
                    <h3>פרטי לקוח</h3>
                    <div class="detail-item">
                        <span class="detail-label">שם החברה:</span>
                        <span class="detail-value">${data.clientName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">כתובת:</span>
                        <span class="detail-value">${data.clientAddress}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">עיר:</span>
                        <span class="detail-value">${data.clientCity}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">אימייל:</span>
                        <span class="detail-value">${data.clientEmail}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>פרטי חשבונית</h3>
                    <div class="detail-item">
                        <span class="detail-label">תאריך הנפקה:</span>
                        <span class="detail-value">${formatDate(data.issueDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">תאריך פירעון:</span>
                        <span class="detail-value">${formatDate(data.dueDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">אמצעי תשלום:</span>
                        <span class="detail-value">${data.paymentMethod}</span>
                    </div>
                </div>
            </div>
            
            <table class="jobs-table">
                <thead>
                    <tr>
                        <th>סכום</th>
                        <th>עובד</th>
                        <th>אתר</th>
                        <th>סוג עבודה</th>
                        <th>תאריך</th>
                        <th>מספר עבודה</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.jobs
                      .map(
                        (job) => `
                        <tr>
                            <td class="amount-cell">${formatCurrency(job.amount)}</td>
                            <td>${job.workerName}</td>
                            <td>${job.site}</td>
                            <td>${job.workType}</td>
                            <td>${formatDate(job.jobDate)}</td>
                            <td>#${job.jobNumber}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        
        <div class="totals-section">
            <div class="totals-grid">
                <span class="total-label">סכום ביניים:</span>
                <span class="total-value">${formatCurrency(data.subtotal)}</span>
                
                <span class="total-label">מע״ם (17%):</span>
                <span class="total-value">${formatCurrency(data.tax)}</span>
                
                <span class="total-label final-total">סה״כ לתשלום:</span>
                <span class="total-value final-total">${formatCurrency(data.total)}</span>
            </div>
            
            ${
              data.notes
                ? `
            <div class="payment-info">
                <h4>הערות:</h4>
                <p>${data.notes}</p>
            </div>
            `
                : ""
            }
        </div>
        
        <div class="footer">
            <div class="footer-logo">וזאנה אבטחת כבישים</div>
            <div>Vazana Road Safety Services</div>
            <div>תודה על הבחירה בשירותינו</div>
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
