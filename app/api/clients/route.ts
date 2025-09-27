import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    let userId = user?.id

    if (!userId) {
      userId = "sample-user"
    }

    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .or(`created_by_id.eq.${userId},is_sample.eq.true`)
      .order("created_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching clients:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Clients fetched successfully:", clients?.length || 0, "records")
    return NextResponse.json({ data: clients || [] })
  } catch (error) {
    console.error("[v0] Internal error fetching clients:", error)
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

    const userId = user?.id || "sample-user"
    const userEmail = user?.email || "demo@example.com"

    const body = await request.json()

    const clientData = {
      ...body,
      created_by_id: userId,
      created_by: userEmail,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      is_sample: !user, // Mark as sample if no authenticated user
    }

    console.log("[v0] Creating client with data:", clientData)

    const { data: client, error } = await supabase.from("clients").insert([clientData]).select().single()

    if (error) {
      console.error("[v0] Error creating client:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Client created successfully:", client)
    return NextResponse.json({ data: client }, { status: 201 })
  } catch (error) {
    console.error("[v0] Internal error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
