"use server"

import { signInWithUsername, signOutUser, getCurrentSession } from "@/lib/auth-custom"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const username = formData.get("username")
  const password = formData.get("password")

  if (!username || !password) {
    return { error: "Username and password are required" }
  }

  try {
    const result = await signInWithUsername(username.toString(), password.toString())

    if (!result.success) {
      return { error: result.error || "Login failed" }
    }

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set("session_token", result.sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const session = await getCurrentSession()
  if (session) {
    await signOutUser(session.session_token)
  }

  const cookieStore = cookies()
  cookieStore.delete("session_token")
  redirect("/auth/login")
}

// Add placeholder signUp function to prevent import errors
export async function signUp() {
  // Registration is disabled - users are managed through admin settings
  return { error: "Registration is disabled. Contact administrator for account creation." }
}
