"use client"

import { toast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, User } from "lucide-react"
import PageLayout from "@/components/layout/page-layout"

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
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
    console.log("Saving user data:", userData)
    toast({ title: "פרטי המשתמש נשמרו בהצלחה!", variant: "success" })
    router.push("/settings")
  }

  const handleBack = () => {
    router.push("/settings")
  }

  return (
    <PageLayout
      title="עריכת משתמש"
      subtitle="ערוך פרטי משתמש במערכת"
      titleIcon={User}
      backHref="/settings"
      variant="form"
      maxWidth="2xl"
    >
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
    </PageLayout>
  )
}
