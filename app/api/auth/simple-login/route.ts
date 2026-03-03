import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { signInWithUsername } from "@/lib/auth-custom"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Root auth from server-side env vars (not exposed to client)
    const rootUser = process.env.ROOT_USERNAME || "root"
    const rootPass = process.env.ROOT_PASSWORD || "10203040"

    if (username === rootUser && password === rootPass) {
      // Root user: set session cookie
      const cookieStore = await cookies()
      cookieStore.set("vazana-session", "authenticated-root", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return NextResponse.json({
        success: true,
        user: { id: "root", username: "root", role: "admin", full_name: "מנהל מערכת" },
      })
    }

    // DB user: use the unified auth-custom signIn which sets session_token cookie
    const result = await signInWithUsername(username, password)

    if (result.success && result.sessionToken) {
      // Also set vazana-session cookie for middleware compatibility
      const cookieStore = await cookies()
      cookieStore.set("vazana-session", result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      })
      cookieStore.set("session_token", result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      })

      // Fetch the user profile for the response
      const supabase = await createClient()
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("id, username, role, full_name, email")
        .eq("username", username)
        .single()

      return NextResponse.json({
        success: true,
        user: userProfile || { username, role: "user" },
      })
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
