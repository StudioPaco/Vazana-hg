"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Job {
  id: string
  job_number: string
  work_type: string
  job_date: string
  site: string
  city: string
  total_amount: number
}

interface ManualItem {
  description: string
  job_date?: string
  unit_price: number
  work_type?: string
  site?: string
}

interface InvoiceTemplateProps {
  invoiceNumber: string
  clientName: string
  selectedJobs: Job[]
  manualItems?: ManualItem[]
  summary: { subtotal: number; tax_amount: number; total_amount: number }
  notes: string
  paymentTerms: string
  includeBankDetails: boolean
}

export default function InvoiceTemplate({
  invoiceNumber,
  clientName,
  selectedJobs,
  manualItems = [],
  summary,
  notes,
  paymentTerms,
  includeBankDetails,
}: InvoiceTemplateProps) {
  const [biz, setBiz] = useState({ name: 'וזאנה אבטחת כבישים', address: '', phone: '', email: '', bankAccountName: '', bankName: '', bankBranch: '', bankAccountNumber: '' })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('business_settings').select('*').limit(1).single().then(({ data }) => {
      if (data) setBiz({
        name: data.company_name || 'וזאנה אבטחת כבישים',
        address: data.address || '',
        phone: data.phone || '',
        email: data.company_email || '',
        bankAccountName: data.bank_account_name || '',
        bankName: data.bank_name || '',
        bankBranch: data.bank_branch || '',
        bankAccountNumber: data.bank_account_number || '',
      })
    })
  }, [])

  const currentDate = new Date().toLocaleDateString('he-IL')
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200" dir="rtl">
      {/* Header — business right, invoice left */}
      <div className="flex justify-between items-start mb-8">
        <div className="text-right">
          <img src="/VazanaLogo-02.png" alt="Vazana" className="h-12 mb-2" />
          <h2 className="text-xl font-bold text-gray-800 mb-1">{biz.name}</h2>
          <div className="text-sm text-gray-600">
            {biz.address && <p>{biz.address}</p>}
            {biz.phone && <p>טלפון: {biz.phone}</p>}
            {biz.email && <p>דוא"ל: {biz.email}</p>}
          </div>
        </div>

        <div className="text-left">
          <h1 className="text-3xl font-bold text-teal-600 mb-2">חשבונית</h1>
          <div className="text-sm text-gray-600 text-left">
            <p>מספר: {invoiceNumber}</p>
            <p>תאריך: {currentDate}</p>
            <p>תאריך פרעון: {dueDate}</p>
          </div>
        </div>
      </div>

      {/* Client */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">לכבוד:</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="font-medium">{clientName}</p>
        </div>
      </div>

      {/* Items Table — RTL: job# right, amount left */}
      <div className="mb-8" dir="rtl">
        <table className="w-full border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-200 p-3 text-right text-sm font-medium">מספר עבודה</th>
              <th className="border border-gray-200 p-3 text-right text-sm font-medium">תאריך</th>
              <th className="border border-gray-200 p-3 text-right text-sm font-medium">סוג עבודה</th>
              <th className="border border-gray-200 p-3 text-right text-sm font-medium">אתר</th>
              <th className="border border-gray-200 p-3 text-left text-sm font-medium">סכום (₪)</th>
            </tr>
          </thead>
          <tbody>
            {selectedJobs.map((job) => (
              <tr key={job.id}>
                <td className="border border-gray-200 p-3 text-right">#{job.job_number}</td>
                <td className="border border-gray-200 p-3 text-right">{new Date(job.job_date).toLocaleDateString('he-IL')}</td>
                <td className="border border-gray-200 p-3 text-right">{job.work_type}</td>
                <td className="border border-gray-200 p-3 text-right">{job.site}, {job.city}</td>
                <td className="border border-gray-200 p-3 text-left font-medium">₪{(job.total_amount || 0).toLocaleString()}</td>
              </tr>
            ))}
            {manualItems.filter(i => i.description && i.unit_price > 0).map((item, i) => (
              <tr key={`manual-${i}`} className="bg-amber-50/50">
                <td className="border border-gray-200 p-3 text-right">{item.description}</td>
                <td className="border border-gray-200 p-3 text-right text-gray-500">{item.job_date ? new Date(item.job_date).toLocaleDateString('he-IL') : '—'}</td>
                <td className="border border-gray-200 p-3 text-right">{item.work_type || 'ידני'}</td>
                <td className="border border-gray-200 p-3 text-right text-gray-500">{item.site || '—'}</td>
                <td className="border border-gray-200 p-3 text-left font-medium">₪{item.unit_price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary — aligned left */}
      <div className="flex justify-end mb-8">
        <div className="w-72" dir="rtl">
          <div className="flex justify-between py-2 border-b text-sm">
            <span>סכום חלקי:</span>
            <span>₪{summary.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b text-sm">
            <span>מע״מ (18%):</span>
            <span>₪{summary.tax_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-3 text-lg font-bold bg-gray-50 px-3 rounded">
            <span>סכום כולל:</span>
            <span>₪{summary.total_amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">תנאי תשלום:</h3>
        <p className="text-sm">{paymentTerms}</p>
      </div>

      {/* Notes */}
      {notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">הערות:</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm">{notes}</p>
          </div>
        </div>
      )}

      {/* Bank Details */}
      {includeBankDetails && biz.bankAccountName && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">פרטי חשבון בנק:</h3>
          <div className="text-sm text-gray-600">
            <p>שם החשבון: {biz.bankAccountName}</p>
            <p>בנק: {biz.bankName}</p>
            <p>סניף: {biz.bankBranch}</p>
            <p>מספר חשבון: {biz.bankAccountNumber}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Generate standalone HTML string from the template for print/PDF.
 * Call this from the print/download buttons.
 */
export function getInvoicePrintHTML(contentElement: HTMLElement, invoiceNumber: string): string {
  const css = `
    @page { size: A4 landscape; margin: 20mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    * { font-family: Arial, Helvetica, sans-serif; direction: rtl; box-sizing: border-box; margin: 0; }
    html, body { direction: rtl; padding: 0; }
    body { color: #1a1a1a; text-align: right; font-size: 13px; padding: 20px 30px; }
    .invoice-wrapper { padding: 20px 30px; }
    h1 { font-size: 28px; color: #0d9488; margin-bottom: 8px; }
    h2 { font-size: 18px; margin-bottom: 6px; } h3 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    p { margin: 2px 0; } img { max-height: 48px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { background: #f5f5f5 !important; border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 600; }
    td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
    .bg-gray-50 { background: #f9fafb !important; } .bg-amber-50\\/50 { background: #fffbeb !important; }
    .text-teal-600 { color: #0d9488; }
    .text-gray-600, .text-gray-500 { color: #6b7280; }
    .font-bold, .font-semibold { font-weight: 700; } .font-medium { font-weight: 500; }
    .text-sm { font-size: 13px; } .text-xs { font-size: 11px; } .text-lg { font-size: 18px; } .text-xl { font-size: 20px; } .text-3xl { font-size: 28px; }
    .text-right { text-align: right; } .text-left { text-align: left; }
    .mb-2 { margin-bottom: 8px; } .mb-8 { margin-bottom: 24px; }
    .p-3, .p-4 { padding: 12px; } .p-8 { padding: 32px; } .px-3 { padding: 0 12px; } .py-2 { padding: 6px 0; } .py-3 { padding: 10px 0; }
    .rounded { border-radius: 6px; } .rounded-lg { border-radius: 8px; }
    .border { border: 1px solid #e5e7eb; } .border-b { border-bottom: 1px solid #e5e7eb; } .border-t { border-top: 1px solid #e5e7eb; }
    .flex { display: flex; } .justify-between { justify-content: space-between; } .justify-end { justify-content: flex-end; }
    .items-start { align-items: flex-start; }
    .w-72 { width: 280px; } svg, button { display: none !important; }
  `
  return `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>חשבונית ${invoiceNumber}</title><style>${css}</style></head><body><div class="invoice-wrapper">${contentElement.innerHTML}</div></body></html>`
}
