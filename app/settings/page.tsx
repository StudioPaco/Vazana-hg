"use client"

import { useState, useEffect } from "react"
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
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/lib/theme-context"
import { clientAuth } from "@/lib/client-auth"
import { useSearchParams, useRouter } from "next/navigation"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [language, setLanguage] = useState("he")
  const [sessionTimeout, setSessionTimeout] = useState(24) // hours
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [companyData, setCompanyData] = useState({
    name: "וזאנה אבטחת כבישים",
    email: "",
    registration: "",
    address: "",
    phone: "",
  })
  const [users, setUsers] = useState([{ id: "root", username: "root", role: "מנהל", description: "מנהל מערכת" }])
  const [financialSettings, setFinancialSettings] = useState({
    vatPercentage: 18,
    autoInvoiceSync: false,
    dayShiftEnd: "17:00",
    nightShiftEnd: "06:00",
  })

  const searchParams = useSearchParams()
  const router = useRouter()
  const { isMinimized } = useSidebar()
  const { pendingSettings, setPendingSettings, applySettings, colorThemes } = useTheme()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab")
    if (tabFromUrl && ["general", "business", "users", "resources", "integrations", "data"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    } else {
      setActiveTab("general")
    }
    loadBusinessSettings()
    loadUsers()
  }, [searchParams])

  const loadBusinessSettings = async () => {
    try {
      const { data, error } = await supabase.from("business_settings").select("*").single()

      if (data) {
        setCompanyData({
          name: data.company_name || "וזאנה אבטחת כבישים",
          email: data.company_email || "",
          registration: data.registration_number || "",
          address: data.address || "",
          phone: data.phone || "",
        })
        setFinancialSettings({
          vatPercentage: data.vat_percentage || 18,
          autoInvoiceSync: data.auto_invoice_sync || false,
          dayShiftEnd: data.day_shift_end_time || "17:00",
          nightShiftEnd: data.night_shift_end_time || "06:00",
        })
      }
    } catch (error) {
      console.error("Error loading business settings:", error)
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("*")

      if (data) {
        const formattedUsers = data.map((user) => ({
          id: user.id,
          username: user.username,
          role: user.role === "admin" ? "מנהל" : "משתמש",
          description: user.role === "admin" ? "מנהל מערכת" : "משתמש רגיל",
        }))
        setUsers([{ id: "root", username: "root", role: "מנהל", description: "מנהל מערכת" }, ...formattedUsers])
      }
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const handleSaveBusinessDetails = async () => {
    try {
      const { error } = await supabase.from("business_settings").upsert({
        company_name: companyData.name,
        company_email: companyData.email,
        registration_number: companyData.registration,
        address: companyData.address,
        phone: companyData.phone,
        vat_percentage: financialSettings.vatPercentage,
        auto_invoice_sync: financialSettings.autoInvoiceSync,
        day_shift_end_time: financialSettings.dayShiftEnd,
        night_shift_end_time: financialSettings.nightShiftEnd,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      alert("פרטי העסק נשמרו בהצלחה!")
    } catch (error) {
      console.error("Error saving business settings:", error)
      alert("שגיאה בשמירת פרטי העסק")
    }
  }

  const handleAddUser = async (userData: any) => {
    try {
      // Basic validation
      if (!userData.username || !userData.password || !userData.role) {
        alert("אנא מלא את כל השדות")
        return
      }

      // Validate username is email format (except for root)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (userData.username !== "root" && !emailRegex.test(userData.username)) {
        alert("שם משתמש חייב להיות בפורמט אימייל")
        return
      }

      // Prevent creating another root user
      if (userData.username === "root") {
        alert("לא ניתן ליצור משתמש root נוסף")
        return
      }

      // Validate password complexity
      if (userData.password.length < 8) {
        alert("סיסמה חייבת להיות אורך 8 תווים לפחות")
        return
      }
      
      const hasLower = /[a-z]/.test(userData.password)
      const hasUpper = /[A-Z]/.test(userData.password)
      
      if (!hasLower || !hasUpper) {
        alert("סיסמה חייבת לכלול אותיות קטנות וגדולות")
        return
      }

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("username", userData.username)
        .single()

      if (existingUser) {
        alert("שם משתמש כבר קיים במערכת")
        return
      }

      // Hash the password before storing
      const hashedPassword = await clientAuth.hashPassword(userData.password)
      const currentUser = clientAuth.getCurrentUser()
      
      const userInsertData = {
        username: userData.username,
        full_name: userData.full_name || userData.username,
        password_hash: hashedPassword,
        role: userData.role,
        is_active: true,
        permissions: userData.role === "admin" ? 
          { maintenance: true, delete_jobs: true, delete_invoices: true, user_management: true } : 
          { maintenance: false, delete_jobs: false, delete_invoices: false, user_management: false },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log("Attempting to insert user data:", userInsertData)

      const { data, error } = await supabase
        .from("user_profiles")
        .insert(userInsertData)
        .select()
        .single()

      if (error) {
        console.error("Supabase error creating user:", error)
        alert(`שגיאה במסד הנתונים: ${error.message}`)
        return
      }

      console.log("User created successfully:", data)
      const newUser = {
        id: data.id,
        username: data.username,
        role: data.role === "admin" ? "מנהל" : "משתמש",
        description: data.role === "admin" ? "מנהל מערכת" : "משתמש רגיל",
      }
      setUsers((prev) => [...prev, newUser])
      setIsAddUserOpen(false)
      alert("משתמש חדש נוסף בהצלחה! כעת הוא יכול להתחבר למערכת")
    } catch (error) {
      console.error("Error adding user:", error)
      alert(`שגיאה כללית בהוספת משתמש: ${error.message || error}`)
    }
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

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("tab", value)
    router.replace(newUrl.pathname + newUrl.search, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <SidebarNavigation />
      <div className={`${isMinimized ? "mr-24" : "mr-64"} p-6 transition-all duration-300`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-vazana-dark font-hebrew">הגדרות</h1>
            <p className="text-gray-600 font-hebrew">נהל העדפות אפליקציה ומידע עסקי</p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6" dir="rtl">
            <TabsList className="grid w-full grid-cols-6" dir="rtl">
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
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Switch
                      checked={pendingSettings.isDark}
                      onCheckedChange={(checked) => setPendingSettings({ ...pendingSettings, isDark: checked })}
                    />
                    <Label className="font-hebrew">מצב כהה</Label>
                  </div>

                  <div className="flex items-center justify-between">
                    <Switch
                      checked={pendingSettings.sidebarMinimizedByDefault}
                      onCheckedChange={(checked) =>
                        setPendingSettings({ ...pendingSettings, sidebarMinimizedByDefault: checked })
                      }
                    />
                    <Label className="font-hebrew">סרגל צד מוקטן כברירת מחדל</Label>
                  </div>

                  <div className="flex items-center justify-between">
                    <Switch
                      checked={pendingSettings.roundedContainers}
                      onCheckedChange={(checked) =>
                        setPendingSettings({ ...pendingSettings, roundedContainers: checked })
                      }
                    />
                    <Label className="font-hebrew">מכולות מעוגלות</Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block">ערכת צבעים</Label>
                    <Select
                      value={pendingSettings.colorTheme.name}
                      onValueChange={(value) => {
                        const theme = colorThemes.find((t) => t.name === value)
                        if (theme) {
                          setPendingSettings({ ...pendingSettings, colorTheme: theme })
                        }
                      }}
                      dir="rtl"
                    >
                      <SelectTrigger className="text-right font-hebrew">
                        <SelectValue placeholder="בחר ערכת צבעים..." />
                      </SelectTrigger>
                      <SelectContent>
                        {colorThemes.map((theme) => (
                          <SelectItem key={theme.name} value={theme.name} className="font-hebrew">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondary }} />
                                <div
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: theme.accent }}
                                />
                              </div>
                              <span>{theme.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-start pt-4">
                    <Button onClick={applySettings} className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
                      <Save className="ml-2 w-4 h-4" />
                      החל הגדרות
                    </Button>
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
                    נהל הגדרות אבטחה וזמן פגישה
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block">זמן פגישה (שעות)</Label>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={sessionTimeout.toString()} 
                        onValueChange={(value) => setSessionTimeout(Number(value))}
                        dir="rtl"
                      >
                        <SelectTrigger className="text-right font-hebrew w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1" className="font-hebrew">1 שעה</SelectItem>
                          <SelectItem value="4" className="font-hebrew">4 שעות</SelectItem>
                          <SelectItem value="8" className="font-hebrew">8 שעות</SelectItem>
                          <SelectItem value="12" className="font-hebrew">12 שעות</SelectItem>
                          <SelectItem value="24" className="font-hebrew">24 שעות</SelectItem>
                          <SelectItem value="48" className="font-hebrew">48 שעות</SelectItem>
                          <SelectItem value="168" className="font-hebrew">שבוע</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm text-gray-600 font-hebrew text-right">
                      משך הזמן שלפניו המשתמש יוצא אוטומטית מהמערכת
                    </p>
                  </div>
                  
                  <div className="flex justify-start pt-4">
                    <Button 
                      onClick={() => {
                        clientAuth.updateSessionDuration(sessionTimeout)
                        alert(`זמן הפגישה עודכן ל-${sessionTimeout} שעות`)
                      }}
                      className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
                    >
                      <Save className="ml-2 w-4 h-4" />
                      שמור הגדרות אבטחה
                    </Button>
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

            <TabsContent value="business" className="space-y-6">
              <Card dir="rtl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <span>פרטי עסק</span>
                    <Briefcase className="w-5 h-5 text-vazana-teal" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">שם החברה *</Label>
                      <Input
                        value={companyData.name}
                        onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                        className="text-right font-hebrew"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">אימייל החברה *</Label>
                      <Input
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                        placeholder="company@example.com"
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
                  <div className="flex justify-start">
                    <Button
                      onClick={handleSaveBusinessDetails}
                      className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
                    >
                      <Save className="ml-2 w-4 h-4" />
                      שמור שינויים
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card dir="rtl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <span>הגדרת כספים</span>
                    <DollarSign className="w-5 h-5 text-vazana-teal" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block">אחוז מע"מ ברירת מחדל (%)</Label>
                    <Input
                      type="number"
                      value={financialSettings.vatPercentage}
                      onChange={(e) =>
                        setFinancialSettings({ ...financialSettings, vatPercentage: Number(e.target.value) })
                      }
                      className="text-right font-hebrew"
                      dir="rtl"
                    />
                    <p className="text-sm text-gray-600 font-hebrew text-right">
                      הגדר את שיעור המע"מ ברירת מחדל עבור חשבוניות חדשות.
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Switch
                      checked={financialSettings.autoInvoiceSync}
                      onCheckedChange={(checked) =>
                        setFinancialSettings({ ...financialSettings, autoInvoiceSync: checked })
                      }
                    />
                    <Label className="font-hebrew">התאמה אוטומטית לחשבונית</Label>
                  </div>
                </CardContent>
              </Card>

              <Card dir="rtl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <span>הגדרת פעולות</span>
                    <Clock className="w-5 h-5 text-vazana-teal" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block">שעות סיום משמרת יום</Label>
                    <Input
                      type="time"
                      value={financialSettings.dayShiftEnd}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, dayShiftEnd: e.target.value })}
                      className="text-right font-hebrew"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block">שעות סיום משמרת לילה</Label>
                    <Input
                      type="time"
                      value={financialSettings.nightShiftEnd}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, nightShiftEnd: e.target.value })}
                      className="text-right font-hebrew"
                      dir="rtl"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

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
                                full_name: formData.get("full_name"),
                                password: formData.get("password"),
                                role: formData.get("role"),
                              })
                            }}
                          >
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label className="font-hebrew text-right block">שם משתמש (אימייל)</Label>
                                <Input
                                  name="username"
                                  type="email"
                                  placeholder="user@company.com"
                                  className="text-left font-hebrew"
                                  dir="ltr"
                                  required
                                />
                                <p className="text-xs text-gray-500 font-hebrew text-right">
                                  שם המשתמש חייב להיות בפורמט אימייל
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="font-hebrew text-right block">שם מלא</Label>
                                <Input
                                  name="full_name"
                                  placeholder="הזן שם מלא..."
                                  className="text-right font-hebrew"
                                  dir="rtl"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="font-hebrew text-right block">סיסמה</Label>
                                <Input
                                  name="password"
                                  type="password"
                                  placeholder="לפחות 8 תווים עם אותיות קטנות וגדולות"
                                  className="text-right font-hebrew"
                                  dir="rtl"
                                  required
                                  minLength={8}
                                />
                                <p className="text-xs text-gray-500 font-hebrew text-right">
                                  לפחות 8 תווים, אותיות קטנות וגדולות
                                </p>
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
                        <Link href="/settings/resources/workers?tab=resources">נהל עובדים</Link>
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
                        <Link href="/settings/resources/job-types?tab=resources">נהל סוגי עבודה</Link>
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
                        <Link href="/settings/resources/shopping-carts?tab=resources">נהל עגלות/נגררים</Link>
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
                        <Link href="/settings/resources/vehicles?tab=resources">נהל כלי רכב</Link>
                      </Button>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

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
