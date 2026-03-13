import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getCurrentSession, signOutUser } from "@/lib/auth-custom"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/auth/session
 * Returns the current authenticated user from the cookie-based session.
 * This is the source of truth for authentication state.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const vazanaSession = cookieStore.get("vazana-session")?.value
    const sessionToken = cookieStore.get("session_token")?.value

    // Check for root user session
    if (vazanaSession === "authenticated-root") {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: "root",
          username: "root",
          role: "admin",
          full_name: "מנהל מערכת",
          email: "root@vazana.local",
        },
        sessionType: "root",
      })
    }

    // Check for DB user session via session_token
    if (sessionToken) {
      const session = await getCurrentSession()
      if (session?.user) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: session.user.id,
            username: session.user.username,
            role: session.user.role,
            full_name: session.user.full_name,
            is_active: session.user.is_active,
            permissions: session.user.permissions,
          },
          sessionType: "database",
          expiresAt: session.expires_at,
        })
      }
    }

    // Also check vazana-session for non-root tokens (from simple-login)
    if (vazanaSession && vazanaSession !== "authenticated-root") {
      // This is a session token stored in vazana-session
      const supabase = await createClient()
      const { data: sessionData } = await supabase
        .from("user_sessions")
        .select(`
          *,
          user_profiles!inner(id, username, full_name, role, is_active, permissions, email)
        `)
        .eq("session_token", vazanaSession)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (sessionData?.user_profiles) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: sessionData.user_profiles.id,
            username: sessionData.user_profiles.username,
            role: sessionData.user_profiles.role,
            full_name: sessionData.user_profiles.full_name,
            email: sessionData.user_profiles.email,
            is_active: sessionData.user_profiles.is_active,
            permissions: sessionData.user_profiles.permissions,
          },
          sessionType: "database",
          expiresAt: sessionData.expires_at,
        })
      }
    }

    return NextResponse.json({ authenticated: false })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ authenticated: false, error: "Session check failed" })
  }
}

/**
 * DELETE /api/auth/session
 * Logs out the current user by clearing session cookies and DB session.
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value || cookieStore.get("vazana-session")?.value

    // Clear DB session if exists
    if (sessionToken && sessionToken !== "authenticated-root") {
      await signOutUser(sessionToken)
    }

    // Clear all auth cookies
    cookieStore.delete("vazana-session")
    cookieStore.delete("session_token")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
