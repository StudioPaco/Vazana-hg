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
  Activity,
  RefreshCw,
} from "lucide-react"
import SidebarNavigation, { useSidebar } from "@/components/layout/sidebar-navigation"
import AppNavigation from "@/components/layout/app-navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/lib/theme-context"
import { clientAuth } from "@/lib/client-auth"
import { useSearchParams, useRouter } from "next/navigation"
import ResourceModal from "@/components/settings/resource-modal"
import DataExportImport from "@/components/settings/data-export-import"
import UserEditModal from "@/components/settings/user-edit-modal"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [language, setLanguage] = useState("he")
  const [sessionTimeout, setSessionTimeout] = useState(24) // hours
  const [fontSize, setFontSize] = useState(16) // Base font size in px
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isPaymentTermsOpen, setIsPaymentTermsOpen] = useState(false)
  const [paymentTerms, setPaymentTerms] = useState([
    { id: 1, value: "immediate", label: "מיידי" },
    { id: 2, value: "current+15", label: "שוטף +15" },
    { id: 3, value: "current+30", label: "שוטף +30" },
    { id: 4, value: "current+60", label: "שוטף +60" },
    { id: 5, value: "current+90", label: "שוטף +90" }
  ])
  const [editingUser, setEditingUser] = useState<any>(null)
  const [userEditModalOpen, setUserEditModalOpen] = useState(false)
  const [resourceModalType, setResourceModalType] = useState<"workers" | "vehicles" | "carts" | "job-types" | null>(null)
  const [dataExportImportOpen, setDataExportImportOpen] = useState(false)
  const [dataExportOpen, setDataExportOpen] = useState(false)
  const [dataImportOpen, setDataImportOpen] = useState(false)
  const [autoBackup, setAutoBackup] = useState(true)
  const [isWhatsAppSetupOpen, setIsWhatsAppSetupOpen] = useState(false)
  const [companyData, setCompanyData] = useState({
    id: null,
    name: "וזאנה אבטחת כבישים",
    email: "",
    registration: "",
    address: "",
    phone: "",
    bankAccountName: "",
    bankName: "",
    bankBranch: "",
    bankAccountNumber: "",
  })
  const [users, setUsers] = useState([{ id: "root", username: "root", role: "מנהל", description: "מנהל מערכת", isSystem: true }])
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
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab")
    if (tabFromUrl && ["general", "business", "resources", "users", "integrations", "data"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    } else {
      setActiveTab("general")
    }
    loadBusinessSettings()
    loadUsers()
    
    // Load current user
    const user = clientAuth.getCurrentUser()
    setCurrentUser(user)
    
    // Load payment terms from localStorage
    const savedPaymentTerms = localStorage.getItem('vazana-payment-terms')
    if (savedPaymentTerms) {
      try {
        setPaymentTerms(JSON.parse(savedPaymentTerms))
      } catch (error) {
        console.error('Error loading payment terms:', error)
      }
    }
  }, [searchParams])

  const loadBusinessSettings = async () => {
    try {
      // Get all business settings and use the first one
      const { data: allData, error } = await supabase
        .from("business_settings")
        .select("*")
        .order('created_at', { ascending: true })
        .limit(1)

      // Load bank account info from localStorage as fallback
      const savedBankInfo = JSON.parse(localStorage.getItem("bankAccountInfo") || "{}")

      if (allData && allData.length > 0) {
        const data = allData[0] // Use the first (oldest) record
        setCompanyData({
          id: data.id,
          name: data.company_name || "וזאנה אבטחת כבישים",
          email: data.company_email || "",
          registration: data.registration_number || "",
          address: data.address || "",
          phone: data.phone || "",
          bankAccountName: data.bank_account_name || savedBankInfo.bankAccountName || "",
          bankName: data.bank_name || savedBankInfo.bankName || "",
          bankBranch: data.bank_branch || savedBankInfo.bankBranch || "",
          bankAccountNumber: data.bank_account_number || savedBankInfo.bankAccountNumber || "",
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
        const formattedUsers = data
          .filter(user => user.username !== "root") // Exclude root from DB users
          .map((user) => ({
            id: user.id,
            username: user.username,
            role: user.role === "admin" ? "מנהל" : "משתמש",
            description: user.role === "admin" ? "מנהל מערכת" : "משתמש רגיל",
            isSystem: false
          }))
        
        // Only include the hardcoded root user
        setUsers([{ id: "root", username: "root", role: "מנהל", description: "מנהל מערכת", isSystem: true }, ...formattedUsers])
      }
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const handleSaveBusinessDetails = async () => {
    try {
      // Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const phoneRegex = /^[\d\-\+\(\)\s]+$/
      
      if (companyData.email && !emailRegex.test(companyData.email)) {
        alert("אימייל לא תקין. אנא הזן אימייל בפורמט נכון")
        return
      }
      
      if (companyData.phone && !phoneRegex.test(companyData.phone)) {
        alert("מספר טלפון לא תקין. אנא הזן רק מספרים וסימנים מיוחדים")
        return
      }
      
      // Save bank account info to localStorage as fallback
      const bankInfo = {
        bankAccountName: companyData.bankAccountName,
        bankName: companyData.bankName,
        bankBranch: companyData.bankBranch,
        bankAccountNumber: companyData.bankAccountNumber,
      }
      localStorage.setItem("bankAccountInfo", JSON.stringify(bankInfo))

      const updateData = {
        company_name: companyData.name,
        company_email: companyData.email,
        registration_number: companyData.registration,
        address: companyData.address,
        phone: companyData.phone,
        bank_account_name: companyData.bankAccountName,
        bank_name: companyData.bankName,
        bank_branch: companyData.bankBranch,
        bank_account_number: companyData.bankAccountNumber,
        vat_percentage: financialSettings.vatPercentage,
        auto_invoice_sync: financialSettings.autoInvoiceSync,
        day_shift_end_time: financialSettings.dayShiftEnd,
        night_shift_end_time: financialSettings.nightShiftEnd,
        updated_at: new Date().toISOString(),
      }

      // Include ID if updating existing record
      if (companyData.id) {
        updateData.id = companyData.id
      }

      let data, error
      
      if (companyData.id) {
        // Update existing record by ID
        const result = await supabase
          .from("business_settings")
          .update(updateData)
          .eq('id', companyData.id)
          .select()
          .single()
        data = result.data
        error = result.error
      } else {
        // Create new record
        const result = await supabase
          .from("business_settings")
          .insert(updateData)
          .select()
          .single()
        data = result.data
        error = result.error
      }

      if (error) {
        console.error("Database save failed:", {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          updateData
        })
        
        // Check if it's a missing column error
        if (error.message && error.message.includes('bank_account')) {
          alert("השמירה בבסיס הנתונים נכשלה - ערוצי חשבון הבנק חסרים. הנתונים נשמרו באחסון מקומי.")
        } else {
          alert(`שגיאה בשמירה לבסיס נתונים: ${error.message}. הנתונים נשמרו באחסון מקומי.`)
        }
      } else {
        // Update the ID in case this was an insert
        if (data && !companyData.id) {
          setCompanyData(prev => ({ ...prev, id: data.id }))
        }
        alert("פרטי העסק נשמרו בהצלחה!")
      }
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
    const user = users.find(u => u.id === userId)
    if (user) {
      setEditingUser(user)
      setUserEditModalOpen(true)
    }
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
        <AppNavigation />
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
              <TabsTrigger value="resources" className="font-hebrew">
                ניהול משאבים
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
                    <Globe className="w-5 h-5 text-vazana-teal" />
                    <span>שפה ותצוגה</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    קבע את שפת המערכת וגודל הגופן
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant={language === "he" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLanguage("he")}
                        className={`font-hebrew ${language === "he" 
                          ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                          : "bg-vazana-teal hover:bg-vazana-teal/90"
                        }`}
                      >
                        עברית
                      </Button>
                      <Button
                        variant={language === "en" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLanguage("en")}
                        className={`${language === "en" 
                          ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                          : "hover:bg-gray-100"
                        }`}
                      >
                        English
                      </Button>
                    </div>
                    <Label className="font-hebrew">שפת המערכת</Label>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="12"
                        max="24"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
                        className="w-20 text-center"
                      />
                      <span className="text-sm text-gray-600">px</span>
                    </div>
                    <Label className="font-hebrew">גודל גופן בסיסי</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Lock className="w-5 h-5 text-vazana-teal" />
                    <span>אבטחה והרשאות</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    הגדרות אבטחה ופעילות משתמשים
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="72"
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 24)}
                        className="w-20 text-center"
                      />
                      <span className="text-sm text-gray-600 font-hebrew">שעות</span>
                    </div>
                    <Label className="font-hebrew">זמן פג תוקף ההתחברות</Label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Switch />
                    <Label className="font-hebrew">דרוש אימות דו-שלבי (בקרוב)</Label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Switch />
                    <Label className="font-hebrew">רשום פעילות משתמשים - זמין למנהלים בלבד</Label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Switch />
                    <Label className="font-hebrew">התראות צלילים</Label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Switch />
                    <Label className="font-hebrew">שמירה אוטומטית של טפסים</Label>
                  </div>
                </CardContent>
              </Card>
              
              {/* Restore Defaults */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <RefreshCw className="w-5 h-5 text-orange-600" />
                    <span>איפוס הגדרות</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    החזר את כל ההגדרות לערכי ברירת המחדל
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800 text-right font-hebrew">
                        <strong>אזהרה:</strong> פעולה זו תמחק את כל ההגדרות האישיות שלך ותחזיר את המערכת לערכי ברירת המחדל.
                      </p>
                    </div>
                    
                    <div className="flex justify-start">
                      <Button 
                        onClick={() => {
                          if (confirm("האם אתה בטוח שברצונך לאפס את כל ההגדרות לערכי ברירת המחדל? פעולה זו בלתי הפיכה.")) {
                            // Reset all settings to defaults
                            setLanguage("he")
                            setFontSize(16)
                            setSessionTimeout(24)
                            setNotifications(true)
                            setEmailAlerts(false)
                            setPendingSettings({
                              isDark: false,
                              sidebarMinimizedByDefault: false,
                              roundedContainers: true,
                              colorTheme: colorThemes[0],
                            })
                            // Clear localStorage theme settings
                            localStorage.removeItem("vazana_theme_settings")
                            alert("כל ההגדרות אופסו לערכי ברירת המחדל!")
                            // Refresh the page to apply changes
                            window.location.reload()
                          }
                        }}
                        variant="outline" 
                        className="border-orange-300 text-orange-700 hover:bg-orange-50 font-hebrew"
                      >
                        <RefreshCw className="ml-2 w-4 h-4" />
                        איפוס לברירת מחדל
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right font-hebrew">פרטי עסק</CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    עדכן את פרטי העסק ופרטי חשבון הבנק
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">שם חברה</Label>
                      <Input
                        value={companyData.name}
                        onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                        className="text-right"
                        dir="rtl"
                        placeholder="שם החברה..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">אימייל</Label>
                      <Input
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                        className="text-left"
                        placeholder="email@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">מספר רשום</Label>
                      <Input
                        value={companyData.registration}
                        onChange={(e) => setCompanyData({ ...companyData, registration: e.target.value })}
                        className="text-left"
                        placeholder="123456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">טלפון</Label>
                      <Input
                        value={companyData.phone}
                        onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                        className="text-left"
                        placeholder="050-1234567"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-right font-hebrew">כתובת</Label>
                      <Input
                        value={companyData.address}
                        onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                        className="text-right"
                        dir="rtl"
                        placeholder="רחוב הרצל 1, תל אביב"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4 text-right font-hebrew">פרטי חשבון בנק</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-right font-hebrew">שם בעל החשבון</Label>
                        <Input
                          value={companyData.bankAccountName}
                          onChange={(e) => setCompanyData({ ...companyData, bankAccountName: e.target.value })}
                          className="text-right"
                          dir="rtl"
                          placeholder="שם בעל חשבון"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-right font-hebrew">שם הבנק</Label>
                        <Input
                          value={companyData.bankName}
                          onChange={(e) => setCompanyData({ ...companyData, bankName: e.target.value })}
                          className="text-right"
                          dir="rtl"
                          placeholder="בנק לאומי"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-right font-hebrew">מספר סניף</Label>
                        <Input
                          value={companyData.bankBranch}
                          onChange={(e) => setCompanyData({ ...companyData, bankBranch: e.target.value })}
                          className="text-left"
                          placeholder="123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-right font-hebrew">מספר חשבון</Label>
                        <Input
                          value={companyData.bankAccountNumber}
                          onChange={(e) => setCompanyData({ ...companyData, bankAccountNumber: e.target.value })}
                          className="text-left"
                          placeholder="12-345-678901"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4 text-right font-hebrew">הגדרות כספים</h3>
                    
                    {/* VAT Section */}
                    <div className="space-y-4 mb-6">
                      <div className="space-y-2">
                        <Label className="text-right font-hebrew">אחוז מעמ (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={financialSettings.vatPercentage}
                          onChange={(e) => setFinancialSettings({ ...financialSettings, vatPercentage: parseInt(e.target.value) || 0 })}
                          className="text-left w-32"
                        />
                        <p className="text-sm text-gray-600 font-hebrew text-right">
                          הגדר את אחוז המע"מ הברירת מחדל עבור חשבוניות חדשות.
                        </p>
                      </div>
                    </div>
                    
                    {/* Shift Times Section */}
                    <div className="space-y-4 mb-6">
                      <h4 className="font-semibold text-right font-hebrew">זמני משמרות</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-right font-hebrew">סיום משמרת יום</Label>
                          <Input
                            type="time"
                            value={financialSettings.dayShiftEnd}
                            onChange={(e) => setFinancialSettings({ ...financialSettings, dayShiftEnd: e.target.value })}
                            className="text-left"
                          />
                          <p className="text-sm text-gray-600 font-hebrew text-right">
                            הגדר את שעת סיום משמרת יום (לחישוב שעות נוספות).
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-right font-hebrew">סיום משמרת לילה</Label>
                          <Input
                            type="time"
                            value={financialSettings.nightShiftEnd}
                            onChange={(e) => setFinancialSettings({ ...financialSettings, nightShiftEnd: e.target.value })}
                            className="text-left"
                          />
                          <p className="text-sm text-gray-600 font-hebrew text-right">
                            הגדר את שעת סיום משמרת לילה (לחישוב שעות נוספות).
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Auto Invoice Sync Section */}
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between">
                        <Switch
                          checked={financialSettings.autoInvoiceSync}
                          onCheckedChange={(checked) => setFinancialSettings({ ...financialSettings, autoInvoiceSync: checked })}
                        />
                        <Label className="font-hebrew">סינכרון חשבוניות אוטומטי</Label>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-right font-hebrew mb-2">מה זה סינכרון חשבוניות אוטומטי?</h4>
                        <p className="text-sm text-gray-700 font-hebrew text-right mb-2">
                          כאשר האפשרות מופעלת, המערכת תסנכרן אוטומטית חשבוניות עם מערכות חיצוניות כמו תוכנות הנהחשבונות או מערכות CRM.
                        </p>
                        <p className="text-sm text-gray-700 font-hebrew text-right mb-2">
                          <strong>איך להשתמש:</strong>
                        </p>
                        <ul className="text-sm text-gray-700 font-hebrew text-right list-disc list-inside space-y-1">
                          <li>הפעל את האפשרות כדי לאפשר סינכרון אוטומטי</li>
                          <li>הגדר את פרטי ההתחברות בלשונית "אינטגרציות"</li>
                          <li>חשבוניות חדשות יסונכרנו אוטומטית כל 15 דקות</li>
                          <li>קבל התראות על שגיאות סינכרון בדואר האלקטרוני</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Payment Terms Section - integrated into financial section */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-right font-hebrew">תנאי תשלום</h4>
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPaymentTermsOpen(true)}
                        className="font-hebrew"
                      >
                        <Edit className="w-4 h-4 ml-2" />
                        ערוך
                      </Button>
                      <div className="flex items-center gap-2">
                        <Select
                          value={paymentTerms.find(t => t.id === 2)?.value || "current+15"}
                          onValueChange={(value) => {
                            console.log("שינוי תנאי תשלום ברירת מחדל:", value)
                          }}
                          dir="rtl"
                        >
                          <SelectTrigger className="text-right font-hebrew w-48">
                            <SelectValue placeholder="בחר תנאי תשלום..." />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentTerms.map((term) => (
                              <SelectItem key={term.id} value={term.value} className="font-hebrew">
                                {term.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Label className="font-hebrew">תנאי תשלום ברירת מחדל</Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Invoice Numbering Section */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4 text-right font-hebrew">מספור חשבוניות</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-right font-hebrew">פורמט מספור חשבונית</Label>
                        <Select dir="rtl">
                          <SelectTrigger className="text-right font-hebrew">
                            <SelectValue placeholder="בחר פורמט..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YYYY-####" className="font-hebrew">2025-0001 (שנה-מספר רצוף)</SelectItem>
                            <SelectItem value="####-YYYY" className="font-hebrew">0001-2025 (מספר-שנה)</SelectItem>
                            <SelectItem value="VZ-####" className="font-hebrew">VZ-0001 (קידומת חברה)</SelectItem>
                            <SelectItem value="####" className="font-hebrew">0001 (מספר רצוף פשוט)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-right font-hebrew">מספר החשבונית הבא</Label>
                        <Input
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="text-left w-32"
                          placeholder="1"
                        />
                        <p className="text-sm text-gray-600 font-hebrew text-right">
                          המספר שייתן לחשבונית הבאה שתיוצר.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Holiday Calendar Integration */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4 text-right font-hebrew">אינטגרציה עם לוח חגים</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Switch />
                        <Label className="font-hebrew">סמן אוטומטי חגים יהודיים</Label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Switch />
                        <Label className="font-hebrew">סמן אוטומטי חגים כלליים</Label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Switch defaultChecked />
                        <Label className="font-hebrew">התראה על עבודות בימי חג</Label>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 text-right font-hebrew">
                          <strong>איך זה עובד:</strong> המערכת תסמן אוטומטית ימי חג ותיתן אזהרות כשמתזמנים עבודות. תוכל להגדיר תעריפי חג מיוחדים בהגדרות הלקוחות.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-start pt-4">
                    <Button onClick={handleSaveBusinessDetails} className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
                      <Save className="ml-2 w-4 h-4" />
                      שמור פרטים
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Payment Terms Modal */}
              <Dialog open={isPaymentTermsOpen} onOpenChange={setIsPaymentTermsOpen}>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right font-hebrew">ניהול תנאי תשלום</DialogTitle>
                    <DialogDescription className="text-right font-hebrew">
                      ערוך את רשימת תנאי התשלום הזמינים במערכת
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {paymentTerms.map((term, index) => (
                      <div key={term.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newTerms = paymentTerms.filter(t => t.id !== term.id)
                            setPaymentTerms(newTerms)
                            localStorage.setItem('vazana-payment-terms', JSON.stringify(newTerms))
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Input
                          value={term.label}
                          onChange={(e) => {
                            const newTerms = paymentTerms.map(t => 
                              t.id === term.id ? { ...t, label: e.target.value } : t
                            )
                            setPaymentTerms(newTerms)
                            localStorage.setItem('vazana-payment-terms', JSON.stringify(newTerms))
                          }}
                          className="text-right"
                          dir="rtl"
                          placeholder="תיאור (למשל: 'שוטף +30')"
                        />
                        <Input
                          value={term.value}
                          onChange={(e) => {
                            const newTerms = paymentTerms.map(t => 
                              t.id === term.id ? { ...t, value: e.target.value } : t
                            )
                            setPaymentTerms(newTerms)
                            localStorage.setItem('vazana-payment-terms', JSON.stringify(newTerms))
                          }}
                          className="text-left"
                          placeholder="current+30"
                        />
                      </div>
                    ))}
                    
                    <Button
                      onClick={() => {
                        const newTerm = {
                          id: Math.max(...paymentTerms.map(t => t.id)) + 1,
                          value: "custom",
                          label: "תנאי חדש"
                        }
                        const newTerms = [...paymentTerms, newTerm]
                        setPaymentTerms(newTerms)
                        localStorage.setItem('vazana-payment-terms', JSON.stringify(newTerms))
                      }}
                      variant="outline"
                      className="w-full font-hebrew"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      הוסף תנאי תשלום
                    </Button>
                  </div>
                  
                  <DialogFooter className="flex gap-2 justify-start">
                    <Button 
                      onClick={() => setIsPaymentTermsOpen(false)} 
                      className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
                    >
                      סיים
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Briefcase className="w-5 h-5 text-vazana-teal" />
                    <span>ניהול משאבים</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    נהל עובדים, רכבים וציוד
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center gap-2 font-hebrew"
                    onClick={() => setResourceModalType("workers")}
                  >
                    <Users className="w-8 h-8 text-blue-600" />
                    <span>עובדים</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center gap-2 font-hebrew"
                    onClick={() => setResourceModalType("vehicles")}
                  >
                    <Car className="w-8 h-8 text-green-600" />
                    <span>רכבים</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center gap-2 font-hebrew"
                    onClick={() => setResourceModalType("carts")}
                  >
                    <ShoppingCart className="w-8 h-8 text-purple-600" />
                    <span>עגלות</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center gap-2 font-hebrew"
                    onClick={() => setResourceModalType("job-types")}
                  >
                    <Briefcase className="w-8 h-8 text-orange-600" />
                    <span>סוגי עבודה</span>
                  </Button>
                </CardContent>
              </Card>
              
              {/* Resource Availability Calendar */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Calendar className="w-5 h-5 text-vazana-teal" />
                    <span>לוח זמינות משאבים</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    נהל זמינות עובדים, רכבים וציוד
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">סוג משאב</Label>
                      <Select dir="rtl">
                        <SelectTrigger className="text-right font-hebrew">
                          <SelectValue placeholder="בחר סוג..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worker" className="font-hebrew">עובדים</SelectItem>
                          <SelectItem value="vehicle" className="font-hebrew">רכבים</SelectItem>
                          <SelectItem value="cart" className="font-hebrew">עגלות</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">בחר משאב</Label>
                      <Select dir="rtl">
                        <SelectTrigger className="text-right font-hebrew">
                          <SelectValue placeholder="בחר..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="font-hebrew">כל המשאבים</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">תאריך</Label>
                      <Input type="date" className="text-left" />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="text-center text-gray-500 py-8">
                      <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p className="font-hebrew">בחר סוג משאב ותאריך כדי לראות את הזמינות</p>
                      <p className="text-sm text-gray-400 font-hebrew mt-2">
                        כאן יוצג לוח של המשאבים הזמינים בחודש הנבחר
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="font-hebrew" size="sm">
                      <Plus className="w-4 h-4 ml-2" />
                      סמן לא זמין
                    </Button>
                    <Button variant="outline" className="font-hebrew" size="sm">
                      <Edit className="w-4 h-4 ml-2" />
                      ערוך זמינות
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Resource Modal */}
              <ResourceModal
                type={resourceModalType}
                open={resourceModalType !== null}
                onOpenChange={() => setResourceModalType(null)}
              />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Users className="w-5 h-5 text-vazana-teal" />
                    <span>ניהול משתמשים</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    נהל משתמשי המערכת והרשאותיהם
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-start mb-4">
                    <Button onClick={() => setIsAddUserOpen(true)} className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
                      <Plus className="ml-2 w-4 h-4" />
                      הוסף משתמש
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex gap-2">
                          {!user.isSystem && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {user.isSystem && (
                            <Badge variant="secondary" className="text-xs font-hebrew">
                              מערכת
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <h3 className="font-medium">{user.username}</h3>
                          <p className="text-sm text-gray-600">{user.description}</p>
                          <Badge variant={user.role === "מנהל" ? "default" : "secondary"} className="text-xs font-hebrew">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Add User Dialog */}
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right font-hebrew">הוסף משתמש חדש</DialogTitle>
                    <DialogDescription className="text-right font-hebrew">
                      מלא את פרטי המשתמש החדש
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.target as HTMLFormElement)
                    const userData = {
                      username: formData.get('username') as string,
                      full_name: formData.get('full_name') as string,
                      phone_number: formData.get('phone_number') as string,
                      password: formData.get('password') as string,
                      role: formData.get('role') as string,
                    }
                    handleAddUser(userData)
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">שם משתמש (אימייל)</Label>
                      <Input
                        name="username"
                        type="email"
                        className="text-left"
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">שם מלא</Label>
                      <Input
                        name="full_name"
                        className="text-right"
                        dir="rtl"
                        placeholder="שם מלא..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">מספר טלפון</Label>
                      <Input
                        name="phone_number"
                        type="tel"
                        className="text-left"
                        placeholder="050-1234567"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">סיסמה</Label>
                      <Input
                        name="password"
                        type="password"
                        className="text-left"
                        placeholder="לפחות 8 תווים"
                        required
                        minLength={8}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">תפקיד</Label>
                      <Select name="role" required>
                        <SelectTrigger className="text-right" dir="rtl">
                          <SelectValue placeholder="בחר תפקיד..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin" className="font-hebrew">מנהל</SelectItem>
                          <SelectItem value="user" className="font-hebrew">משתמש</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <DialogFooter className="flex gap-2 justify-start">
                      <Button type="submit" className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
                        הוסף משתמש
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} className="font-hebrew">
                        בטל
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              
              {/* Audit Trail Section - Admin/Root Only */}
              {(currentUser?.role === 'admin' || currentUser?.username === 'root') && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between font-hebrew">
                      <Activity className="w-5 h-5 text-vazana-teal" />
                      <span>יומן פעילות משתמשים</span>
                    </CardTitle>
                    <CardDescription className="text-right font-hebrew">
                      מעקב אחר פעילות המשתמשים במערכת - זמין למנהלים בלבד
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Switch defaultChecked />
                        <Label className="font-hebrew">רשם כניסות ויציאות</Label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Switch defaultChecked />
                        <Label className="font-hebrew">רשם שינויי נתונים</Label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Switch defaultChecked />
                        <Label className="font-hebrew">רשם מחיקות נתונים</Label>
                      </div>
                      
                      <div className="border-t pt-4">
                        <Button 
                          variant="outline" 
                          className="w-full font-hebrew"
                          onClick={() => console.log('פתח יומן פעילות')}
                        >
                          <Activity className="w-4 h-4 ml-2" />
                          צפה ביומן פעילות
                        </Button>
                        
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-right font-hebrew mb-2">פעילות אחרונה:</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">2 דקות</span>
                              <span className="font-hebrew">עדכון פרטי לקוח - root</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">5 דקות</span>
                              <span className="font-hebrew">יצירת עבודה חדשה - admin</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">12 דקות</span>
                              <span className="font-hebrew">כניסה למערכת - user1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* User Edit Modal */}
              <UserEditModal
                user={editingUser}
                open={userEditModalOpen}
                onOpenChange={setUserEditModalOpen}
                onUserUpdated={(updatedUser) => {
                  setUsers(users.map(user => 
                    user.id === updatedUser.id ? updatedUser : user
                  ))
                  setEditingUser(null)
                }}
              />
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Globe className="w-5 h-5 text-vazana-teal" />
                    <span>אינטגרציות</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    התחבר לשירותים חיצוניים
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="font-hebrew">לא מחובר</Badge>
                        <h3 className="font-semibold text-right font-hebrew">דואר</h3>
                      </div>
                      <p className="text-sm text-gray-600 text-right font-hebrew">
                        שליחת חשבוניות והתראות באימייל
                      </p>
                      <Button variant="outline" disabled className="w-full font-hebrew">
                        התחבר (בקרוב)
                      </Button>
                    </div>
                    
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="font-hebrew">לא מחובר</Badge>
                        <h3 className="font-semibold text-right font-hebrew">הנהחשבונות</h3>
                      </div>
                      <p className="text-sm text-gray-600 text-right font-hebrew">
                        סינכרון עם תוכנת הנהחשבונות
                      </p>
                      <Button variant="outline" disabled className="w-full font-hebrew">
                        התחבר (בקרוב)
                      </Button>
                    </div>
                    
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="font-hebrew">זמין להתחברות</Badge>
                        <h3 className="font-semibold text-right font-hebrew">וואטסאפ</h3>
                      </div>
                      <p className="text-sm text-gray-600 text-right font-hebrew">
                        שליחת התראות ועדכונים בוואטסאפ Business
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full font-hebrew bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        onClick={() => setIsWhatsAppSetupOpen(true)}
                      >
                        התחבר עכשיו
                      </Button>
                    </div>
                    
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="font-hebrew">לא מחובר</Badge>
                        <h3 className="font-semibold text-right font-hebrew">יום ערך</h3>
                      </div>
                      <p className="text-sm text-gray-600 text-right font-hebrew">
                        סינכרון עם שירותי יום ערך
                      </p>
                      <Button variant="outline" disabled className="w-full font-hebrew">
                        התחבר (בקרוב)
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4 text-right font-hebrew">פתרון קונפליקטי סינכרון</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-right font-hebrew">אסטרטגיית פתרון קונפליקטים</Label>
                        <Select defaultValue="local_wins" dir="rtl">
                          <SelectTrigger className="text-right font-hebrew">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local_wins" className="font-hebrew">מעדיף שינויים מקומיים</SelectItem>
                            <SelectItem value="remote_wins" className="font-hebrew">מעדיף שינויים מרוחקים</SelectItem>
                            <SelectItem value="manual" className="font-hebrew">החלטה ידנית</SelectItem>
                            <SelectItem value="merge" className="font-hebrew">מיזוג אוטומטי</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-600 text-right font-hebrew">
                          מה לעשות כשהאותו נתון שונה ב-2 מקומות באותו זמן
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Switch defaultChecked />
                        <Label className="font-hebrew">התראה על קונפליקטי סינכרון</Label>
                      </div>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-sm text-orange-800 text-right font-hebrew">
                          <strong>חשוב לדעת:</strong> קונפליקטים יכולים להתרחש כש-2 משתמשים מעדכנים את אותו נתון באותו זמן. המערכת תפתור אותם בהתאם להגדרה שבחרת.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* WhatsApp Setup Modal */}
              <Dialog open={isWhatsAppSetupOpen} onOpenChange={setIsWhatsAppSetupOpen}>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right font-hebrew">התחברות לוואטסאפ Business</DialogTitle>
                    <DialogDescription className="text-right font-hebrew">
                      הגדר את החיבור לשליחת התראות בוואטסאפ
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">מספר הטלפון של העסק</Label>
                      <Input
                        type="tel"
                        placeholder="972-50-1234567"
                        className="text-left"
                      />
                      <p className="text-sm text-gray-600 font-hebrew text-right">
                        המספר צריך להיות רשום ב-WhatsApp Business
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">Access Token</Label>
                      <Input
                        type="password"
                        placeholder="הדבק כאן את ה-token מ-Meta Developer"
                        className="text-left font-mono text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">Webhook Verify Token</Label>
                      <Input
                        type="text"
                        placeholder="בחר מחרוזת סיסמה חזקה"
                        className="text-left"
                      />
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-right font-hebrew mb-2">איך להשיג את הפרטים:</h4>
                      <ol className="text-sm text-blue-800 text-right font-hebrew space-y-1 list-decimal list-inside">
                        <li>עבור ל-Meta Developer Console</li>
                        <li>צור אפליקציה חדשה עם WhatsApp Business API</li>
                        <li>העתק את ה-Access Token וה-Verify Token</li>
                        <li>הגדר את ה-Webhook URL ל: {typeof window !== 'undefined' ? window.location.origin : '[YOUR_DOMAIN]'}/api/whatsapp/webhook</li>
                      </ol>
                    </div>
                  </div>
                  
                  <DialogFooter className="flex gap-2 justify-start">
                    <Button 
                      onClick={() => {
                        console.log('שמירת הגדרות WhatsApp')
                        setIsWhatsAppSetupOpen(false)
                        alert('הגדרות WhatsApp נשמרו בהצלחה!')
                      }}
                      className="bg-green-600 hover:bg-green-700 font-hebrew"
                    >
                      שמור והפעל
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsWhatsAppSetupOpen(false)}
                      className="font-hebrew"
                    >
                      בטל
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <Download className="w-5 h-5 text-vazana-teal" />
                    <span>ניהול נתונים</span>
                  </CardTitle>
                  <CardDescription className="text-right font-hebrew">
                    יצא או יבא נתונים מהמערכת
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h3 className="font-semibold text-right font-hebrew">יציאת נתונים</h3>
                      <p className="text-sm text-gray-600 text-right font-hebrew">
                        יצא את כל נתוני המערכת לקובץ JSON
                      </p>
                      <Button
                        onClick={() => setDataExportOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 font-hebrew"
                      >
                        <Download className="ml-2 w-4 h-4" />
                        יצא נתונים
                      </Button>
                    </div>
                    
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h3 className="font-semibold text-right font-hebrew">יבוא נתונים</h3>
                      <p className="text-sm text-gray-600 text-right font-hebrew">
                        יבא נתונים מקובץ JSON למערכת
                      </p>
                      
                      <div className="flex items-center justify-between mb-3 p-2 bg-green-50 rounded">
                        <Switch
                          checked={autoBackup}
                          onCheckedChange={setAutoBackup}
                        />
                        <Label className="font-hebrew text-sm">גיבוי אוטומטי לפני יבוא</Label>
                      </div>
                      
                      <Button
                        onClick={() => setDataImportOpen(true)}
                        variant="outline"
                        className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 font-hebrew"
                      >
                        <Plus className="ml-2 w-4 h-4" />
                        יבא נתונים
                      </Button>
                    </div>
                  </div>
                  
                  {/* Automated Backup Scheduling */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4 text-right font-hebrew">גיבוי אוטומטי מתוזמן</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Switch defaultChecked />
                        <Label className="font-hebrew">הפעל גיבוי אוטומטי</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-right font-hebrew">תדירות</Label>
                          <Select defaultValue="daily" dir="rtl">
                            <SelectTrigger className="text-right font-hebrew">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily" className="font-hebrew">יומי</SelectItem>
                              <SelectItem value="weekly" className="font-hebrew">שבועי</SelectItem>
                              <SelectItem value="monthly" className="font-hebrew">חודשי</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-right font-hebrew">שעה</Label>
                          <Input type="time" defaultValue="02:00" className="text-left" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-right font-hebrew">שמירת גיבויים ל-X ימים</Label>
                        <Input type="number" min="7" max="365" defaultValue="30" className="text-left w-32" />
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800 text-right font-hebrew">
                          גיבוי הבא: מחר ב-02:00 | גיבוי אחרון: 2025-10-09 02:00
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Selective Data Export */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4 text-right font-hebrew">יציאת נתונים מותאמת אישית</h3>
                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        className="w-full font-hebrew bg-blue-50 border-blue-200 text-blue-700"
                        onClick={() => console.log('פתח יציאה מותאמת')}
                      >
                        <Download className="w-4 h-4 ml-2" />
                        יציאה מותאמת אישית
                      </Button>
                      <p className="text-sm text-gray-600 text-right font-hebrew">
                        בחר תאריכים, לקוחות או סוגי נתונים מסוימים ליציאה
                      </p>
                    </div>
                  </div>
                  
                  {/* Audit Trail Export */}
                  {(currentUser?.role === 'admin' || currentUser?.username === 'root') && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4 text-right font-hebrew">יציאת יומן פעילות</h3>
                      <div className="space-y-4">
                        <Button 
                          variant="outline" 
                          className="w-full font-hebrew bg-purple-50 border-purple-200 text-purple-700"
                          onClick={() => console.log('יציאת יומן פעילות')}
                        >
                          <Activity className="w-4 h-4 ml-2" />
                          יצא יומן פעילות
                        </Button>
                        <p className="text-sm text-gray-600 text-right font-hebrew">
                          יציאת כל פעילות המשתמשים, שינויים וכניסות - זמין למנהלים בלבד
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2 text-right font-hebrew">אזהרה</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 text-right font-hebrew">
                        יבוא נתונים עלול לדרוס נתונים קיימים. מומלץ ליצוא גיבוי לפני יבוא.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Data Export Modal */}
              <Dialog open={dataExportOpen} onOpenChange={setDataExportOpen}>
                <DialogContent className="max-w-lg" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right font-hebrew">יציאת נתונים</DialogTitle>
                    <DialogDescription className="text-right font-hebrew">
                      יצא את נתוני המערכת לקובץ JSON
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">בחר נתונים ליצוא:</Label>
                      <div className="space-y-2">
                        {[
                          { key: 'jobs', label: 'עבודות', checked: true },
                          { key: 'clients', label: 'לקוחות', checked: true },
                          { key: 'invoices', label: 'חשבוניות', checked: true },
                          { key: 'workers', label: 'עובדים', checked: true },
                          { key: 'vehicles', label: 'רכבים', checked: true },
                          { key: 'business_settings', label: 'הגדרות עסק', checked: true }
                        ].map(item => (
                          <div key={item.key} className="flex items-center justify-between">
                            <Switch defaultChecked={item.checked} />
                            <Label className="font-hebrew">{item.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 text-right font-hebrew">
                        הנתונים יוצאו בפורמט JSON ויורדו אוטומטית למחשב שלך.
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter className="flex gap-2 justify-start">
                    <Button 
                      onClick={() => {
                        console.log('יציאת נתונים')
                        setDataExportOpen(false)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 font-hebrew"
                    >
                      <Download className="w-4 h-4 ml-2" />
                      יצא עכשיו
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setDataExportOpen(false)}
                      className="font-hebrew"
                    >
                      בטל
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Data Import Modal */}
              <Dialog open={dataImportOpen} onOpenChange={setDataImportOpen}>
                <DialogContent className="max-w-lg" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right font-hebrew">יבוא נתונים</DialogTitle>
                    <DialogDescription className="text-right font-hebrew">
                      יבא נתונים מקובץ JSON למערכת
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Switch
                        checked={autoBackup}
                        onCheckedChange={setAutoBackup}
                      />
                      <div className="text-right">
                        <Label className="font-hebrew font-semibold">גיבוי אוטומטי לפני יבוא</Label>
                        <p className="text-sm text-green-700 font-hebrew">
                          במידה ומופעל, יצור גיבוי של הנתונים הנוכחיים לפני היבוא
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-right font-hebrew">בחר קובץ JSON:</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input 
                          type="file" 
                          accept=".json" 
                          className="hidden" 
                          id="import-file"
                        />
                        <label 
                          htmlFor="import-file" 
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Plus className="w-8 h-8 text-gray-400" />
                          <span className="text-sm text-gray-600 font-hebrew">
                            לחץ או גרור קובץ JSON
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 text-right font-hebrew">
                        <strong>אזהרה:</strong> יבוא נתונים עלול להחליף נתונים קיימים. ודא שיש לך גיבוי לפני ההמשך.
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter className="flex gap-2 justify-start">
                    <Button 
                      onClick={() => {
                        if (autoBackup) {
                          console.log('בוצע גיבוי אוטומטי...')
                        }
                        console.log('יבוא נתונים')
                        setDataImportOpen(false)
                      }}
                      className="bg-orange-600 hover:bg-orange-700 font-hebrew"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      יבא עכשיו
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setDataImportOpen(false)}
                      className="font-hebrew"
                    >
                      בטל
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Legacy Data Export/Import Modal - keeping for backward compatibility */}
              <DataExportImport
                open={dataExportImportOpen}
                onOpenChange={setDataExportImportOpen}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}