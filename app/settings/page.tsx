"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings,
  Bell,
  Palette,
  Globe,
  Download,
  Save,
  Plus,
  Edit,
  Trash2,
  Users,
  Briefcase,
  Car,
  ShoppingCart,
  Calendar,
  DollarSign,
  Clock,
  Lock,
} from "lucide-react"
import SidebarNavigation, { useSidebar } from "@/components/layout/sidebar-navigation"
import Link from "next/link"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [language, setLanguage] = useState("he")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [companyData, setCompanyData] = useState({
    name: "וזאנה אבטחת כבישים",
    email: "",
    registration: "",
    address: "",
    phone: "",
  })
  const [users, setUsers] = useState([{ id: "root", username: "root", role: "מנהל", description: "מנהל מערכת" }])

  const { isMinimized } = useSidebar()

  const handleSaveBusinessDetails = () => {
    localStorage.setItem("vazana_company_data", JSON.stringify(companyData))
    alert("פרטי העסק נשמרו בהצלחה!")
  }

  const handleAddUser = (userData: any) => {
    console.log("[v0] Adding new user:", userData)
    const newUser = {
      id: Date.now().toString(),
      username: userData.username || "משתמש חדש",
      role: userData.role === "admin" ? "מנהל" : "משתמש",
      description: userData.role === "admin" ? "מנהל מערכת" : "משתמש רגיל",
    }
    setUsers((prev) => [...prev, newUser])
    setIsAddUserOpen(false)
    alert("משתמש חדש נוסף בהצלחה!")
  }

  const handleEditUser = (userId: string) => {
    console.log("[v0] Editing user:", userId)
    window.location.href = `/settings/users/${userId}/edit`
  }

  const handleDeleteUser = (userId: string) => {
    console.log("[v0] Deleting user:", userId)
    if (confirm("האם אתה בטוח שברצונך למחוק את המשתמש?")) {
      setUsers((prev) => prev.filter((user) => user.id !== userId))
      alert("משתמש נמחק בהצלחה!")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNavigation />
      <div className={`${isMinimized ? "mr-20" : "mr-64"} p-6 transition-all duration-300`}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-right">
            <h1 className="text-3xl font-bold text-vazana-dark font-hebrew">הגדרות</h1>
            <p className="text-gray-600 font-hebrew">נהל העדפות אפליקציה ומידע עסקי</p>
          </div>

          <Tabs defaultValue="general" className="space-y-6" dir="rtl">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general" className="font-hebrew">
                כללי
              </TabsTrigger>
              <TabsTrigger value="business" className="font-hebrew">
                פרטי עסק
              </TabsTrigger>
              <TabsTrigger value="users" className="font-hebrew">
                משתמשים
              </TabsTrigger>
              <TabsTrigger value="resources" className="font-hebrew">
                ניהול משאבים
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
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Bell className="w-5 h-5 text-vazana-teal" />
                    <span>התראות</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
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
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Palette className="w-5 h-5 text-vazana-teal" />
                    <span>מראה ותצוגה</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    התאם את מראה המערכת לפי העדפותיך.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Switch />
                    <Label className="font-hebrew">מצב כהה</Label>
                  </div>
                  <div className="flex items-center justify-between">
                    <Switch defaultChecked />
                    <Label className="font-hebrew">הצגת סרגל צד</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Lock className="w-5 h-5 text-vazana-teal" />
                    <span>אבטחה ופרטיות</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    הגדרות אבטחה ופרטיות יהיו זמינות בקרוב.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500 font-hebrew">
                    <Lock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>הגדרות אבטחה ופרטיות יהיו זמינות בקרוב</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Globe className="w-5 h-5 text-vazana-teal" />
                    <span>שפה</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">בחר את שפת המממשק המועדפת עליך.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant={language === "he" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLanguage("he")}
                        className="font-hebrew bg-vazana-teal hover:bg-vazana-teal/90"
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
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Briefcase className="w-5 h-5 text-vazana-teal" />
                    <span>פרטי עסק</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">שם החברה</Label>
                      <Input
                        value={companyData.name}
                        onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                        className="text-right font-hebrew"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">אימייל החברה</Label>
                      <Input
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                        placeholder="הזן אימייל החברה..."
                        className="text-right font-hebrew"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">ח.פ / ע.מ</Label>
                      <Input
                        value={companyData.registration}
                        onChange={(e) => setCompanyData({ ...companyData, registration: e.target.value })}
                        placeholder="הזן מספר חברה..."
                        className="text-right font-hebrew"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">כתובת</Label>
                      <Input
                        value={companyData.address}
                        onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                        placeholder="הזן כתובת..."
                        className="text-right font-hebrew"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">טלפון</Label>
                      <Input
                        value={companyData.phone}
                        onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                        placeholder="הזן מספר טלפון..."
                        className="text-right font-hebrew"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveBusinessDetails}
                    className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
                  >
                    <Save className="ml-2 w-4 h-4" />
                    שמור שינויים
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <DollarSign className="w-5 h-5 text-vazana-teal" />
                    <span>הגדרת כספים</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block">אחוז מע"מ ברירת מחדל (%)</Label>
                    <Input defaultValue="18" className="text-right font-hebrew" dir="rtl" />
                    <p className="text-sm text-gray-600 font-hebrew text-right">
                      הגדר את שיעור המע"מ ברירת מחדל עבור חשבוניות חדשות.
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Switch />
                    <Label className="font-hebrew">התאמה אוטומטית לחשבונית</Label>
                  </div>
                  <p className="text-sm text-gray-600 font-hebrew text-right">
                    נהל סטטוס מחוון, עיבוד והזדרת נתונים לחשבונית.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Clock className="w-5 h-5 text-vazana-teal" />
                    <span>הגדרת פעולות</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block">שעות סיום משמרת יום</Label>
                    <Input defaultValue="17:00" type="time" className="text-right font-hebrew" dir="rtl" />
                    <p className="text-sm text-gray-600 font-hebrew text-right">
                      הגדר את שעות הסיום של משמרת היום בכל ימי השבוע (לאוטומטי סטטוסים).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block">שעות סיום משמרת לילה</Label>
                    <Input defaultValue="06:00" type="time" className="text-right font-hebrew" dir="rtl" />
                    <p className="text-sm text-gray-600 font-hebrew text-right">
                      הגדר את שעות הסיום של משמרת הלילה בכל ימי השבוע (לאוטומטי סטטוסים).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Users className="w-5 h-5 text-vazana-teal" />
                    <span>ניהול משתמשים</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">נהל משתמשים והרשאות מערכת.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-start mb-4">
                      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
                            <Plus className="ml-2 w-4 h-4" />
                            הוסף משתמש חדש
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]" dir="rtl">
                          <DialogHeader>
                            <DialogTitle className="font-hebrew text-right">הוסף משתמש חדש</DialogTitle>
                            <DialogDescription className="font-hebrew text-right">
                              הזן את פרטי המשתמש החדש להוספה למערכת.
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              const formData = new FormData(e.target as HTMLFormElement)
                              handleAddUser({
                                username: formData.get("username"),
                                password: formData.get("password"),
                                role: formData.get("role"),
                              })
                            }}
                          >
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label className="font-hebrew text-right block">שם משתמש</Label>
                                <Input
                                  name="username"
                                  placeholder="הזן שם משתמש..."
                                  className="text-right font-hebrew"
                                  dir="rtl"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="font-hebrew text-right block">סיסמה</Label>
                                <Input
                                  name="password"
                                  type="password"
                                  placeholder="הזן סיסמה..."
                                  className="text-right font-hebrew"
                                  dir="rtl"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="font-hebrew text-right block">תפקיד</Label>
                                <Select name="role" dir="rtl" required>
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
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
                                הוסף משתמש
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-vazana-teal text-white font-hebrew">{user.role}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user.id)}
                            className="font-hebrew bg-transparent"
                          >
                            <Edit className="ml-1 w-3 h-3" />
                            ערוך
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="font-hebrew bg-transparent text-red-600 hover:text-red-700"
                            disabled={user.id === "root"}
                          >
                            <Trash2 className="ml-1 w-3 h-3" />
                            מחק
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold font-hebrew">{user.username}</p>
                          <p className="text-sm text-gray-600 font-hebrew">{user.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources */}
            <TabsContent value="resources" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Settings className="w-5 h-5 text-vazana-teal" />
                    <CardTitle className="font-hebrew">ניהול משאבים</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-vazana-teal" />
                        <h3 className="font-semibold font-hebrew">עובדים</h3>
                      </div>
                      <p className="text-sm text-gray-600 font-hebrew text-right mb-3">
                        ערוך את רשימת העובדים הזמינו לביצוע עבודות.
                      </p>
                      <Button variant="outline" className="w-full font-hebrew bg-transparent" asChild>
                        <Link href="/settings/resources/workers">נהל עובדים</Link>
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Briefcase className="w-5 h-5 text-vazana-teal" />
                        <h3 className="font-semibold font-hebrew">סוג עבודה</h3>
                      </div>
                      <p className="text-sm text-gray-600 font-hebrew text-right mb-3">
                        ערוך את סוג העבודות הזמינו במערכת.
                      </p>
                      <Button variant="outline" className="w-full font-hebrew bg-transparent" asChild>
                        <Link href="/settings/resources/job-types">נהל סוגי עבודה</Link>
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <ShoppingCart className="w-5 h-5 text-vazana-teal" />
                        <h3 className="font-semibold font-hebrew">עגלות/נגררים</h3>
                      </div>
                      <p className="text-sm text-gray-600 font-hebrew text-right mb-3">
                        ערוך את רשימת העגלות או הנגררים הזמינו.
                      </p>
                      <Button variant="outline" className="w-full font-hebrew bg-transparent" asChild>
                        <Link href="/settings/resources/shopping-carts">נהל עגלות/נגררים</Link>
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Car className="w-5 h-5 text-vazana-teal" />
                        <h3 className="font-semibold font-hebrew">כלי רכב</h3>
                      </div>
                      <p className="text-sm text-gray-600 font-hebrew text-right mb-3">
                        ערוך את רשימת כלי הרכב הזמינו ופרטיהם.
                      </p>
                      <Button variant="outline" className="w-full font-hebrew bg-transparent" asChild>
                        <Link href="/settings/resources/vehicles">נהל כלי רכב</Link>
                      </Button>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integrations */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Calendar className="w-5 h-5 text-vazana-teal" />
                    <span>אינטגרציות יומן</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    חבר את המערכת ליומנים חיצוניים לסנכרון עבודות.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Button variant="outline" className="font-hebrew bg-transparent">
                      חבר
                    </Button>
                    <div className="text-right">
                      <p className="font-semibold font-hebrew">Google Calendar</p>
                      <p className="text-sm text-gray-600 font-hebrew">סנכרן עבודות עם יומן Google</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Button variant="outline" className="font-hebrew bg-transparent">
                      חבר
                    </Button>
                    <div className="text-right">
                      <p className="font-semibold font-hebrew">Outlook Calendar</p>
                      <p className="text-sm text-gray-600 font-hebrew">סנכרן עבודות עם יומן Outlook</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Management */}
            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Download className="w-5 h-5 text-vazana-teal" />
                    <span>יצוא נתונים</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    הורד את הנתונים האפליקציה שלך בפורמט CSV.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="font-hebrew bg-vazana-yellow hover:bg-vazana-yellow/90 text-vazana-dark"
                    >
                      <Download className="ml-2 w-4 h-4" />
                      יצא עבודות (CSV)
                    </Button>
                    <Button
                      variant="outline"
                      className="font-hebrew bg-vazana-yellow hover:bg-vazana-yellow/90 text-vazana-dark"
                    >
                      <Download className="ml-2 w-4 h-4" />
                      יצא חשבוניות (CSV)
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
