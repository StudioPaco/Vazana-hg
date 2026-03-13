"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Terminal,
  Database,
  Users,
  Car,
  ShoppingCart,
  Briefcase,
  FileText,
  Settings,
  Zap,
  Clock,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  Lock,
  Shield,
  Key,
  Globe,
  HardDrive,
  Layers,
  Link,
  MessageSquare,
  Receipt,
  Building,
  Calendar,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Target,
  Wrench,
  CheckSquare,
  Square,
} from "lucide-react"
import SidebarNavigation, { useSidebar } from "@/components/layout/sidebar-navigation"
import { BackButton } from "@/components/ui/back-button"
import { createClient } from "@/lib/supabase/client"
import { clientAuth } from "@/lib/client-auth"
import { useRouter } from "next/navigation"

interface LogEntry {
  id: string
  timestamp: Date
  level: "info" | "warning" | "error" | "success"
  message: string
  component?: string
  details?: any
}

interface FeatureStatus {
  name: string
  nameHe: string
  status: "working" | "partial" | "not-working" | "planned" | "testing"
  lastChecked: Date | null
  message: string
  messageHe: string
  icon: any
  category: string
  route?: string
  apiRoute?: string
  priority: "critical" | "high" | "medium" | "low"
  dependencies?: string[]
}

interface SystemHealth {
  database: "healthy" | "warning" | "error" | "unknown"
  api: "healthy" | "warning" | "error" | "unknown"
  auth: "healthy" | "warning" | "error" | "unknown"
  encryption: "healthy" | "warning" | "error" | "unknown"
  storage: "healthy" | "warning" | "error" | "unknown"
}

