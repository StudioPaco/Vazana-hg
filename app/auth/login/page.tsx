"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Check if already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = localStorage.getItem("vazana_logged_in")
      if (isLoggedIn === "true") {
        router.push("/")
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login attempt:", { username, password }) // Added debug logging
    setIsLoading(true)
    setError("")

    // Add small delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Simple hardcoded authentication
    if (username === "root" && password === "10203040") {
      console.log("Login successful") // Added debug logging
      localStorage.setItem("vazana_logged_in", "true")
      localStorage.setItem(
        "vazana_user",
        JSON.stringify({
          username: "root",
          email: "root@vazana.com",
          role: "admin",
        }),
      )
      router.push("/")
    } else {
      console.log("Login failed") // Added debug logging
      setError("שם משתמש או סיסמה שגויים") // Invalid username or password in Hebrew
    }

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-vazana-yellow/10 to-vazana-teal/10 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-vazana-yellow">
            <svg className="h-6 w-6 text-vazana-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-vazana-dark">ברוכים הבאים</CardTitle>
          <CardDescription className="text-vazana-dark/70">התחברות לוזאנה סטודיו</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-right block text-vazana-dark">
                שם משתמש
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-left"
                placeholder="root"
                autoComplete="username" // Added missing autocomplete attribute
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-right block text-vazana-dark">
                סיסמה
              </Label>
              <div className="relative">
                {" "}
                {/* Added password visibility toggle container */}
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-left pr-10"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-vazana-yellow hover:bg-vazana-yellow/90 text-vazana-dark font-medium transition-all duration-200 active:scale-95" // Added visual feedback
              disabled={isLoading}
            >
              {isLoading ? "מתחבר..." : "התחבר"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">משתמש ברירת מחדל: root | סיסמה: 10203040</div>
        </CardContent>
      </Card>
    </div>
  )
}
