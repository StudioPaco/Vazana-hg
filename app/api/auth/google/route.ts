import { NextResponse } from "next/server"
import { getGoogleAuthUrl } from "@/lib/google-auth"

/**
 * GET /api/auth/google
 * Redirects the user to Google's OAuth consent screen.
 */
export async function GET() {
  try {
    const url = getGoogleAuthUrl()
    return NextResponse.redirect(url)
  } catch (err) {
    console.error("[api/auth/google] Failed to build auth URL:", err)
    return NextResponse.json(
      { error: "Failed to initiate Google OAuth" },
      { status: 500 }
    )
  }
}
