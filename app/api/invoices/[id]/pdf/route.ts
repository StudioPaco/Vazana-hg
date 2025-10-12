import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { verifyToken } from "@/lib/auth-custom"
import { invoiceService } from "@/lib/invoice-service"

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  if (!token) {
    return null
  }
  return await verifyToken(token)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabase = createClient()

    // Get receipt with related data
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .select(`
        *,
        clients:client_id(company_name, contact_person, email, address, city, payment_method)
      `)
      .eq("id", id)
      .eq("created_by_id", user.id)
      .single()

    if (receiptError || !receipt) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get associated jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select(`
        *,
        workers:worker_id(name)
      `)
      .eq("receipt_id", id)
      .eq("created_by_id", user.id)

    if (jobsError) {
      return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
    }

    const client = receipt.clients
    if (!client) {
      return NextResponse.json({ error: "Client data not found" }, { status: 404 })
    }

    // Calculate totals
    const jobAmounts = jobs?.map((job) => ({ amount: Number.parseFloat(job.total_amount) || 0 })) || []
    const { subtotal, tax, total } = invoiceService.calculateTotals(jobAmounts)

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber: receipt.receipt_number || "",
      issueDate: receipt.issue_date || "",
      dueDate: receipt.due_date || "",
      clientName: client.company_name,
      clientAddress: client.address || "",
      clientCity: client.city || "",
      clientEmail: client.email || "",
      jobs:
        jobs?.map((job) => ({
          jobNumber: job.job_number,
          jobDate: job.job_date,
          description: `${job.work_type} - ${job.site}`,
          workType: job.work_type,
          site: job.site,
          workerName: job.workers?.name || job.worker_name,
          amount: Number.parseFloat(job.total_amount) || 0,
        })) || [],
      subtotal,
      tax,
      total,
      paymentMethod: client.payment_method || "Bank Transfer",
      notes: receipt.notes,
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
        "Content-Disposition": `attachment; filename="invoice-${receipt.receipt_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
