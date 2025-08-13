import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createServerClient()
    const { id } = await params // Await params to get the id

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .select(`
        *,
        clients:client_id(company_name, contact_person, phone, email),
        workers:worker_id(name, phone_number),
        vehicles:vehicle_id(name, license_plate),
        carts:cart_id(name, details),
        receipts:receipt_id(receipt_number, status, total_amount)
      `)
      .eq("id", id) // Use awaited id
      .eq("created_by_id", user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: job })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createServerClient()
    const { id } = await params // Await params to get the id

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const updateData = {
      ...body,
      updated_date: new Date().toISOString(),
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", id) // Use awaited id
      .eq("created_by_id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: job })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createServerClient()
    const { id } = await params // Await params to get the id

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("jobs").delete().eq("id", id).eq("created_by_id", user.id) // Use awaited id

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
