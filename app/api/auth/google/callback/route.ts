import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens, getGoogleUserInfo } from "@/lib/google-auth"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/auth/google/callback
 * Receives the OAuth callback from Google, exchanges the code for tokens,
 * stores them in the google_tokens table, and redirects to settings.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  // User denied consent or some other error from Google
  if (error) {
    console.error("[api/auth/google/callback] OAuth error:", error)
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&google=error", request.url)
    )
  }

  if (!code) {
    console.error("[api/auth/google/callback] Missing code parameter")
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&google=error", request.url)
    )
  }

  try {
    // 1. Get current Supabase user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[api/auth/google/callback] No authenticated user")
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    // 2. Exchange auth code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // 3. Get Google user info (email)
    const googleUser = await getGoogleUserInfo(tokens.access_token)

    // 4. Upsert tokens into google_tokens via admin client (bypasses RLS)
    const admin = createAdminClient()
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString()

    const { error: upsertError } = await (admin.from("google_tokens") as any).upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        scope: tokens.scope,
        google_email: googleUser.email,
      },
      { onConflict: "user_id" }
    )

    if (upsertError) {
      console.error("[api/auth/google/callback] Token upsert failed:", upsertError)
      return NextResponse.redirect(
        new URL("/settings?tab=integrations&google=error", request.url)
      )
    }

    // 5. Redirect to settings with success
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&google=success", request.url)
    )
  } catch (err) {
    console.error("[api/auth/google/callback] Unexpected error:", err)
    return NextResponse.redirect(
      new URL("/settings?tab=integrations&google=error", request.url)
    )
  }
}
