"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import JobsPage from "@/components/jobs/jobs-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import AppNavigation from "@/components/layout/app-navigation"
import { clientAuth } from "@/lib/client-auth"

export default function Jobs() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await clientAuth.isAuthenticatedAsync()
      if (isAuth) {
        setIsLoggedIn(true)
      } else {
        router.push("/auth/login")
      }
      setIsLoading(false)
    }
    checkAuth()
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
          <AppNavigation />
          <JobsPage />
        </div>
      </MainContent>

      {/* Sidebar Navigation */}
      <SidebarNavigation />
    </div>
  )
}
