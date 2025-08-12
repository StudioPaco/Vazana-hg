import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { invoiceService } from "@/lib/invoice-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: receipts, error } = await supabase
      .from("receipts")
      .select(`
        *,
        clients:client_id(company_name, contact_person, email, address, city)
      `)
      .eq("created_by_id", user.id)
      .order("created_date", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: receipts })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, jobIds, notes } = body

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .eq("created_by_id", user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get job details
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select(`
        *,
        workers:worker_id(name)
      `)
      .in("id", jobIds)
      .eq("created_by_id", user.id)

    if (jobsError || !jobs || jobs.length === 0) {
      return NextResponse.json({ error: "Jobs not found" }, { status: 404 })
    }

    // Calculate totals
    const jobAmounts = jobs.map((job) => ({ amount: Number.parseFloat(job.total_amount) || 0 }))
    const { subtotal, tax, total } = invoiceService.calculateTotals(jobAmounts)

    // Generate invoice number
    const invoiceNumber = invoiceService.generateInvoiceNumber()

    // Create receipt record
    const receiptData = {
      receipt_number: invoiceNumber,
      client_id: clientId,
      total_amount: total,
      status: "draft",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
      notes,
      created_by_id: user.id,
      created_by: user.email,
    }

    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert([receiptData])
      .select()
      .single()

    if (receiptError) {
      return NextResponse.json({ error: receiptError.message }, { status: 500 })
    }

    // Update jobs with receipt ID
    await supabase.from("jobs").update({ receipt_id: receipt.id }).in("id", jobIds).eq("created_by_id", user.id)

    // Prepare invoice data for PDF generation
    const invoiceData = {
      invoiceNumber,
      issueDate: receiptData.issue_date,
      dueDate: receiptData.due_date,
      clientName: client.company_name,
      clientAddress: client.address || "",
      clientCity: client.city || "",
      clientEmail: client.email || "",
      jobs: jobs.map((job) => ({
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
      notes,
    }

    return NextResponse.json({
      data: {
        receipt,
        invoiceData,
      },
    })
  } catch (error) {
    console.error("Invoice creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
