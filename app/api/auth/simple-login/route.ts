import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Root auth from env vars
    const rootUser = process.env.NEXT_PUBLIC_ROOT_USERNAME || "root"
    const rootPass = process.env.NEXT_PUBLIC_ROOT_PASSWORD || "10203040"
    if (username === rootUser && password === rootPass) {
      // Set a simple session cookie
      const cookieStore = await cookies()
      cookieStore.set("vazana-session", "authenticated-root", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return NextResponse.json({ success: true, user: { username: "root", role: "admin" } })
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
