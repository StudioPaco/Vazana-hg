import { NextResponse } from "next/server"

// Minimal middleware - passes everything through
// Auth is handled client-side via localStorage
// Data security is handled by Supabase RLS policies
export function middleware() {
  return NextResponse.next()
}

// Match nothing - effectively disable middleware
export const config = {
  matcher: [],
}
