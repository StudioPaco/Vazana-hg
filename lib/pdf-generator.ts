import jsPDF from 'jspdf'
// @ts-ignore
import autoTable from 'jspdf-autotable'

interface InvoicePdfData {
  invoiceNumber: string
  clientName: string
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  issueDate: string
  dueDate: string
  jobs: Array<{
    jobNumber: string
    date: string
    workType: string
    site: string
    amount: number
  }>
  manualItems: Array<{
    description: string
    date: string
    workType: string
    site: string
    amount: number
  }>
  subtotal: number
  tax: number
  total: number
  paymentTerms: string
  notes: string
  bankDetails?: {
    accountName: string
    bankName: string
    branch: string
    accountNumber: string
  }
}

export function generateInvoicePDF(data: InvoicePdfData): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // RTL text helper — jsPDF doesn't support RTL natively, so we reverse for display
  const rtl = (text: string) => text.split('').reverse().join('')

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  // Header
  doc.setFontSize(24)
  doc.setTextColor(13, 148, 136) // teal
  doc.text(rtl('חשבונית'), pageWidth - margin, 20, { align: 'left' })

  // Invoice details — right side
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const detailsX = pageWidth - margin
  doc.text(`${data.invoiceNumber} :${rtl('מספר')}`, detailsX, 30, { align: 'left' })
  doc.text(`${data.issueDate} :${rtl('תאריך')}`, detailsX, 36, { align: 'left' })
  doc.text(`${data.dueDate} :${rtl('תאריך פרעון')}`, detailsX, 42, { align: 'left' })

  // Business details — left side
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text(rtl(data.businessName), margin, 20, { align: 'left' })
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(rtl(data.businessAddress), margin, 26, { align: 'left' })
  doc.text(`${data.businessPhone} :${rtl('טלפון')}`, margin, 31, { align: 'left' })
  doc.text(data.businessEmail, margin, 36, { align: 'left' })

  // Client
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text(`:${rtl('לכבוד')}`, pageWidth - margin, 52, { align: 'left' })
  doc.setFontSize(12)
  doc.text(rtl(data.clientName), pageWidth - margin, 58, { align: 'left' })

  // Table — jobs + manual items
  const tableRows: string[][] = []

  for (const job of data.jobs) {
    tableRows.push([
      `${job.amount.toLocaleString()}`,
      job.site,
      job.workType,
      job.date,
      `#${job.jobNumber}`,
    ])
  }

  for (const item of data.manualItems) {
    tableRows.push([
      `${item.amount.toLocaleString()}`,
      item.site || '-',
      item.workType || rtl('ידני'),
      item.date || '-',
      item.description,
    ])
  }

  autoTable(doc, {
    startY: 65,
    head: [[
      `(₪) ${rtl('סכום')}`,
      rtl('אתר'),
      rtl('סוג עבודה'),
      rtl('תאריך'),
      rtl('מספר עבודה'),
    ]],
    body: tableRows,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 4,
      halign: 'right',
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      halign: 'right',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
  })

  // Summary — after table
  const finalY = (doc as any).lastAutoTable?.finalY || 130
  const summaryX = margin + 60

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`:${rtl('סכום חלקי')}`, summaryX + 50, finalY + 10, { align: 'left' })
  doc.text(`${data.subtotal.toLocaleString()}₪`, summaryX, finalY + 10, { align: 'left' })

  doc.text(`:(18%) ${rtl('מע״מ')}`, summaryX + 50, finalY + 16, { align: 'left' })
  doc.text(`${data.tax.toLocaleString()}₪`, summaryX, finalY + 16, { align: 'left' })

  doc.setFontSize(13)
  doc.setTextColor(30, 30, 30)
  doc.text(`:${rtl('סכום כולל')}`, summaryX + 50, finalY + 24, { align: 'left' })
  doc.text(`${data.total.toLocaleString()}₪`, summaryX, finalY + 24, { align: 'left' })

  // Payment terms
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`:${rtl('תנאי תשלום')}`, pageWidth - margin, finalY + 35, { align: 'left' })
  doc.text(rtl(data.paymentTerms), pageWidth - margin, finalY + 41, { align: 'left' })

  // Notes
  if (data.notes) {
    doc.text(`:${rtl('הערות')}`, pageWidth - margin, finalY + 50, { align: 'left' })
    doc.text(rtl(data.notes), pageWidth - margin, finalY + 56, { align: 'left' })
  }

  // Bank details
  if (data.bankDetails) {
    const bankY = finalY + (data.notes ? 65 : 50)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, bankY, pageWidth - margin, bankY)
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(`:${rtl('פרטי חשבון בנק')}`, pageWidth - margin, bankY + 8, { align: 'left' })
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`${rtl(data.bankDetails.accountName)} :${rtl('שם החשבון')}`, pageWidth - margin, bankY + 14, { align: 'left' })
    doc.text(`${rtl(data.bankDetails.bankName)} :${rtl('בנק')}`, pageWidth - margin, bankY + 19, { align: 'left' })
    doc.text(`${data.bankDetails.branch} :${rtl('סניף')}`, pageWidth - margin, bankY + 24, { align: 'left' })
    doc.text(`${data.bankDetails.accountNumber} :${rtl('מספר חשבון')}`, pageWidth - margin, bankY + 29, { align: 'left' })
  }

  // Save
  doc.save(`${data.invoiceNumber || 'invoice'}.pdf`)
}
