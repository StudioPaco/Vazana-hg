import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "שם משתמש וסיסמה נדרשים" },
        { status: 400 }
      )
    }

    // Use admin client to look up username (bypasses RLS — user isn't authenticated yet)
    const admin = createAdminClient()

    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .select("email, username, is_active")
      .eq("username", username)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "שם משתמש או סיסמה שגויים" },
        { status: 401 }
      )
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: "חשבון זה אינו פעיל" },
        { status: 403 }
      )
    }

    // Authenticate via Supabase Auth using the email
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: "שם משתמש או סיסמה שגויים" },
        { status: 401 }
      )
    }

    // Session cookies are automatically set by @supabase/ssr via the server client
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: profile.username,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "אירעה שגיאה בלתי צפויה" },
      { status: 500 }
    )
  }
}
