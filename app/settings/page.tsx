"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Settings, User, Bell, Palette, Shield, Globe, Download, Save } from "lucide-react"
import SidebarNavigation from "@/components/layout/sidebar-navigation"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [language, setLanguage] = useState("he")

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNavigation />
      <div className="mr-64 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-right">
            <h1 className="text-3xl font-bold text-vazana-dark font-hebrew">הגדרות</h1>
            <p className="text-gray-600 font-hebrew">נהל העדפות אפליקציה ומידע עסקי</p>
          </div>

          <Tabs defaultValue="general" className="space-y-6" dir="rtl">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="font-hebrew">
                כללי
              </TabsTrigger>
              <TabsTrigger value="business" className="font-hebrew">
                פרטי עסק
              </TabsTrigger>
              <TabsTrigger value="users" className="font-hebrew">
                משתמשים
              </TabsTrigger>
              <TabsTrigger value="integrations" className="font-hebrew">
                אינטגרציות
              </TabsTrigger>
              <TabsTrigger value="data" className="font-hebrew">
                נתונים
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew">
                    <Bell className="w-5 h-5" />
                    התראות
                  </CardTitle>
                  <CardDescription className="font-hebrew">
                    קבל התראות דוא"ל על עדכונים חשובים (ניתן להקיף בקרוב).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                    <Label className="font-hebrew">התראות</Label>
                  </div>
                  <div className="flex items-center justify-between">
                    <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                    <Label className="font-hebrew">התראות דוא"ל</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew">
                    <Palette className="w-5 h-5" />
                    מראה ותצוגה
                  </CardTitle>
                  <CardDescription className="font-hebrew">
                    מצב כהה עדכן נושא בהתאמה (ניתן להקיף בקרוב).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 text-gray-500 font-hebrew">
                    <Palette className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>הגדרות מראה יהיו זמינות בקרוב</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew">
                    <Globe className="w-5 h-5" />
                    שפה
                  </CardTitle>
                  <CardDescription className="font-hebrew">בחר את שפת המממשק המועדפת עליך.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant={language === "he" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLanguage("he")}
                        className="font-hebrew"
                      >
                        עברית
                      </Button>
                      <Button
                        variant={language === "en" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLanguage("en")}
                      >
                        English
                      </Button>
                    </div>
                    <Label className="font-hebrew">שפת ממשק</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Info */}
            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew">
                    <User className="w-5 h-5" />
                    פרטי עסק
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-hebrew">שם החברה</Label>
                      <Input defaultValue="וזאנה אבטחת כבישים" className="text-right font-hebrew" dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-hebrew">ח.פ / ע.מ</Label>
                      <Input placeholder="הזן מספר חברה..." className="text-right font-hebrew" dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-hebrew">כתובת</Label>
                      <Input placeholder="הזן כתובת..." className="text-right font-hebrew" dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-hebrew">טלפון</Label>
                      <Input placeholder="הזן מספר טלפון..." className="text-right font-hebrew" dir="rtl" />
                    </div>
                  </div>
                  <Button className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
                    <Save className="ml-2 w-4 h-4" />
                    שמור שינויים
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew">
                    <Shield className="w-5 h-5" />
                    ניהול משתמשים
                  </CardTitle>
                  <CardDescription className="font-hebrew">נהל משתמשים והרשאות מערכת.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-vazana-teal text-white">מנהל</Badge>
                        <Button variant="outline" size="sm" className="font-hebrew bg-transparent">
                          ערוך
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold font-hebrew">root</p>
                        <p className="text-sm text-gray-600 font-hebrew">מנהל מערכת</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integrations */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew">
                    <Settings className="w-5 h-5" />
                    גישה ואינטגרציות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500 font-hebrew">
                    <Settings className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>אינטגרציות יהיו זמינות בקרוב</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Management */}
            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew">
                    <Download className="w-5 h-5" />
                    יצוא נתונים
                  </CardTitle>
                  <CardDescription className="font-hebrew">הורד את הנתונים האפליקציה שלך בפורמט CSV.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="font-hebrew bg-transparent">
                      <Download className="ml-2 w-4 h-4" />
                      יצא עבודות (CSV)
                    </Button>
                    <Button variant="outline" className="font-hebrew bg-transparent">
                      <Download className="ml-2 w-4 h-4" />
                      יצא לקוחות (CSV)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
