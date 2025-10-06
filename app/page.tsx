"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import MainDashboard from "@/components/dashboard/main-dashboard"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import { clientAuth } from "@/lib/client-auth"

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authenticated = clientAuth.isAuthenticated()
      console.log("Checking authentication state:", authenticated)

      if (authenticated) {
        const user = clientAuth.getCurrentUser()
        console.log("User is authenticated:", user?.username)
        setIsLoggedIn(true)
      } else {
        console.log("User not authenticated, redirecting to login")
        router.push("/auth/login")
      }
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-vazana-yellow/10 to-vazana-teal/10">
        <div className="text-vazana-dark text-lg font-hebrew">טוען...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <MainDashboard />
        </div>
      </MainContent>

      {/* Sidebar Navigation */}
      <SidebarNavigation />
    </div>
  )
}
