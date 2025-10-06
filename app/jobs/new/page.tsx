"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SidebarNavigation from "@/components/layout/sidebar-navigation"
import NewJobForm from "@/components/jobs/new-job-form"
import AppNavigation from "@/components/layout/app-navigation"

export default function NewJobPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loggedIn = localStorage.getItem("vazana_logged_in")
    if (loggedIn === "true") {
      setIsAuthenticated(true)
    } else {
      router.push("/auth/login")
    }
  }, [router])

  if (!isAuthenticated) {
    return <div>Loading...</div>
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
