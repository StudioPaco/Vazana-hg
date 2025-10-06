import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // For API routes, we'll use a default user approach
    const userId = "00000000-0000-0000-0000-000000000001" // Sample user UUID that matches our sample data

    const { data: workTypes, error } = await supabase
      .from("work_types")
      .select("*")
      .or(`created_by_id.eq.${userId},is_sample.eq.true`)
      .order("name_he", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching work types:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Work types fetched successfully:", workTypes?.length || 0, "records")
    return NextResponse.json({ data: workTypes || [] })
  } catch (error) {
    console.error("[v0] Internal error fetching work types:", error)
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

    const { data: workType, error } = await supabase
      .from("work_types")
      .insert([
        {
          name_he: body.name_he,
          name_en: body.name_en,
          created_by_id: defaultUser.id,
          is_active: true,
          is_sample: true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating work type:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Work type created successfully:", workType)
    return NextResponse.json({ data: workType })
  } catch (error) {
    console.error("[v0] Internal error creating work type:", error)
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

    let userId = "sample-user" // Default fallback like other APIs

    const { data: workType, error } = await supabase
      .from("work_types")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating work type:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Work type updated successfully:", workType)
    return NextResponse.json({ data: workType })
  } catch (error) {
    console.error("[v0] Internal error updating work type:", error)
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
      return NextResponse.json({ error: "Work type ID is required" }, { status: 400 })
    }

    let userId = "sample-user" // Default fallback like other APIs

    const { error } = await supabase.from("work_types").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting work type:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Work type deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Internal error deleting work type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
