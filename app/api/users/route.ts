import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view users
    const { data: currentUser } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

    if (!currentUser || !["root", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, full_name, role, permissions } = body

    // Check permissions
    const { data: currentUser } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

    if (!currentUser || !["root", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Only root can create root users
    if (role === "root" && currentUser.role !== "root") {
      return NextResponse.json({ error: "Only root can create root users" }, { status: 403 })
    }

    // Create auth user first
    const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password: "TempPassword123!", // User will need to reset
      email_confirm: true,
    })

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    // Create user profile
    const { data: newUser, error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        role,
        permissions: permissions || {},
        created_by: user.id,
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json(newUser)
  } catch (error) {
    console.error("User creation error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
