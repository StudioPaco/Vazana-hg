"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SimpleDashboard from "@/components/dashboard/simple-dashboard"

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("vazana_logged_in")
      console.log("Checking authentication state:", loggedIn)

      if (loggedIn === "true") {
        console.log("User is authenticated, showing dashboard")
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

  return <SimpleDashboard />
}
