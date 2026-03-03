import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("client_payment_logs")
      .select("*")
      .eq("client_id", id)
      .order("month", { ascending: false })

    if (error) {
      console.error("Error fetching payment logs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error("Error in GET /api/clients/[id]/payment-logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabase()
    const body = await request.json()
    const { logs } = body // Array of payment log entries

    if (!Array.isArray(logs)) {
      return NextResponse.json({ error: "logs must be an array" }, { status: 400 })
    }

    // Delete existing logs for this client
    const { error: deleteError } = await supabase
      .from("client_payment_logs")
      .delete()
      .eq("client_id", id)

    if (deleteError) {
      console.error("Error deleting old payment logs:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Insert new logs (skip entries without a month)
    const validLogs = logs
      .filter((log: any) => log.month)
      .map((log: any) => ({
        client_id: id,
        month: log.month,
        invoice_sent: log.invoice_sent || false,
        invoice_sent_date: log.invoice_sent_date || null,
        payment_received: log.payment_received || false,
        payment_received_date: log.payment_received_date || null,
        amount: log.amount || null,
        notes: log.notes || null,
      }))

    if (validLogs.length > 0) {
      const { error: insertError } = await supabase
        .from("client_payment_logs")
        .insert(validLogs)

      if (insertError) {
        console.error("Error inserting payment logs:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, count: validLogs.length })
  } catch (error) {
    console.error("Error in PUT /api/clients/[id]/payment-logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
