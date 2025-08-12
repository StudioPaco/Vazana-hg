import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(`
        *,
        clients:client_id(company_name, contact_person),
        workers:worker_id(name),
        vehicles:vehicle_id(name, license_plate),
        carts:cart_id(name),
        receipts:receipt_id(receipt_number, status)
      `)
      .eq("created_by_id", user.id)
      .order("job_date", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: jobs })
  } catch (error) {
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

    // Generate job number if not provided
    const jobNumber = body.job_number || `${Date.now().toString().slice(-4)}`

    const jobData = {
      ...body,
      job_number: jobNumber,
      created_by_id: user.id,
      created_by: user.email,
      updated_date: new Date().toISOString(),
    }

    const { data: job, error } = await supabase.from("jobs").insert([jobData]).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: job }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