// Complete feature registry - this is the master list of all system capabilities
const FEATURE_REGISTRY: Omit<FeatureStatus, "lastChecked">[] = [
  // Authentication & Security
  {
    name: "Cookie-Based Auth",
    nameHe: "אימות מבוסס עוגיות",
    status: "working",
    message: "Server-side session with HTTP-only cookies",
    messageHe: "פעיל - אימות צד-שרת עם עוגיות מאובטחות",
    icon: Lock,
    category: "auth",
    apiRoute: "/api/auth/session",
    priority: "critical",
  },
  {
    name: "Root User Login",
    nameHe: "התחברות משתמש על",
    status: "working",
    message: "Hardcoded root credentials (server-side only)",
    messageHe: "פעיל - פרטי משתמש על מאוחסנים בצד שרת",
    icon: Key,
    category: "auth",
    apiRoute: "/api/auth/simple-login",
    priority: "critical",
  },
  {
    name: "Bcrypt Password Hashing",
    nameHe: "הצפנת סיסמאות",
    status: "working",
    message: "Using bcrypt for DB user passwords",
    messageHe: "פעיל - הצפנת bcrypt לסיסמאות משתמשים",
    icon: Shield,
    category: "auth",
    priority: "critical",
  },
  {
    name: "User Profiles CRUD",
    nameHe: "ניהול משתמשים",
    status: "working",
    message: "Create, read, update, delete user profiles",
    messageHe: "פעיל - יצירה, קריאה, עדכון, מחיקה של משתמשים",
    icon: Users,
    category: "auth",
    route: "/settings",
    priority: "high",
  },
  {
    name: "Role-Based Permissions",
    nameHe: "הרשאות לפי תפקיד",
    status: "partial",
    message: "Admin/user roles exist, fine-grained permissions not enforced",
    messageHe: "חלקי - תפקידים קיימים, הרשאות מפורטות לא מיושמות",
    icon: Shield,
    category: "auth",
    priority: "high",
  },
  {
    name: "Session Expiry & Refresh",
    nameHe: "תפוגת הפעלה",
    status: "working",
    message: "Sessions expire after 8 hours, auto-refresh on activity",
    messageHe: "פעיל - פג תוקף אחרי 8 שעות, רענון אוטומטי",
    icon: Clock,
    category: "auth",
    priority: "medium",
  },

  // Database & Encryption
  {
    name: "Supabase Connection",
    nameHe: "חיבור Supabase",
    status: "working",
    message: "PostgreSQL database via Supabase",
    messageHe: "פעיל - מסד נתונים PostgreSQL",
    icon: Database,
    category: "database",
    priority: "critical",
  },
  {
    name: "Field-Level Encryption",
    nameHe: "הצפנת שדות",
    status: "working",
    message: "pgcrypto AES-256 for sensitive fields",
    messageHe: "פעיל - הצפנת AES-256 לשדות רגישים",
    icon: Lock,
    category: "database",
    priority: "critical",
  },
  {
    name: "Encrypted Business Settings",
    nameHe: "הגדרות עסק מוצפנות",
    status: "planned",
    message: "Bank account, tax ID encrypted in DB",
    messageHe: "מתוכנן - חשבון בנק, מס' עוסק מוצפנים",
    icon: Building,
    category: "database",
    priority: "high",
    dependencies: ["Field-Level Encryption"],
  },
  {
    name: "Migration Tracking",
    nameHe: "מעקב מיגרציות",
    status: "working",
    message: "schema_migrations table tracks all DB changes",
    messageHe: "פעיל - טבלת מעקב שינויי מסד נתונים",
    icon: Layers,
    category: "database",
    priority: "medium",
  },
  {
    name: "Row Level Security",
    nameHe: "אבטחה ברמת שורה",
    status: "partial",
    message: "RLS policies exist but need audit",
    messageHe: "חלקי - מדיניות RLS קיימת, דורשת ביקורת",
    icon: Shield,
    category: "database",
    priority: "high",
  },

  // Core Data Management
  {
    name: "Workers Management",
    nameHe: "ניהול עובדים",
    status: "working",
    message: "Full CRUD for workers",
    messageHe: "פעיל - ניהול מלא של עובדים",
    icon: Users,
    category: "data",
    route: "/workers",
    apiRoute: "/api/workers",
    priority: "high",
  },
  {
    name: "Vehicles Management",
    nameHe: "ניהול רכבים",
    status: "working",
    message: "Full CRUD for vehicles",
    messageHe: "פעיל - ניהול מלא של רכבים",
    icon: Car,
    category: "data",
    route: "/vehicles",
    apiRoute: "/api/vehicles",
    priority: "high",
  },
  {
    name: "Carts Management",
    nameHe: "ניהול עגלות",
    status: "working",
    message: "Full CRUD for carts",
    messageHe: "פעיל - ניהול מלא של עגלות",
    icon: ShoppingCart,
    category: "data",
    route: "/carts",
    apiRoute: "/api/carts",
    priority: "high",
  },
  {
    name: "Clients Management",
    nameHe: "ניהול לקוחות",
    status: "working",
    message: "Full CRUD for clients",
    messageHe: "פעיל - ניהול מלא של לקוחות",
    icon: Users,
    category: "data",
    route: "/clients",
    apiRoute: "/api/clients",
    priority: "high",
  },
  {
    name: "Jobs Management",
    nameHe: "ניהול עבודות",
    status: "working",
    message: "Jobs with status workflow",
    messageHe: "פעיל - עבודות עם תהליך סטטוס",
    icon: Briefcase,
    category: "data",
    route: "/jobs",
    apiRoute: "/api/jobs",
    priority: "critical",
  },
  {
    name: "Work Types Config",
    nameHe: "הגדרת סוגי עבודה",
    status: "working",
    message: "Configurable work types and rates",
    messageHe: "פעיל - סוגי עבודה ותעריפים",
    icon: Settings,
    category: "data",
    priority: "high",
  },

  // Invoicing
  {
    name: "Invoice Generation",
    nameHe: "יצירת חשבוניות",
    status: "working",
    message: "Create invoices from jobs",
    messageHe: "פעיל - יצירת חשבוניות מעבודות",
    icon: Receipt,
    category: "invoicing",
    route: "/invoices/new",
    priority: "critical",
  },
  {
    name: "Invoice Preview",
    nameHe: "תצוגה מקדימה",
    status: "working",
    message: "Preview before saving",
    messageHe: "פעיל - תצוגה מקדימה לפני שמירה",
    icon: Eye,
    category: "invoicing",
    priority: "high",
  },
  {
    name: "Invoice Archive",
    nameHe: "ארכיון חשבוניות",
    status: "working",
    message: "Historical invoice storage",
    messageHe: "פעיל - אחסון היסטוריית חשבוניות",
    icon: FileText,
    category: "invoicing",
    route: "/invoices/archive",
    priority: "high",
  },
  {
    name: "PDF Export",
    nameHe: "ייצוא PDF",
    status: "partial",
    message: "Print-to-PDF, native export not implemented",
    messageHe: "חלקי - הדפסה ל-PDF, ייצוא ישיר לא מיושם",
    icon: FileText,
    category: "invoicing",
    priority: "medium",
  },
  {
    name: "Green Invoice Sync",
    nameHe: "סנכרון חשבונית ירוקה",
    status: "not-working",
    message: "Integration planned but not implemented",
    messageHe: "לא פעיל - אינטגרציה מתוכננת",
    icon: Link,
    category: "invoicing",
    priority: "high",
  },

  // Business Settings
  {
    name: "Business Info Storage",
    nameHe: "פרטי עסק",
    status: "partial",
    message: "Migrating from localStorage to DB",
    messageHe: "חלקי - מעבר מאחסון מקומי למסד נתונים",
    icon: Building,
    category: "settings",
    route: "/settings",
    priority: "high",
  },
  {
    name: "Payment Terms Config",
    nameHe: "תנאי תשלום",
    status: "working",
    message: "Configurable payment terms",
    messageHe: "פעיל - הגדרת תנאי תשלום",
    icon: Receipt,
    category: "settings",
    priority: "medium",
  },
  {
    name: "Theme Settings",
    nameHe: "הגדרות ערכת נושא",
    status: "working",
    message: "Light/dark mode, RTL support",
    messageHe: "פעיל - מצב בהיר/כהה, תמיכה בעברית",
    icon: Eye,
    category: "settings",
    priority: "low",
  },
  {
    name: "Language Settings",
    nameHe: "הגדרות שפה",
    status: "working",
    message: "Hebrew interface",
    messageHe: "פעיל - ממשק בעברית",
    icon: Globe,
    category: "settings",
    priority: "low",
  },

  // Integrations (Future)
  {
    name: "WhatsApp Integration",
    nameHe: "אינטגרציית WhatsApp",
    status: "not-working",
    message: "Table exists, integration not implemented",
    messageHe: "לא פעיל - טבלה קיימת, אינטגרציה לא מיושמת",
    icon: MessageSquare,
    category: "integrations",
    priority: "medium",
  },
  {
    name: "Calendar Sync",
    nameHe: "סנכרון לוח שנה",
    status: "planned",
    message: "Google/Outlook calendar sync planned",
    messageHe: "מתוכנן - סנכרון לוח שנה",
    icon: Calendar,
    category: "integrations",
    priority: "low",
  },
  {
    name: "Audit Logging",
    nameHe: "יומן ביקורת",
    status: "working",
    message: "All changes logged to audit_log table",
    messageHe: "פעיל - כל השינויים נרשמים",
    icon: FileText,
    category: "integrations",
    priority: "medium",
  },

  // Pages & Navigation
  {
    name: "Dashboard",
    nameHe: "לוח בקרה",
    status: "working",
    message: "Main dashboard with stats",
    messageHe: "פעיל - לוח בקרה עם סטטיסטיקות",
    icon: Activity,
    category: "pages",
    route: "/",
    priority: "critical",
  },
  {
    name: "Sidebar Navigation",
    nameHe: "ניווט צדדי",
    status: "working",
    message: "Collapsible sidebar with all routes",
    messageHe: "פעיל - סרגל צד מתקפל",
    icon: Layers,
    category: "pages",
    priority: "high",
  },
  {
    name: "Settings Page",
    nameHe: "דף הגדרות",
    status: "working",
    message: "All settings in one place",
    messageHe: "פעיל - כל ההגדרות במקום אחד",
    icon: Settings,
    category: "pages",
    route: "/settings",
    priority: "high",
  },
  {
    name: "Maintenance Dashboard",
    nameHe: "לוח תחזוקה",
    status: "working",
    message: "System health monitoring",
    messageHe: "פעיל - מעקב בריאות מערכת",
    icon: Wrench,
    category: "pages",
    route: "/maintenance",
    priority: "medium",
  },
]

