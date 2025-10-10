import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id

    // First try to fetch from invoice_line_items table (new structure)
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .select(`
        *,
        jobs:job_id(job_number, job_status, worker_name, shift_type)
      `)
      .eq("invoice_id", invoiceId)
      .order("job_date", { ascending: true })

    if (!lineItemsError && lineItems && lineItems.length > 0) {
      return NextResponse.json({ data: lineItems })
    }

    // Fallback: try to fetch from receipts/jobs relationship (old structure)
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .select(`
        id,
        receipt_number,
        total_amount
      `)
      .eq("id", invoiceId)
      .single()

    if (receiptError || !receipt) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get jobs linked to this receipt
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select(`
        id,
        job_number,
        job_date,
        work_type,
        site,
        city,
        total_amount,
        job_status,
        worker_name,
        shift_type
      `)
      .eq("receipt_id", invoiceId)
      .order("job_date", { ascending: true })

    if (jobsError) {
      return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
    }

    // Transform jobs to line item format
    const transformedLineItems = (jobs || []).map((job) => ({
      id: `job-${job.id}`,
      job_id: job.id,
      description: `${job.work_type} - עבודה #${job.job_number}`,
      quantity: 1,
      unit_price: job.total_amount || 0,
      line_total: job.total_amount || 0,
      work_type: job.work_type,
      job_date: job.job_date,
      site_location: `${job.site}, ${job.city}`,
      jobs: {
        job_number: job.job_number,
        job_status: job.job_status || "הושלם",
        worker_name: job.worker_name,
        shift_type: job.shift_type
      }
    }))

    return NextResponse.json({ data: transformedLineItems })

  } catch (error) {
    console.error("Failed to fetch invoice line items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}