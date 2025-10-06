import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // For API routes, we'll use a default user approach since we're not handling cookies
    const userId = "00000000-0000-0000-0000-000000000001" // Sample user UUID that matches our sample data

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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Use default user for API routes
    const defaultUser = { id: "00000000-0000-0000-0000-000000000001", email: "admin@example.com" }

    const body = await request.json()

    const workerData = {
      ...body,
      created_by_id: defaultUser.id,
      created_by: defaultUser.email,
      updated_date: new Date().toISOString(),
      is_sample: true,
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

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Worker ID is required" }, { status: 400 })
    }

    const { data: worker, error } = await supabase
      .from("workers")
      .update({ ...updateData, updated_date: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: worker })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Worker ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("workers").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
