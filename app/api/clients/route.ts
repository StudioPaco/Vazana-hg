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

    const body = await request.json()

    // Basic validation to ensure required fields are present
    if (!body.company_name || !body.contact_person) {
      return NextResponse.json({ error: "Company name and contact person are required." }, { status: 400 })
    }

    const clientData = {
      company_name: body.company_name,
      contact_person: body.contact_person,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      po_box: body.po_box,
      payment_method: body.payment_method,
      security_rate: body.security_rate,
      installation_rate: body.installation_rate,
      notes: body.notes,
      status: body.status || "active",
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      is_sample: false,
    }

    const { data: client, error } = await supabase.from("clients").insert([clientData]).select().single()

    if (error) {
      console.error("Error creating client in Supabase:", error)
      console.error("Full error details:", JSON.stringify(error, null, 2))
      return NextResponse.json({ 
        error: `Supabase error: ${error.message}`, 
        details: error.details || error.hint || 'No additional details',
        code: error.code || 'No error code'
      }, { status: 500 })
    }

    return NextResponse.json({ data: client }, { status: 201 })
  } catch (error: any) {
    console.error("Internal error creating client:", error)
    // Ensure a valid JSON response is always sent
    return NextResponse.json(
      { error: "Internal server error.", details: error.message || "Unknown error" },
      { status: 500 },
    )
  }
}
