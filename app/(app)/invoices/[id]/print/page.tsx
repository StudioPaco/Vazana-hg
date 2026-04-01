"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import InvoiceTemplate from "@/components/invoices/invoice-template"

export default function InvoicePrintPage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Fetch invoice with client
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, clients:client_id(company_name, contact_person, email, address, city)')
        .eq('id', id)
        .single()

      if (!invoice) { setLoading(false); return }

      // Fetch line items with jobs
      const { data: lineItems } = await supabase
        .from('invoice_line_items')
        .select('*, jobs:job_id(job_number, job_status, worker_name, shift_type)')
        .eq('invoice_id', id)

      const jobs = (lineItems || []).filter((li: any) => li.job_id).map((li: any) => ({
        id: li.job_id || li.id,
        job_number: li.jobs?.job_number || 'N/A',
        work_type: li.work_type || '',
        job_date: li.job_date || '',
        site: li.site_location || '',
        city: '',
        total_amount: Number(li.line_total) || 0,
      }))

      const manualItems = (lineItems || []).filter((li: any) => !li.job_id).map((li: any) => ({
        description: li.description || '',
        job_date: li.job_date || '',
        unit_price: Number(li.line_total) || 0,
        work_type: li.work_type || 'ידני',
        site: li.site_location || '',
      }))

      setData({
        invoiceNumber: invoice.invoice_number || '',
        clientName: invoice.clients?.company_name || 'לקוח לא ידוע',
        jobs,
        manualItems,
        summary: {
          subtotal: Number(invoice.subtotal) || 0,
          tax_amount: Number(invoice.tax_amount) || 0,
          total_amount: Number(invoice.total_amount) || 0,
        },
        notes: invoice.notes || '',
        paymentTerms: invoice.payment_terms || '',
      })
      setLoading(false)

      // Auto-print after render (once only)
      if (!(window as any).__printTriggered) {
        (window as any).__printTriggered = true
        setTimeout(() => window.print(), 800)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="p-8 text-center font-hebrew">טוען חשבונית...</div>
  if (!data) return <div className="p-8 text-center font-hebrew text-red-500">חשבונית לא נמצאה</div>

  return (
    <div className="p-4">
      <style>{`@media print { nav, [data-slot="sidebar"], header, .print\\:hidden { display: none !important; } body { padding: 0; } }`}</style>
      <InvoiceTemplate
        invoiceNumber={data.invoiceNumber}
        clientName={data.clientName}
        selectedJobs={data.jobs}
        manualItems={data.manualItems}
        summary={data.summary}
        notes={data.notes}
        paymentTerms={data.paymentTerms}
        includeBankDetails={true}
      />
    </div>
  )
}
