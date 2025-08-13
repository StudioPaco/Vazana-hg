import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function middleware(req: NextRequest) {
  const response = NextResponse.next()

  // Check if this is an auth route
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth/login")

  if (!isAuthRoute) {
    // Check for session token
    const sessionToken = req.cookies.get("session_token")?.value

    if (!sessionToken) {
      const redirectUrl = new URL("/auth/login", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Verify session token
    const supabase = createClient()
    const { data: session, error } = await supabase
      .from("user_sessions")
      .select("*, user_profiles!inner(*)")
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error || !session || !session.user_profiles.is_active) {
      // Invalid or expired session, redirect to login
      const redirectUrl = new URL("/auth/login", req.url)
      const redirectResponse = NextResponse.redirect(redirectUrl)
      redirectResponse.cookies.delete("session_token")
      return redirectResponse
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
