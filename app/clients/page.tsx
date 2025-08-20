"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import ClientsPage from "@/components/clients/clients-page"

export default function Clients() {
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
      <MainContent>
        <ClientsPage />
      </MainContent>
    </div>
  )
}
