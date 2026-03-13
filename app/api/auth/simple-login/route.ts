import { type NextRequest, NextResponse } from "next/server"
import { signInWithUsername } from "@/lib/auth-custom"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Root auth from server-side env vars (not exposed to client)
    const rootUser = process.env.ROOT_USERNAME || "root"
    const rootPass = process.env.ROOT_PASSWORD || "10203040"

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    }

    if (username === rootUser && password === rootPass) {
      // Root user: create response with session cookie
      const response = NextResponse.json({
        success: true,
        user: { id: "root", username: "root", role: "admin", full_name: "מנהל מערכת" },
      })
      
      // Set cookies directly on the response object
      response.cookies.set("vazana-session", "authenticated-root", cookieOptions)
      response.cookies.set("session_token", "authenticated-root", cookieOptions)
      
      return response
    }

    // DB user: use the unified auth-custom signIn
    const result = await signInWithUsername(username, password)

    if (result.success && result.sessionToken) {
      // Fetch the user profile for the response
      const supabase = await createClient()
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("id, username, role, full_name, email")
        .eq("username", username)
        .single()

      const response = NextResponse.json({
        success: true,
        user: userProfile || { username, role: "user" },
      })
      
      // Set cookies directly on the response object
      response.cookies.set("vazana-session", result.sessionToken, cookieOptions)
      response.cookies.set("session_token", result.sessionToken, cookieOptions)
      
      return response
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
