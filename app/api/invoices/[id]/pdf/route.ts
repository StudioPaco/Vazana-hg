import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { invoiceService } from "@/lib/invoice-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get invoice with related data (unified: reads from "invoices" table)
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        clients:client_id(company_name, contact_person, email, address, city, payment_method)
      `)
      .eq("id", id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get associated jobs via invoice_line_items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .select(`
        *,
        jobs:job_id(*,
          workers:worker_id(name)
        )
      `)
      .eq("invoice_id", id)

    // Fallback: try via receipt_id on jobs (legacy data)
    let jobs = lineItems?.map((li: any) => li.jobs).filter(Boolean) || []
    if (jobs.length === 0) {
      const { data: legacyJobs } = await supabase
        .from("jobs")
        .select(`*, workers:worker_id(name)`)
        .eq("receipt_id", id)
      jobs = legacyJobs || []
    }

    if (lineItemsError && jobs.length === 0) {
      return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
    }

    const client = invoice.clients
    if (!client) {
      return NextResponse.json({ error: "Client data not found" }, { status: 404 })
    }

    // Calculate totals
    const jobAmounts = jobs.map((job: any) => ({ amount: Number.parseFloat(job.total_amount) || 0 }))
    const { subtotal, tax, total } = invoiceService.calculateTotals(jobAmounts)

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber: invoice.invoice_number || "",
      issueDate: invoice.invoice_date || "",
      dueDate: invoice.due_date || "",
      clientName: client.company_name,
      clientAddress: client.address || "",
      clientCity: client.city || "",
      clientEmail: client.email || "",
      jobs:
        jobs.map((job: any) => ({
          jobNumber: job.job_number,
          jobDate: job.job_date,
          description: `${job.work_type} - ${job.site}`,
          workType: job.work_type,
          site: job.site,
          workerName: job.workers?.name || job.worker_name,
          amount: Number.parseFloat(job.total_amount) || 0,
        })),
      subtotal,
      tax,
      total,
      paymentMethod: client.payment_method || "Bank Transfer",
      notes: invoice.notes,
    }

    // Generate PDF
    const pdfResult = await invoiceService.generateInvoicePDF(invoiceData)

    if (!pdfResult.success) {
      // Fallback to HTML if PDF generation fails
      const html = invoiceService.generateInvoiceHTML(invoiceData)
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      })
    }

    if (!pdfResult.pdfBuffer) {
      return NextResponse.json({ error: "PDF generation failed" }, { status: 500 })
    }

    return new NextResponse(pdfResult.pdfBuffer as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
