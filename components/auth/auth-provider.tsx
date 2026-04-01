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

  // Fetch profile via server API (reliable — avoids browser cookie issues)
  const fetchProfile = async (): Promise<UserProfile | null> => {
    try {
      const res = await fetch("/api/auth/profile")
      if (!res.ok) return null
      const data = await res.json()
      return data.profile ?? null
    } catch {
      return null
    }
  }

  useEffect(() => {
    const getSession = async (retryCount = 0) => {
      try {
        const res = await fetch("/api/auth/profile")
        const data = res.ok ? await res.json() : { user: null, profile: null }

        if (data.user && data.profile) {
          setUser({ id: data.user.id, email: data.user.email } as User)
          setProfile(data.profile)
        } else if (retryCount < 2) {
          // Retry — session cookie may not have propagated yet after login
          setTimeout(() => getSession(retryCount + 1), 800)
          return
        } else {
          setUser(null)
          setProfile(null)
          if (!isAuthRoute) {
            router.replace("/auth/login")
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        if (retryCount < 2) {
          setTimeout(() => getSession(retryCount + 1), 800)
          return
        }
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
          const profile = await fetchProfile()
          setProfile(profile)
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
