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

    const { data: carts, error } = await supabase
      .from("carts")
      .select("*")
      .or(`created_by_id.eq.${userId},is_sample.eq.true`)
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching carts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Carts fetched successfully:", carts?.length || 0, "records")
    return NextResponse.json({ data: carts || [] })
  } catch (error) {
    console.error("[v0] Internal error fetching carts:", error)
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

    const cartData = {
      ...body,
      created_by_id: defaultUser.id,
      created_by: defaultUser.email,
      updated_date: new Date().toISOString(),
      is_sample: true,
    }

    const { data: cart, error } = await supabase.from("carts").insert([cartData]).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: cart }, { status: 201 })
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
      return NextResponse.json({ error: "Cart ID is required" }, { status: 400 })
    }

    const { data: cart, error } = await supabase
      .from("carts")
      .update({ ...updateData, updated_date: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: cart })
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
      return NextResponse.json({ error: "Cart ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("carts").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
