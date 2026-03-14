"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  username: string
  email: string
  full_name: string
  role: "owner" | "admin" | "staff"
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isAuthRoute = pathname.startsWith("/auth")

  useEffect(() => {
    // Get initial session with safety timeout
    const getSession = async () => {
      try {
        // Race the auth check against a timeout to prevent infinite loading
        const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null } }), 5000)
        )
        const { data: { user: currentUser } } = await Promise.race([
          supabase.auth.getUser(),
          timeoutPromise,
        ])
        setUser(currentUser)

        if (currentUser) {
          // Fetch user profile for role/name info
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("id, username, email, full_name, role")
            .eq("id", currentUser.id)
            .single()

          setProfile(userProfile)
        } else {
          // No valid session — clear any stale cookies/tokens
          await supabase.auth.signOut().catch(() => {})
          if (!isAuthRoute) {
            router.replace("/auth/login")
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        // Clear stale session on error
        await supabase.auth.signOut().catch(() => {})
        if (!isAuthRoute) {
          router.replace("/auth/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("id, username, email, full_name, role")
            .eq("id", currentUser.id)
            .single()

          setProfile(userProfile)
        } else {
          setProfile(null)
          if (!isAuthRoute) {
            router.replace("/auth/login")
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Show loading state while checking auth (except on auth pages)
  if (isLoading && !isAuthRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-vazana-yellow/10 to-vazana-teal/10">
        <div className="text-vazana-dark text-lg font-hebrew">טוען...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
