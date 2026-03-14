import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    // Verify caller is authenticated and is admin/owner
    const supabase = await createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", caller.id)
      .single()

    if (!callerProfile || !["owner", "admin"].includes(callerProfile.role)) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, full_name, phone, role } = body

    if (!email || !password || !role) {
      return NextResponse.json({ error: "email, password, and role are required" }, { status: 400 })
    }

    if (!["admin", "staff"].includes(role)) {
      return NextResponse.json({ error: "role must be admin or staff" }, { status: 400 })
    }

    // Create the auth user via admin API
    const admin = createAdminClient()
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { full_name },
    })

    if (authError) {
      console.error("Auth user creation failed:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create the user_profiles entry
    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .insert({
        id: authUser.user.id,
        username: email,
        email,
        full_name: full_name || email,
        phone: phone || null,
        role,
        is_active: true,
        permissions: role === "admin"
          ? { maintenance: true, delete_jobs: true, delete_invoices: true, user_management: true }
          : { maintenance: false, delete_jobs: false, delete_invoices: false, user_management: false },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      console.error("Profile creation failed:", profileError)
      // Try to clean up the auth user if profile creation fails
      await admin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ data: profile }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
