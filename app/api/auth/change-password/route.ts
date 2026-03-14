import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, currentPassword, newPassword } = body

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const isSelf = userId === caller.id
    const { data: callerProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", caller.id)
      .single()

    const isAdmin = callerProfile?.role === "owner" || callerProfile?.role === "admin"

    // Only self or admin can change passwords
    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If self, verify current password first
    if (isSelf) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 })
      }

      // Get user email for verification
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("email, username")
        .eq("id", caller.id)
        .single()

      const email = userProfile?.email || userProfile?.username
      if (!email) {
        return NextResponse.json({ error: "Could not determine user email" }, { status: 500 })
      }

      // Verify current password by attempting sign-in
      const admin = createAdminClient()
      const { error: verifyError } = await admin.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (verifyError) {
        return NextResponse.json({ error: "סיסמה נוכחית שגויה" }, { status: 401 })
      }
    }

    // Update password via admin API
    const admin = createAdminClient()
    const { error: updateError } = await admin.auth.admin.updateUserById(
      userId || caller.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error("Password update failed:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
