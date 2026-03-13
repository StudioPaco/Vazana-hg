import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Proxy (Next.js 16) — network boundary for auth.
 * Refreshes Supabase session on every request and protects
 * API routes + pages from unauthenticated access.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Start with a default "next" response so we can attach cookie updates
  let supabaseResponse = NextResponse.next({ request })

  // Create a Supabase server client that can read/write cookies on the request/response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Forward cookie writes to the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Also forward to the response (so browser receives the updated cookies)
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — this keeps the JWT alive and updates cookies
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --- Auth enforcement ---
  const isAuthRoute = pathname.startsWith("/auth")
  const isAuthApi = pathname.startsWith("/api/auth")
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")

  // Skip protection for auth routes, auth API, and static assets
  if (isAuthRoute || isAuthApi || isStaticAsset) {
    return supabaseResponse
  }

  // If not authenticated:
  if (!user) {
    // API routes → 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Page routes → redirect to login
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/auth/login"
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all routes except static files and images.
     * Auth routes are handled inside the function (not excluded from matcher)
     * so that Supabase session cookies are still refreshed on auth pages.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
