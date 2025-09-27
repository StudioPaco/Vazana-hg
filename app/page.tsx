"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-900 text-lg">טוען...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-right">וזאנה סטודיו - לוח בקרה</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
            <p className="text-sm text-gray-600">הכנסות החודש</p>
            <p className="text-2xl font-bold text-gray-900">₪0.00</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
            <p className="text-sm text-gray-600">עבודות פעילות</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
            <p className="text-sm text-gray-600">לקוחות פעילים</p>
            <p className="text-2xl font-bold text-gray-900">5</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
            <p className="text-sm text-gray-600">סך כל העבודות</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <a
            href="/jobs/new"
            className="bg-teal-500 text-white p-4 rounded-lg text-center hover:bg-teal-600 transition-colors"
          >
            יצירת עבודה חדשה
          </a>
          <a
            href="/invoices/new"
            className="bg-yellow-500 text-white p-4 rounded-lg text-center hover:bg-yellow-600 transition-colors"
          >
            הפקת חשבונית
          </a>
          <a
            href="/clients"
            className="bg-blue-500 text-white p-4 rounded-lg text-center hover:bg-blue-600 transition-colors"
          >
            ניהול לקוחות
          </a>
          <a
            href="/debug"
            className="bg-purple-500 text-white p-4 rounded-lg text-center hover:bg-purple-600 transition-colors"
          >
            בדיקת מסד נתונים
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">עבודות אחרונות</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">אין עבודות עדיין</p>
            <a
              href="/jobs/new"
              className="mt-3 inline-block bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
            >
              צור את העבודה הראשונה שלך
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
