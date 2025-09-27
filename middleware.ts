// Disabled middleware to prevent routing loop with localStorage auth
import { NextResponse } from "next/server"
import type { NextRequest } from "next/request"

export async function middleware(req: NextRequest) {
  // Middleware disabled to prevent conflicts with localStorage-based authentication
  // The client-side authentication in app/page.tsx handles all auth logic
  return NextResponse.next()
}

export const config = {
  // Empty matcher array means middleware won't run on any routes
  matcher: [],
}
