import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("job_resources")
      .select("*")
      .eq("job_id", id)
      .order("resource_type")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    const resources: { resource_type: string; resource_id: string; resource_name: string }[] = body.resources || []

    // Replace strategy: delete existing, insert new
    await supabase.from("job_resources").delete().eq("job_id", id)

    if (resources.length > 0) {
      const rows = resources.map(r => ({
        job_id: id,
        resource_type: r.resource_type,
        resource_id: r.resource_id,
        resource_name: r.resource_name,
      }))

      const { error } = await supabase.from("job_resources").insert(rows)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
