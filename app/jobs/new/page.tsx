"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SidebarNavigation from "@/components/layout/sidebar-navigation"
import NewJobForm from "@/components/jobs/new-job-form"
import AppNavigation from "@/components/layout/app-navigation"
import { clientAuth } from "@/lib/client-auth"

export default function NewJobPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await clientAuth.isAuthenticatedAsync()
      if (isAuth) {
        setIsAuthenticated(true)
      } else {
        router.push("/auth/login")
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-vazana-yellow/10 to-vazana-teal/10">
        <div className="text-vazana-dark text-lg font-hebrew">טוען...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <SidebarNavigation />
      <div className="flex-1 mr-64 p-6">
        <AppNavigation />
        <NewJobForm />
      </div>
    </div>
  )
}
