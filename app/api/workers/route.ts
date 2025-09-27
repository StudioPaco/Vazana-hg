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
      userId = "sample-user" // Sample user ID that matches our sample data
    }

    const { data: workers, error } = await supabase
      .from("workers")
      .select("*")
      .or(`created_by_id.eq.${userId},is_sample.eq.true`)
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching workers:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Workers fetched successfully:", workers?.length || 0, "records")
    return NextResponse.json({ data: workers || [] })
  } catch (error) {
    console.error("[v0] Internal error fetching workers:", error)
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

    const workerData = {
      ...body,
      created_by_id: user.id,
      created_by: user.email,
      updated_date: new Date().toISOString(),
    }

    const { data: worker, error } = await supabase.from("workers").insert([workerData]).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: worker }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
