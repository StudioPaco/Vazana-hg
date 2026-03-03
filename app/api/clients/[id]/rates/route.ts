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
      .from("client_work_type_rates")
      .select(`
        id,
        client_id,
        work_type_id,
        rate,
        work_types:work_type_id(name_he, name_en)
      `)
      .eq("client_id", id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching client rates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Flatten the joined work_type name into the response
    const rates = (data || []).map((row: any) => ({
      id: row.id,
      client_id: row.client_id,
      work_type_id: row.work_type_id,
      work_type_name: row.work_types?.name_he || "",
      rate: row.rate,
    }))

    return NextResponse.json({ data: rates })
  } catch (error) {
    console.error("Error in GET /api/clients/[id]/rates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabase()
    const body = await request.json()
    const { rates } = body // Array of { work_type_id, rate }

    if (!Array.isArray(rates)) {
      return NextResponse.json({ error: "rates must be an array" }, { status: 400 })
    }

    // Delete existing rates for this client
    const { error: deleteError } = await supabase
      .from("client_work_type_rates")
      .delete()
      .eq("client_id", id)

    if (deleteError) {
      console.error("Error deleting old rates:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Insert new rates (skip entries with empty work_type_id or 0 rate)
    const validRates = rates
      .filter((r: any) => r.work_type_id && r.rate > 0)
      .map((r: any) => ({
        client_id: id,
        work_type_id: r.work_type_id,
        rate: r.rate,
      }))

    if (validRates.length > 0) {
      const { error: insertError } = await supabase
        .from("client_work_type_rates")
        .insert(validRates)

      if (insertError) {
        console.error("Error inserting rates:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, count: validRates.length })
  } catch (error) {
    console.error("Error in PUT /api/clients/[id]/rates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
