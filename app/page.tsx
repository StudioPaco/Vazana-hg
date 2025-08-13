"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/dashboard/dashboard"

export default function HomePage() {
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-vazana-dark">טוען...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return <Dashboard />
}
