import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware for route protection.
 * Checks for session cookie on protected routes.
 * The primary auth is client-side (localStorage), but this provides
 * server-side protection for API routes and prevents direct URL access.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for session cookies (either auth system)
  const hasSession =
    request.cookies.get("vazana-session")?.value ||
    request.cookies.get("session_token")?.value

  // Protect API routes (except auth endpoints)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    if (!hasSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match API routes except auth, static files, and images.
     * Page-level auth is handled client-side via localStorage.
     */
    "/api/:path*",
  ],
}
