import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export interface User {
  id: string
  username: string
  full_name: string
  role: string
  is_active: boolean
  permissions: Record<string, any>
}

export interface Session {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  user?: User
}

// Generate a simple session token
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Simple password verification (in production, use bcrypt)
function verifyPassword(inputPassword: string, storedPassword: string): boolean {
  return inputPassword === storedPassword
}

// Verify token and return user if valid
export async function verifyToken(token: string): Promise<User | null> {
  const supabase = createClient()

  const { data: session, error } = await supabase
    .from("user_sessions")
    .select(`
      *,
      user_profiles!inner(*)
    `)
    .eq("session_token", token)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (error || !session) {
    return null
  }

  return {
    id: session.user_profiles.id,
    username: session.user_profiles.username,
    full_name: session.user_profiles.full_name,
    role: session.user_profiles.role,
    is_active: session.user_profiles.is_active,
    permissions: session.user_profiles.permissions,
  }
}

// Create a new session
export async function createSession(userId: string): Promise<string> {
  const supabase = createClient()
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { error } = await supabase.from("user_sessions").insert({
    user_id: userId,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    throw new Error("Failed to create session")
  }

  return sessionToken
}

// Get current session
export async function getCurrentSession(): Promise<Session | null> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get("session_token")?.value

  if (!sessionToken) {
    return null
  }

  const supabase = createClient()
  const { data: session, error } = await supabase
    .from("user_sessions")
    .select(`
      *,
      user_profiles!inner(*)
    `)
    .eq("session_token", sessionToken)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (error || !session) {
    return null
  }

  return {
    id: session.id,
    user_id: session.user_id,
    session_token: session.session_token,
    expires_at: session.expires_at,
    user: {
      id: session.user_profiles.id,
      username: session.user_profiles.username,
      full_name: session.user_profiles.full_name,
      role: session.user_profiles.role,
      is_active: session.user_profiles.is_active,
      permissions: session.user_profiles.permissions,
    },
  }
}

// Sign in with username and password
export async function signInWithUsername(
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string; sessionToken?: string }> {
  const supabase = createClient()

  // Find user by username
  const { data: user, error: userError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .single()

  if (userError || !user) {
    return { success: false, error: "Invalid username or password" }
  }

  // Verify password
  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, error: "Invalid username or password" }
  }

  // Update last login
  await supabase.from("user_profiles").update({ last_login: new Date().toISOString() }).eq("id", user.id)

  // Create session
  try {
    const sessionToken = await createSession(user.id)
    return { success: true, sessionToken }
  } catch (error) {
    return { success: false, error: "Failed to create session" }
  }
}

// Sign out
export async function signOutUser(sessionToken?: string) {
  if (sessionToken) {
    const supabase = createClient()
    await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession()
  return session?.user || null
}
