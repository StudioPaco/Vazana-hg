import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

    if (!currentUser || !["owner", "admin"].includes(currentUser.role)) {
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

    if (!currentUser || !["owner", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    // Only owner can create owner users
    if (role === "owner" && currentUser.role !== "owner") {
      return NextResponse.json({ error: "Only owner can create owner users" }, { status: 403 })
    }

    // Create auth user via admin client (requires service_role key)
    const admin = createAdminClient()
    const { data: authUser, error: signUpError } = await admin.auth.admin.createUser({
      email,
      password: "TempPassword123!", // User will need to reset
      email_confirm: true,
    })

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    // Create user profile
    const { data: newUser, error: profileError } = await admin
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
