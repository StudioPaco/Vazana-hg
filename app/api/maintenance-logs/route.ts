import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get("limit") || "200")
    const level = searchParams.get("level")
    const component = searchParams.get("component")

    let query = supabase
      .from("maintenance_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (level) query = query.eq("level", level)
    if (component) query = query.eq("component", component)

    const { data, error } = await query

    if (error) {
      console.error("Error fetching maintenance logs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error("Internal error fetching maintenance logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Support batch insert (array of logs) or single log
    const logs = Array.isArray(body) ? body : [body]

    const logEntries = logs.map((log: any) => ({
      level: log.level || "info",
      message: log.message,
      component: log.component || null,
      details: log.details || null,
      created_by: user.id,
      timestamp: log.timestamp || new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from("maintenance_logs")
      .insert(logEntries)
      .select()

    if (error) {
      console.error("Error creating maintenance log:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("Internal error creating maintenance log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      // Delete specific log
      const { error } = await supabase.from("maintenance_logs").delete().eq("id", id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Clear all logs (owner only — RLS enforces this)
      const { error } = await supabase.from("maintenance_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