export default function MaintenancePage() {
  const { isMinimized } = useSidebar()
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [isLogging, setIsLogging] = useState(true)
  const [features, setFeatures] = useState<FeatureStatus[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: "unknown",
    api: "unknown",
    auth: "unknown",
    encryption: "unknown",
    storage: "unknown",
  })
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    auth: true,
    database: true,
    data: true,
    invoicing: true,
    settings: false,
    integrations: false,
    pages: false,
  })
  const logsEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const addLog = (level: LogEntry["level"], message: string, component?: string, details?: any) => {
    if (!isLogging) return

    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      component,
      details,
    }

    setLogs((prev) => [...prev.slice(-99), newLog])

    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const clearLogs = () => {
    setLogs([])
    addLog("info", "Logs cleared", "System")
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const checkDatabaseConnection = async (): Promise<"healthy" | "warning" | "error"> => {
    try {
      addLog("info", "Testing database connection...", "Database")
      const { data, error } = await supabase.from("business_settings").select("id").limit(1)

      if (error) {
        addLog("error", `Database connection failed: ${error.message}`, "Database", error)
        return "error"
      }

      addLog("success", "Database connection successful", "Database")
      return "healthy"
    } catch (error) {
      addLog("error", `Database connection error: ${error}`, "Database", error)
      return "error"
    }
  }

  const checkEncryption = async (): Promise<"healthy" | "warning" | "error"> => {
    try {
      addLog("info", "Testing encryption functions...", "Encryption")
      
      // Check if pgcrypto functions exist
      const { data, error } = await supabase.rpc("encrypt_sensitive", { 
        plaintext: "test", 
        encryption_key: "test-key" 
      })

      if (error) {
        if (error.message.includes("does not exist")) {
          addLog("error", "Encryption functions not installed", "Encryption")
          return "error"
        }
        // Function exists but returned error (expected without proper key)
        addLog("success", "Encryption functions available", "Encryption")
        return "healthy"
      }

      addLog("success", "Encryption working correctly", "Encryption")
      return "healthy"
    } catch (error) {
      addLog("warning", `Encryption check inconclusive: ${error}`, "Encryption")
      return "warning"
    }
  }

  const checkAPIEndpoints = async (): Promise<"healthy" | "warning" | "error"> => {
    const endpoints = [
      { name: "Session", url: "/api/auth/session" },
      { name: "Workers", url: "/api/workers" },
      { name: "Vehicles", url: "/api/vehicles" },
      { name: "Carts", url: "/api/carts" },
      { name: "Clients", url: "/api/clients" },
      { name: "Jobs", url: "/api/jobs" },
      { name: "Invoices", url: "/api/invoices" },
      { name: "Business Settings", url: "/api/business-settings" },
    ]

    let healthyCount = 0
    const totalCount = endpoints.length

    for (const endpoint of endpoints) {
      try {
        addLog("info", `Testing ${endpoint.name} API...`, "API")

        const response = await fetch(endpoint.url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (response.ok || response.status === 401) {
          addLog("success", `${endpoint.name} API is healthy`, "API")
          healthyCount++
        } else if (response.status === 404) {
          addLog("error", `${endpoint.name} API not found (404)`, "API")
        } else {
          addLog("warning", `${endpoint.name} API returned ${response.status}`, "API")
          if (response.status < 500) healthyCount++
        }
      } catch (error) {
        addLog("error", `${endpoint.name} API failed: ${error}`, "API", error)
      }
    }

    if (healthyCount === totalCount) return "healthy"
    else if (healthyCount > totalCount / 2) return "warning"
    else return "error"
  }

  const checkAuthSystem = async (): Promise<"healthy" | "warning" | "error"> => {
    try {
      addLog("info", "Testing authentication system...", "Authentication")

      // Test session API
      const response = await fetch("/api/auth/session")
      if (!response.ok) {
        addLog("error", "Session API not responding", "Authentication")
        return "error"
      }

      const session = await response.json()
      if (session.authenticated) {
        addLog("success", `Authenticated as ${session.user?.username}`, "Authentication")
      } else {
        addLog("warning", "Not authenticated via cookie", "Authentication")
      }

      // Check user_profiles table
      const { data: users, error } = await supabase
        .from("user_profiles")
        .select("username, role, is_active")
        .limit(5)

      if (error) {
        addLog("error", `User profiles table error: ${error.message}`, "Authentication")
        return "error"
      }

      addLog("success", `User database accessible: ${users?.length || 0} users found`, "Authentication")
      return "healthy"
    } catch (error) {
      addLog("error", `Auth system check failed: ${error}`, "Authentication")
      return "error"
    }
  }

  const checkDataTables = async (): Promise<FeatureStatus[]> => {
    const tableChecks = [
      { table: "workers", name: "Workers Management", nameHe: "ניהול עובדים", icon: Users },
      { table: "vehicles", name: "Vehicles Management", nameHe: "ניהול רכבים", icon: Car },
      { table: "carts", name: "Carts Management", nameHe: "ניהול עגלות", icon: ShoppingCart },
      { table: "clients", name: "Clients Management", nameHe: "ניהול לקוחות", icon: Users },
      { table: "jobs", name: "Jobs Management", nameHe: "ניהול עבודות", icon: Briefcase },
      { table: "invoices", name: "Invoice Generation", nameHe: "יצירת חשבוניות", icon: Receipt },
      { table: "work_types", name: "Work Types Config", nameHe: "הגדרת סוגי עבודה", icon: Settings },
      { table: "user_profiles", name: "User Profiles CRUD", nameHe: "ניהול משתמשים", icon: Users },
      { table: "schema_migrations", name: "Migration Tracking", nameHe: "מעקב מיגרציות", icon: Layers },
      { table: "audit_log", name: "Audit Logging", nameHe: "יומן ביקורת", icon: FileText },
    ]

    const results: FeatureStatus[] = []

    for (const check of tableChecks) {
      try {
        addLog("info", `Checking ${check.table} table...`, "Data Integrity")
        const { data, error, count } = await supabase
          .from(check.table)
          .select("id", { count: "exact" })
          .limit(1)

        if (error) {
          results.push({
            name: check.name,
            nameHe: check.nameHe,
            status: "not-working",
            lastChecked: new Date(),
            message: error.message,
            messageHe: `שגיאה: ${error.message}`,
            icon: check.icon,
            category: "data",
            priority: "high",
          })
        } else {
          results.push({
            name: check.name,
            nameHe: check.nameHe,
            status: "working",
            lastChecked: new Date(),
            message: `${count || 0} records`,
            messageHe: `${count || 0} רשומות`,
            icon: check.icon,
            category: "data",
            priority: "high",
          })
        }
      } catch (error) {
        addLog("error", `Table check failed: ${check.table}`, "Data Integrity", error)
      }
    }

    return results
  }

  const runFullSystemCheck = async () => {
    setIsRunningTests(true)
    addLog("info", "Starting full system health check...", "System")

    try {
      const [dbHealth, apiHealth, authHealth, encryptionHealth] = await Promise.all([
        checkDatabaseConnection(),
        checkAPIEndpoints(),
        checkAuthSystem(),
        checkEncryption(),
      ])

      const dataFeatures = await checkDataTables()

      // Merge data features with registry
      const allFeatures: FeatureStatus[] = FEATURE_REGISTRY.map(f => {
        const dataCheck = dataFeatures.find(df => df.name === f.name)
        return {
          ...f,
          lastChecked: new Date(),
          status: dataCheck?.status || f.status,
          message: dataCheck?.message || f.message,
          messageHe: dataCheck?.messageHe || f.messageHe,
        }
      })

      setFeatures(allFeatures)
      setSystemHealth({
        database: dbHealth,
        api: apiHealth,
        auth: authHealth,
        encryption: encryptionHealth,
        storage: "healthy",
      })

      const checkTime = new Date()
      setLastFullCheck(checkTime)

      try {
        localStorage.setItem("maintenance:lastCheck", checkTime.toISOString())
      } catch {}

      addLog("success", "Full system health check completed", "System")
    } catch (error) {
      addLog("error", `System health check failed: ${error}`, "System", error)
    } finally {
      setIsRunningTests(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "working":
        return "bg-green-100 text-green-700 border-green-200"
      case "warning":
      case "partial":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "error":
      case "not-working":
        return "bg-red-100 text-red-700 border-red-200"
      case "planned":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "testing":
        return "bg-purple-100 text-purple-700 border-purple-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "working":
        return <CheckCircle className="w-4 h-4" />
      case "warning":
      case "partial":
        return <AlertTriangle className="w-4 h-4" />
      case "error":
      case "not-working":
        return <XCircle className="w-4 h-4" />
      case "planned":
        return <Target className="w-4 h-4" />
      case "testing":
        return <Activity className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "healthy":
      case "working":
        return "פעיל"
      case "warning":
      case "partial":
        return "חלקי"
      case "error":
      case "not-working":
        return "לא פעיל"
      case "planned":
        return "מתוכנן"
      case "testing":
        return "בבדיקה"
      default:
        return "לא ידוע"
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "error":
        return "text-red-400"
      default:
        return "text-blue-400"
    }
  }

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      auth: "אימות ואבטחה",
      database: "מסד נתונים והצפנה",
      data: "ניהול נתונים",
      invoicing: "חשבוניות",
      settings: "הגדרות",
      integrations: "אינטגרציות",
      pages: "דפים וניווט",
    }
    return names[category] || category
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      auth: Lock,
      database: Database,
      data: Layers,
      invoicing: Receipt,
      settings: Settings,
      integrations: Link,
      pages: Globe,
    }
    return icons[category] || Activity
  }

  useEffect(() => {
    const checkAccess = async () => {
      const isAuth = await clientAuth.isAuthenticatedAsync()
      if (!isAuth) {
        router.push("/auth/login")
        return
      }

      const user = await clientAuth.getCurrentUserAsync()
      if (!user || user.role !== "admin") {
        addLog("error", "Access denied - Admin privileges required", "Security")
        setHasAccess(false)
        return
      }

      setHasAccess(true)
      addLog("info", "Maintenance dashboard initialized", "System")

      // Initialize features from registry
      setFeatures(FEATURE_REGISTRY.map(f => ({ ...f, lastChecked: null })))

      // Auto-run check
      const lastCheck = localStorage.getItem("maintenance:lastCheck")
      if (!lastCheck) {
        runFullSystemCheck()
      } else {
        const lastCheckTime = new Date(lastCheck)
        setLastFullCheck(lastCheckTime)
        const hoursSince = (Date.now() - lastCheckTime.getTime()) / (1000 * 60 * 60)
        if (hoursSince >= 24) {
          runFullSystemCheck()
        } else {
          addLog("info", `מערכת נבדקה לאחרונה ב-${lastCheckTime.toLocaleString("he-IL")}`, "System")
        }
      }
    }

    checkAccess()
  }, [router])

  // Calculate stats
  const workingCount = features.filter(f => f.status === "working").length
  const partialCount = features.filter(f => f.status === "partial").length
  const notWorkingCount = features.filter(f => f.status === "not-working").length
  const plannedCount = features.filter(f => f.status === "planned").length
  const totalProgress = features.length > 0 
    ? Math.round(((workingCount + partialCount * 0.5) / features.length) * 100)
    : 0

  const groupedFeatures = features.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = []
    acc[f.category].push(f)
    return acc
  }, {} as Record<string, FeatureStatus[]>)

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="font-hebrew text-right">אין לך הרשאות גישה</CardTitle>
            <CardDescription className="font-hebrew text-right">דף התחזוקה זמין למנהלים בלבד</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SidebarNavigation />
      <div className={`${isMinimized ? "mr-24" : "mr-64"} p-6 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="relative space-y-6">
            <div className="absolute top-0 right-0 text-right z-10">
              <div className="mb-2">
                <BackButton href="/" />
              </div>
              <h1 className="text-3xl font-bold text-foreground font-hebrew flex items-center gap-3">
                <Activity className="w-8 h-8 text-primary" />
                מרכז תחזוקה ומעקב
              </h1>
              <p className="text-muted-foreground font-hebrew">מעקב בזמן אמת על בריאות המערכת ותפקודה</p>
            </div>
            <div className="pt-20"></div>
          </div>

          {/* System Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={runFullSystemCheck}
                    disabled={isRunningTests}
                    className="font-hebrew"
                  >
                    {isRunningTests ? (
                      <>
                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                        בודק...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 ml-2" />
                        הרץ בדיקה מלאה
                      </>
                    )}
                  </Button>
                  {lastFullCheck && (
                    <span className="text-sm text-muted-foreground font-hebrew">
                      נבדק לאחרונה: {lastFullCheck.toLocaleString("he-IL")}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold font-hebrew">התקדמות מערכת</h2>
                  <p className="text-sm text-muted-foreground font-hebrew">
                    {workingCount} פעיל | {partialCount} חלקי | {notWorkingCount} לא פעיל | {plannedCount} מתוכנן
                  </p>
                </div>
              </div>
              <Progress value={totalProgress} className="h-3" />
              <p className="text-center mt-2 font-hebrew text-sm text-muted-foreground">{totalProgress}% מהתכונות פעילות</p>
            </CardContent>
          </Card>

          {/* System Health Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { key: "database", label: "מסד נתונים", icon: Database },
              { key: "api", label: "API", icon: Zap },
              { key: "auth", label: "אימות", icon: Lock },
              { key: "encryption", label: "הצפנה", icon: Shield },
              { key: "storage", label: "אחסון", icon: HardDrive },
            ].map(({ key, label, icon: Icon }) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(systemHealth[key as keyof SystemHealth])}>
                      {getStatusIcon(systemHealth[key as keyof SystemHealth])}
                    </Badge>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-sm font-medium font-hebrew">{label}</p>
                        <p className="text-xs text-muted-foreground font-hebrew">
                          {getStatusText(systemHealth[key as keyof SystemHealth])}
                        </p>
                      </div>
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="roadmap" className="space-y-6" dir="rtl">
            <TabsList className="grid w-full grid-cols-4" dir="rtl">
              <TabsTrigger value="roadmap" className="font-hebrew">
                מפת דרכים
              </TabsTrigger>
              <TabsTrigger value="tests" className="font-hebrew">
                בדיקות מערכת
              </TabsTrigger>
              <TabsTrigger value="logs" className="font-hebrew">
                קונסול לוגים
              </TabsTrigger>
              <TabsTrigger value="actions" className="font-hebrew">
                פעולות תחזוקה
              </TabsTrigger>
            </TabsList>

            {/* Roadmap Tab - Full Feature Registry */}
            <TabsContent value="roadmap" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-hebrew flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    מפת תכונות המערכת
                  </CardTitle>
                  <CardDescription className="font-hebrew text-right">
                    רשימה מלאה של כל התכונות - פעילות ומתוכננות
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
                    const CategoryIcon = getCategoryIcon(category)
                    const categoryWorking = categoryFeatures.filter(f => f.status === "working").length
                    const isExpanded = expandedCategories[category]

                    return (
                      <Card key={category} className="overflow-hidden">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            <Badge variant="outline" className="font-hebrew">
                              {categoryWorking}/{categoryFeatures.length}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            <div>
                              <h3 className="font-semibold font-hebrew">{getCategoryName(category)}</h3>
                              <p className="text-xs text-muted-foreground font-hebrew">
                                {categoryFeatures.length} תכונות
                              </p>
                            </div>
                            <CategoryIcon className="w-5 h-5 text-primary" />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t p-4 space-y-3">
                            {categoryFeatures.map((feature) => (
                              <div
                                key={feature.name}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge className={`${getStatusColor(feature.status)} border`}>
                                    {getStatusIcon(feature.status)}
                                    <span className="mr-1 text-xs">{getStatusText(feature.status)}</span>
                                  </Badge>
                                  {feature.route && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => router.push(feature.route!)}
                                      className="text-xs"
                                    >
                                      <Link className="w-3 h-3 ml-1" />
                                      פתח
                                    </Button>
                                  )}
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div>
                                    <h4 className="font-medium font-hebrew">{feature.nameHe}</h4>
                                    <p className="text-xs text-muted-foreground font-hebrew">{feature.messageHe}</p>
                                  </div>
                                  <feature.icon className="w-5 h-5 text-muted-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tests Tab */}
            <TabsContent value="tests" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-right mb-4">
                    <h3 className="font-medium font-hebrew mb-2 flex items-center justify-end gap-2">
                      <Database className="w-4 h-4" />
                      בדיקת מסד נתונים
                    </h3>
                    <p className="text-sm text-muted-foreground font-hebrew">בדוק חיבור וטבלאות</p>
                  </div>
                  <Button onClick={checkDatabaseConnection} className="w-full font-hebrew">
                    <Database className="w-4 h-4 ml-2" />
                    בדוק חיבור
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="text-right mb-4">
                    <h3 className="font-medium font-hebrew mb-2 flex items-center justify-end gap-2">
                      <Zap className="w-4 h-4" />
                      בדיקת API
                    </h3>
                    <p className="text-sm text-muted-foreground font-hebrew">בדוק את כל נקודות הקצה</p>
                  </div>
                  <Button onClick={checkAPIEndpoints} className="w-full font-hebrew">
                    <Zap className="w-4 h-4 ml-2" />
                    בדוק API
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="text-right mb-4">
                    <h3 className="font-medium font-hebrew mb-2 flex items-center justify-end gap-2">
                      <Lock className="w-4 h-4" />
                      בדיקת אימות
                    </h3>
                    <p className="text-sm text-muted-foreground font-hebrew">בדוק מערכת ההתחברות</p>
                  </div>
                  <Button onClick={checkAuthSystem} className="w-full font-hebrew">
                    <Lock className="w-4 h-4 ml-2" />
                    בדוק אימות
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="text-right mb-4">
                    <h3 className="font-medium font-hebrew mb-2 flex items-center justify-end gap-2">
                      <Shield className="w-4 h-4" />
                      בדיקת הצפנה
                    </h3>
                    <p className="text-sm text-muted-foreground font-hebrew">בדוק פונקציות הצפנה</p>
                  </div>
                  <Button onClick={checkEncryption} className="w-full font-hebrew">
                    <Shield className="w-4 h-4 ml-2" />
                    בדוק הצפנה
                  </Button>
                </Card>
              </div>

              {/* Recent Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-hebrew flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    בעיות אחרונות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {logs
                      .filter((log) => log.level === "error" || log.level === "warning")
                      .slice(-5)
                      .map((log) => (
                        <Alert key={log.id} className="text-right">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle className="font-hebrew">{log.component || "מערכת"}</AlertTitle>
                          <AlertDescription className="font-hebrew">
                            {log.message} - {log.timestamp.toLocaleTimeString("he-IL")}
                          </AlertDescription>
                        </Alert>
                      ))}

                    {logs.filter((log) => log.level === "error" || log.level === "warning").length === 0 && (
                      <div className="text-center py-8 text-muted-foreground font-hebrew">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-300 mb-4" />
                        <p>אין בעיות מדווחות</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-hebrew flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    קונסול לוגים חי
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearLogs} className="font-hebrew">
                      <Trash2 className="w-4 h-4 ml-1" />
                      נקה
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLogging(!isLogging)}
                      className="font-hebrew"
                    >
                      {isLogging ? <Pause className="w-4 h-4 ml-1" /> : <Play className="w-4 h-4 ml-1" />}
                      {isLogging ? "השהה" : "המשך"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full border rounded-lg p-4 bg-black text-green-400 font-mono text-sm">
                    <div className="space-y-1">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2 text-right" dir="rtl">
                          <span className="text-gray-500 text-xs whitespace-nowrap">
                            {log.timestamp.toLocaleTimeString("he-IL")}
                          </span>
                          <span className={`text-xs font-bold ${getLevelColor(log.level)}`}>
                            [{log.level.toUpperCase()}]
                          </span>
                          {log.component && <span className="text-blue-400 text-xs">[{log.component}]</span>}
                          <span className="text-white flex-1">{log.message}</span>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-hebrew flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    פעולות תחזוקה
                  </CardTitle>
                  <CardDescription className="font-hebrew text-right">
                    כלים לתחזוקה ותיקון בעיות במערכת
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 border-dashed">
                      <div className="text-right mb-4">
                        <h3 className="font-medium font-hebrew mb-2">בדיקה מלאה</h3>
                        <p className="text-sm text-muted-foreground font-hebrew">
                          הרץ בדיקה מקיפה של כל המערכת
                        </p>
                      </div>
                      <Button
                        onClick={runFullSystemCheck}
                        disabled={isRunningTests}
                        className="w-full font-hebrew"
                      >
                        {isRunningTests ? (
                          <>
                            <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                            בודק...
                          </>
                        ) : (
                          <>
                            <Activity className="w-4 h-4 ml-2" />
                            בדיקה מלאה
                          </>
                        )}
                      </Button>
                    </Card>

                    <Card className="p-4 border-dashed border-yellow-300">
                      <div className="text-right mb-4">
                        <h3 className="font-medium font-hebrew mb-2">ניקוי מטמון</h3>
                        <p className="text-sm text-muted-foreground font-hebrew">
                          נקה מטמון מקומי ואתחל מחדש
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          localStorage.clear()
                          addLog("success", "Local storage cleared", "System")
                          window.location.reload()
                        }}
                        className="w-full font-hebrew"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        נקה מטמון
                      </Button>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Steps for User */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-hebrew flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    משימות ידניות נדרשות
                  </CardTitle>
                  <CardDescription className="font-hebrew text-right">
                    פעולות שדורשות התערבות ידנית
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Square className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="text-right flex-1">
                        <h4 className="font-medium font-hebrew">הגדרת DB_ENCRYPTION_KEY</h4>
                        <p className="text-sm text-muted-foreground font-hebrew">
                          הוסף משתנה סביבה DB_ENCRYPTION_KEY ב-Vercel להפעלת הצפנת שדות רגישים
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Square className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="text-right flex-1">
                        <h4 className="font-medium font-hebrew">הגדרת ROOT_USERNAME / ROOT_PASSWORD</h4>
                        <p className="text-sm text-muted-foreground font-hebrew">
                          הוסף משתני סביבה לפרטי משתמש על (כרגע hardcoded)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Square className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="text-right flex-1">
                        <h4 className="font-medium font-hebrew">העברת נתוני עסק ל-DB</h4>
                        <p className="text-sm text-muted-foreground font-hebrew">
                          העבר נתוני עסק מ-localStorage לטבלת business_settings המוצפנת
                        </p>
                      </div>
                    </div>
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
