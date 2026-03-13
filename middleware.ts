import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware for route handling.
 * 
 * NOTE: This app uses a hybrid auth model:
 * - Client-side auth via localStorage (primary)
 * - Session cookies for enhanced security (optional)
 * - Supabase RLS policies for database-level security
 * 
 * API routes do NOT require cookie auth - they rely on:
 * 1. Client-side auth checks (pages redirect unauthenticated users)
 * 2. Supabase RLS policies for actual data access control
 */
export function middleware(request: NextRequest) {
  // Allow all requests through - auth is handled by:
  // 1. Client-side localStorage checks on pages
  // 2. Supabase RLS policies on data access
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match if we need to do something in middleware later
    // Currently just passing through all requests
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
