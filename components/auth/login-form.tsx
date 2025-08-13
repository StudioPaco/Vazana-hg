"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { clientAuth } from "@/lib/client-auth"

export default function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    const user = clientAuth.login(username, password)

    if (user) {
      router.push("/")
    } else {
      setError("שם משתמש או סיסמה שגויים")
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-gray-200">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 bg-[#FFCC00] rounded-lg flex items-center justify-center">
          <Building2 className="h-6 w-6 text-[#1A1A1A]" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-[#1A1A1A]">ברוכים הבאים</CardTitle>
          <CardDescription className="text-lg text-gray-600">התחברות לוזאנה סטודיו</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-right">{error}</div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-[#1A1A1A] text-right">
                שם משתמש
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="root"
                required
                autoComplete="username"
                className="h-12 text-base border-gray-300 focus:border-[#00DAC0] text-right"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A] text-right">
                סיסמה
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-12 text-base border-gray-300 focus:border-[#00DAC0]"
                dir="ltr"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFCC00] hover:bg-[#E6B800] text-[#1A1A1A] py-6 text-lg font-medium rounded-lg h-[60px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                מתחבר...
              </>
            ) : (
              "התחבר"
            )}
          </Button>

          <div className="text-center text-gray-500 text-sm">משתמש ברירת מחדל: root | סיסמה: 10203040</div>
        </form>
      </CardContent>
    </Card>
  )
}
