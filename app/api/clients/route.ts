import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_date", { ascending: false })
    if (error) {
      console.error("Error fetching clients:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: clients || [] })
  } catch (error) {
    console.error("Internal error fetching clients:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user for created_by_id
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("Auth error creating client:", authError)
      return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 })
    }

    const body = await request.json()

    // Basic validation to ensure required fields are present
    if (!body.company_name || !body.contact_person) {
      return NextResponse.json({ error: "Company name and contact person are required." }, { status: 400 })
    }

    const clientData: Record<string, any> = {
      company_name: body.company_name,
      contact_person: body.contact_person,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      po_box: body.po_box || null,
      payment_method: body.payment_method || 1,
      security_rate: body.security_rate ?? 0,
      installation_rate: body.installation_rate ?? 0,
      notes: body.notes || null,
      status: body.status || "active",
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      is_sample: false,
      created_by_id: user.id,
    }

    const { data: client, error } = await supabase.from("clients").insert([clientData]).select().single()

    if (error) {
      console.error("Error creating client in Supabase:", error)
      console.error("Full error details:", JSON.stringify(error, null, 2))
      return NextResponse.json({ 
        error: error.message || "Database error creating client", 
        details: error.details || error.hint || 'No additional details',
        code: error.code || 'UNKNOWN'
      }, { status: 500 })
    }

    return NextResponse.json({ data: client }, { status: 201 })
  } catch (error: unknown) {
    console.error("Internal error creating client:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
