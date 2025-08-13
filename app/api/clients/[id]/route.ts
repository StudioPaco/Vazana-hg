import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { verifyToken } from "@/lib/auth-custom"

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  if (!token) {
    return null
  }
  return await verifyToken(token)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabase = createClient()

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("created_by_id", user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: client })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = createClient()

    const updateData = {
      ...body,
      updated_date: new Date().toISOString(),
    }

    const { data: client, error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", id)
      .eq("created_by_id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: client })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabase = createClient()

    const { error } = await supabase.from("clients").delete().eq("id", id).eq("created_by_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
