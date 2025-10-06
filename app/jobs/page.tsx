"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import JobsPage from "@/components/jobs/jobs-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import AppNavigation from "@/components/layout/app-navigation"

export default function Jobs() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("vazana_logged_in")

      if (loggedIn === "true") {
        setIsLoggedIn(true)
      } else {
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
          <AppNavigation />
          <JobsPage />
        </div>
      </MainContent>

      {/* Sidebar Navigation */}
      <SidebarNavigation />
    </div>
  )
}
