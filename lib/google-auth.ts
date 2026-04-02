/**
 * Google OAuth 2.0 utilities for token management.
 * Uses raw fetch — no external Google libraries needed.
 */

import { createAdminClient } from "@/lib/supabase/admin"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

const SCOPES = [
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive.file",
].join(" ")

function getRedirectUri(): string {
  if (process.env.VERCEL_URL) {
    return "https://vazana.vercel.app/api/auth/google/callback"
  }
  return "http://localhost:3000/api/auth/google/callback"
}

function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID
  if (!id) throw new Error("Missing GOOGLE_CLIENT_ID environment variable")
  return id
}

function getClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!secret) throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable")
  return secret
}

/**
 * Build the Google OAuth consent URL.
 * Uses `access_type=offline` + `prompt=consent` to guarantee a refresh_token.
 */
export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
  id_token?: string
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google token exchange failed (${res.status}): ${body}`)
  }

  return res.json()
}

/**
 * Use a refresh token to obtain a new access token.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google token refresh failed (${res.status}): ${body}`)
  }

  return res.json()
}

/**
 * Fetch the Google user profile (email, name, picture) using an access token.
 */
export async function getGoogleUserInfo(
  accessToken: string
): Promise<{ email: string; name: string; picture: string }> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch Google user info (${res.status})`)
  }

  return res.json()
}

/**
 * Get a valid (non-expired) access token for a user.
 * Refreshes automatically if the current token is expired or about to expire.
 * Returns null if no token exists for this user.
 */
export async function getValidToken(userId: string): Promise<string | null> {
  const admin = createAdminClient()

  const { data: row, error } = await (admin.from("google_tokens") as any)
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error || !row) return null

  // Check if token expires within the next 60 seconds
  const expiresAt = new Date(row.expires_at).getTime()
  const now = Date.now()

  if (expiresAt - now > 60_000) {
    // Token is still valid
    return row.access_token as string
  }

  // Token expired or about to expire — refresh it
  if (!row.refresh_token) {
    console.error("[google-auth] No refresh token available for user", userId)
    return null
  }

  try {
    const refreshed = await refreshAccessToken(row.refresh_token)
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

    await (admin.from("google_tokens") as any)
      .update({
        access_token: refreshed.access_token,
        expires_at: newExpiresAt,
      })
      .eq("user_id", userId)

    return refreshed.access_token
  } catch (err) {
    console.error("[google-auth] Token refresh failed:", err)
    return null
  }
}
