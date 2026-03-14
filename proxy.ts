import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Proxy (Next.js 16) — network boundary for auth.
 * Refreshes Supabase session on every request and protects
 * API routes + pages from unauthenticated access.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Route classification (BEFORE any Supabase calls) ---
  const isAuthRoute = pathname.startsWith("/auth")
  const isAuthApi = pathname.startsWith("/api/auth")
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")

  // Auth routes, auth API, and static assets: pass through immediately.
  // Do NOT call getUser() here — if Supabase is slow/down, it blocks everything.
  if (isAuthRoute || isAuthApi || isStaticAsset) {
    return NextResponse.next({ request })
  }

  // --- Protected routes: check session ---
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Race getUser against a 4-second timeout to prevent hanging
  let user = null
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
    const authResult = await Promise.race([
      supabase.auth.getUser().then((r) => r.data.user),
      timeout,
    ])
    user = authResult
  } catch {
    // Auth check failed — treat as unauthenticated
    user = null
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
