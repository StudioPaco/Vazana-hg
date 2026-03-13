import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/auth/setup-owner
 * One-time endpoint to create the owner account.
 * Requires SETUP_SECRET header for authorization.
 *
 * Body: { email, password, username, full_name }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify setup secret
    const setupSecret = process.env.SETUP_SECRET
    const providedSecret = request.headers.get("x-setup-secret")

    if (!setupSecret || providedSecret !== setupSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, password, username, full_name } = await request.json()

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "email, password, and username are required" },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Check if owner already exists
    const { data: existingOwner } = await admin
      .from("user_profiles")
      .select("id")
      .eq("role", "owner")
      .single()

    if (existingOwner) {
      return NextResponse.json(
        { error: "Owner already exists. Only one owner is allowed." },
        { status: 409 }
      )
    }

    // Create auth user via Supabase Admin API
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create matching user_profiles row (id must equal auth user id)
    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .insert({
        id: authUser.user.id,
        email,
        username,
        full_name: full_name || username,
        role: "owner",
        is_active: true,
        permissions: { all: true },
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await admin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Update existing data to belong to the new owner
    const tables = ["clients", "workers", "vehicles", "carts", "work_types", "jobs", "business_settings", "invoices"]
    for (const table of tables) {
      await admin
        .from(table)
        .update({ created_by_id: authUser.user.id })
        .is("created_by_id", null)
    }

    return NextResponse.json({
      success: true,
      message: "Owner account created successfully",
      user: {
        id: authUser.user.id,
        email,
        username,
        role: "owner",
      },
    })
  } catch (error: any) {
    console.error("Setup owner error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
