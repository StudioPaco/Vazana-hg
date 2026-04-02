import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const category = request.nextUrl.searchParams.get("category")

    let query = supabase
      .from("status_options")
      .select("*")
      .order("sort_order")

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("status_options")
      .insert({
        category: body.category,
        value: body.value,
        label_he: body.label_he,
        label_en: body.label_en || null,
        color: body.color || null,
        sort_order: body.sort_order || 0,
        is_default: body.is_default || false,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (body.label_he !== undefined) updateData.label_he = body.label_he
    if (body.label_en !== undefined) updateData.label_en = body.label_en
    if (body.color !== undefined) updateData.color = body.color
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
    if (body.is_default !== undefined) updateData.is_default = body.is_default
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from("status_options")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const id = request.nextUrl.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const { error } = await supabase
      .from("status_options")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
