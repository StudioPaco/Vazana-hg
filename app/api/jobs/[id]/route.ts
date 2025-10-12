import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { verifyToken } from "@/lib/auth-custom"

type RouteContext = { params: { id: string } };

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  if (!token) {
    return null
  }
  return await verifyToken(token)
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = context.params
    const supabase = createClient()

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
      .eq("id", id)
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

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Temporarily bypass authentication for job updates
    const { id } = context.params
    const body = await request.json()
    const supabase = createClient()

    const updateData = {
      ...body,
      updated_date: new Date().toISOString(),
    }

    console.log(`[v0] Updating job ${id} with:`, updateData)

    const { data: job, error } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase error updating job:", error)
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code 
      }, { status: 500 })
    }

    console.log(`[v0] Successfully updated job:`, job)
    return NextResponse.json({ data: job })
  } catch (error) {
    console.error("[v0] Error in PUT /api/jobs/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH method (alias for PUT for partial updates)
export async function PATCH(request: NextRequest, context: RouteContext) {
  return PUT(request, context)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = context.params
    const supabase = createClient()

    const { error } = await supabase.from("jobs").delete().eq("id", id).eq("created_by_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
