"use server"

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
    // Simple hardcoded authentication for now
    if (username.toString() === "root" && password.toString() === "10203040") {
      // Set a simple session cookie
      const cookieStore = await cookies()
      cookieStore.set("vazana-session", "authenticated-root", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return { success: true }
    }

    return { error: "שם משתמש או סיסמה שגויים" } // Invalid username or password in Hebrew
  } catch (error) {
    console.error("Login error:", error)
    return { error: "אירעה שגיאה בלתי צפויה. אנא נסה שוב." } // Unexpected error in Hebrew
  }
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete("vazana-session")
  redirect("/auth/login")
}

// Add placeholder signUp function to prevent import errors
export async function signUp() {
  // Registration is disabled - users are managed through admin settings
  return { error: "הרשמה מבוטלת. פנה למנהל המערכת ליצירת חשבון." } // Registration disabled in Hebrew
}
