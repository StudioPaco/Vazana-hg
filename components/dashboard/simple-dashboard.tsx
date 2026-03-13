"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { clientAuth } from "@/lib/client-auth"

export default function SimpleDashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const userData = await clientAuth.getCurrentUserAsync()
      if (userData) {
        setUser(userData)
      }
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    await clientAuth.logout()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vazana-yellow/10 to-vazana-teal/10 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-vazana-dark font-hebrew">ברוכים הבאים לוזאנה סטודיו</h1>
            <p className="text-vazana-dark/70 mt-2">מערכת ניהול עסקי מתקדמת</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-vazana-dark font-medium">שלום, {user?.username || "משתמש"}</span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-vazana-teal text-vazana-teal hover:bg-vazana-teal hover:text-white bg-transparent"
            >
              התנתק
            </Button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-vazana-dark font-hebrew">לקוחות</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-vazana-dark/70">ניהול לקוחות ופרטי קשר</p>
              <Button className="mt-4 bg-vazana-yellow hover:bg-vazana-yellow/90 text-vazana-dark">צפה בלקוחות</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-vazana-dark font-hebrew">עבודות</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-vazana-dark/70">ניהול עבודות ופרויקטים</p>
              <Button className="mt-4 bg-vazana-teal hover:bg-vazana-teal/90 text-white">צפה בעבודות</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-vazana-dark font-hebrew">חשבוניות</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-vazana-dark/70">ניהול חשבוניות ותשלומים</p>
              <Button className="mt-4 bg-vazana-yellow hover:bg-vazana-yellow/90 text-vazana-dark">
                צפה בחשבוניות
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-vazana-dark font-hebrew">עובדים</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-vazana-dark/70">ניהול עובדים ומשמרות</p>
              <Button className="mt-4 bg-vazana-teal hover:bg-vazana-teal/90 text-white">צפה בעובדים</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-vazana-dark font-hebrew">כלי רכב</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-vazana-dark/70">ניהול כלי רכב וציוד</p>
              <Button className="mt-4 bg-vazana-yellow hover:bg-vazana-yellow/90 text-vazana-dark">צפה בכלי רכב</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-vazana-dark font-hebrew">הגדרות</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-vazana-dark/70">הגדרות מערכת ומשתמשים</p>
              <Button className="mt-4 bg-vazana-teal hover:bg-vazana-teal/90 text-white">הגדרות</Button>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium text-center">🎉 ברוכים הבאים! המערכת פועלת בהצלחה עם אימות פשוט</p>
        </div>
      </div>
    </div>
  )
}
