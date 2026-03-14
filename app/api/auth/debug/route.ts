import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/auth/debug
 * Diagnostic endpoint — shows auth state and user_profiles status.
 * Helps troubleshoot RLS / profile issues remotely.
 */
export async function GET() {
  const result: Record<string, unknown> = {}

  try {
    // 1. Check server-side auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    result.auth = user
      ? { id: user.id, email: user.email, authenticated: true }
      : { authenticated: false, error: authError?.message }

    // 2. If authenticated, check profile via user's session (RLS applies)
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, username, email, full_name, role, is_active")
        .eq("id", user.id)
        .single()

      result.profile_via_session = profile || { error: profileError?.message, code: profileError?.code }

      // 3. Check profile via admin (bypasses RLS)
      try {
        const admin = createAdminClient()
        const { data: adminProfile, error: adminError } = await admin
          .from("user_profiles")
          .select("id, username, email, full_name, role, is_active")
          .eq("id", user.id)
          .single()

        result.profile_via_admin = adminProfile || { error: adminError?.message, code: adminError?.code }

        // 4. Count all profiles (admin)
        const { data: allProfiles, error: allError } = await admin
          .from("user_profiles")
          .select("id, username, role, is_active")

        result.all_profiles = allProfiles || { error: allError?.message }
      } catch (adminErr: any) {
        result.admin_error = adminErr.message
      }
    }
  } catch (error: any) {
    result.error = error.message
  }

  return NextResponse.json(result, { status: 200 })
}
