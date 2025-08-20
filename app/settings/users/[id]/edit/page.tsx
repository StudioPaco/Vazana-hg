"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Save, User } from "lucide-react"
import SidebarNavigation, { useSidebar } from "@/components/layout/sidebar-navigation"

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const { isMinimized } = useSidebar()
  const [userData, setUserData] = useState({
    username: "",
    role: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    // Load user data based on ID
    if (params.id === "root") {
      setUserData({
        username: "root",
        role: "admin",
        email: "admin@vazana.com",
        phone: "050-1234567",
      })
    }
  }, [params.id])

  const handleSave = () => {
    console.log("[v0] Saving user data:", userData)
    alert("פרטי המשתמש נשמרו בהצלחה!")
    router.push("/settings")
  }

  const handleBack = () => {
    router.push("/settings")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNavigation />
      <div className={`${isMinimized ? "mr-20" : "mr-64"} p-6 transition-all duration-300`}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBack} className="font-hebrew bg-transparent">
              <ArrowRight className="ml-2 w-4 h-4" />
              חזור
            </Button>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-vazana-dark font-hebrew">עריכת משתמש</h1>
              <p className="text-gray-600 font-hebrew">ערוך פרטי משתמש במערכת</p>
            </div>
          </div>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between font-hebrew">
                <User className="w-5 h-5 text-vazana-teal" />
                <span>פרטי משתמש</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-hebrew text-right block">שם משתמש</Label>
                  <Input
                    value={userData.username}
                    onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                    className="text-right font-hebrew"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-hebrew text-right block">תפקיד</Label>
                  <Select value={userData.role} onValueChange={(value) => setUserData({ ...userData, role: value })}>
                    <SelectTrigger className="text-right font-hebrew">
                      <SelectValue placeholder="בחר תפקיד..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin" className="font-hebrew">
                        מנהל
                      </SelectItem>
                      <SelectItem value="user" className="font-hebrew">
                        משתמש
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-hebrew text-right block">אימייל</Label>
                  <Input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    className="text-right font-hebrew"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-hebrew text-right block">טלפון</Label>
                  <Input
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    className="text-right font-hebrew"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="flex justify-start gap-2 pt-4">
                <Button onClick={handleSave} className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
                  <Save className="ml-2 w-4 h-4" />
                  שמור שינויים
                </Button>
                <Button variant="outline" onClick={handleBack} className="font-hebrew bg-transparent">
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
