import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: workTypes, error } = await supabase
      .from("work_types")
      .select("*")
      .order("name_he", { ascending: true })

    if (error) {
      console.error("Error fetching work types:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: workTypes || [] })
  } catch (error) {
    console.error("Internal error fetching work types:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const body = await request.json()

    const { data: workType, error } = await supabase
      .from("work_types")
      .insert([
        {
          name_he: body.name_he,
          name_en: body.name_en,
          is_active: true,
          is_sample: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating work type:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: workType })
  } catch (error) {
    console.error("Internal error creating work type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updateData } = body

    const { data: workType, error } = await supabase
      .from("work_types")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating work type:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: workType })
  } catch (error) {
    console.error("Internal error updating work type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Work type ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("work_types").delete().eq("id", id)

    if (error) {
      console.error("Error deleting work type:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Internal error deleting work type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
