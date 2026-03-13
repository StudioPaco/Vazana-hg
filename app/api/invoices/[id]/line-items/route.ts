import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    const { id } = await params
    const invoiceId = id

    // First try to fetch from invoice_line_items table (new structure)
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .select(`
        *,
        jobs:job_id(job_number, job_status, worker_name, shift_type)
      `)
      .eq("invoice_id", invoiceId)
      .order("job_date", { ascending: true })

    // Return line items if found, otherwise return empty array
    return NextResponse.json({ data: lineItems || [] })

  } catch (error) {
    console.error("Failed to fetch invoice line items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}