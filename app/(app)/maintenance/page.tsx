"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
} from "lucide-react"
// Sidebar handled by (app) layout
import PageLayout from "@/components/layout/page-layout"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { Download } from "lucide-react"

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
  status: "healthy" | "warning" | "error" | "unknown"
  lastChecked: Date
  message: string
  icon: any
  category: string
}

interface SystemHealth {
  database: "healthy" | "warning" | "error" | "unknown"
  api: "healthy" | "warning" | "error" | "unknown"
  auth: "healthy" | "warning" | "error" | "unknown"
  integrations: "healthy" | "warning" | "error" | "unknown"
}

export function MaintenanceContent({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter()
  const { profile: authProfile, isLoading: authLoading } = useAuth()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isLogging, setIsLogging] = useState(true)
  const [features, setFeatures] = useState<FeatureStatus[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: "unknown",
    api: "unknown",
    auth: "unknown",
    integrations: "unknown",
  })
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null)
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

    setLogs((prev) => [...prev.slice(-199), newLog]) // Keep last 200 logs in UI

    // Persist to Supabase (fire-and-forget)
    fetch("/api/maintenance-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, message, component, details: details ? JSON.stringify(details) : null }),
    }).catch((err) => console.warn("Failed to persist log:", err))

    // Auto-scroll to bottom
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const loadLogHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch("/api/maintenance-logs?limit=200")
      if (res.ok) {
        const { data } = await res.json()
        if (data && data.length > 0) {
          const historicLogs: LogEntry[] = data.map((row: any) => ({
            id: row.id,
            timestamp: new Date(row.timestamp),
            level: row.level,
            message: row.message,
            component: row.component,
            details: row.details,
          }))
          // Prepend history (oldest first) then append any current session logs
          setLogs((prev) => [...historicLogs.reverse(), ...prev])
        }
      }
    } catch (err) {
      console.warn("Failed to load log history:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const exportLogs = () => {
    const exportData = logs.map((log) => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      message: log.message,
      component: log.component || "",
      details: log.details,
    }))
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `maintenance-logs-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearLogs = async () => {
    setLogs([])
    // Also clear persisted logs
    try {
      await fetch("/api/maintenance-logs", { method: "DELETE" })
    } catch (err) {
      console.warn("Failed to clear persisted logs:", err)
    }
    addLog("info", "Logs cleared", "System")
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

  const checkAPIEndpoints = async (): Promise<"healthy" | "warning" | "error"> => {
    const endpoints = [
      { name: "Workers", url: "/api/workers" },
      { name: "Vehicles", url: "/api/vehicles" },
      { name: "Carts", url: "/api/carts" },
      { name: "Clients", url: "/api/clients" },
      { name: "Jobs", url: "/api/jobs" },
    ]

    let healthyCount = 0
    const totalCount = endpoints.length

    for (const endpoint of endpoints) {
      try {
        addLog("info", `Testing ${endpoint.name} API...`, "API")

        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        // Consider both 200 OK and 401 Unauthorized as "healthy" since 401 means the endpoint exists and responds
        if (response.ok || response.status === 401) {
          addLog("success", `${endpoint.name} API is healthy`, "API")
          healthyCount++
        } else if (response.status === 404) {
          addLog("error", `${endpoint.name} API not found (404)`, "API")
        } else {
          addLog("warning", `${endpoint.name} API returned ${response.status}`, "API")
          if (response.status < 500) {
            // Client errors (4xx) except 404 still count as "working" endpoints
            healthyCount++
          }
        }
      } catch (error) {
        addLog("error", `${endpoint.name} API failed: ${error}`, "API", error)
      }
    }

    if (healthyCount === totalCount) {
      return "healthy"
    } else if (healthyCount > totalCount / 2) {
      return "warning"
    } else {
      return "error"
    }
  }

  const checkDataIntegrity = async (): Promise<FeatureStatus[]> => {
    const features: FeatureStatus[] = []

    // Helper: count rows in a table
    const countTable = async (table: string) => {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })
      return { count: count ?? 0, error }
    }

    try {
      // --- Core resource checks with row counts ---
      const tables = [
        { table: "workers", name: "Workers", icon: Users, category: "Data" },
        { table: "vehicles", name: "Vehicles", icon: Car, category: "Data" },
        { table: "carts", name: "Carts", icon: ShoppingCart, category: "Data" },
        { table: "clients", name: "Clients", icon: Users, category: "Data" },
        { table: "jobs", name: "Jobs", icon: Briefcase, category: "Data" },
        { table: "work_types", name: "Work Types", icon: Settings, category: "Configuration" },
      ]

      for (const t of tables) {
        addLog("info", `Checking ${t.name}...`, "Data Integrity")
        const { count, error } = await countTable(t.table)
        features.push({
          name: t.name,
          status: error ? "error" : count > 0 ? "healthy" : "warning",
          lastChecked: new Date(),
          message: error ? error.message : `${count} rows`,
          icon: t.icon,
          category: t.category,
        })
        if (count > 0) addLog("success", `${t.name}: ${count} rows`, "Data Integrity")
      }

      // --- Invoices table check ---
      addLog("info", "Checking invoices...", "Data Integrity")
      const { count: invoiceCount, error: invErr } = await countTable("invoices")
      features.push({
        name: "Invoices",
        status: invErr ? "error" : "healthy",
        lastChecked: new Date(),
        message: invErr ? invErr.message : `${invoiceCount} invoices`,
        icon: FileText,
        category: "Data",
      })

      // --- Business settings check ---
      addLog("info", "Checking business settings...", "Data Integrity")
      const { data: bsData, error: bsErr } = await supabase
        .from("business_settings")
        .select("id, company_name, company_email, phone")
        .limit(1)
        .single()
      const bsMissing = bsData && (!bsData.company_email && !bsData.phone)
      features.push({
        name: "Business Settings",
        status: bsErr ? "error" : bsMissing ? "warning" : "healthy",
        lastChecked: new Date(),
        message: bsErr ? bsErr.message : bsMissing ? "Missing email/phone — update in Settings" : `${bsData?.company_name || "Configured"}`,
        icon: Settings,
        category: "Configuration",
      })

      // --- User profiles check ---
      addLog("info", "Checking user profiles...", "Data Integrity")
      const { data: users, error: usersErr } = await supabase
        .from("user_profiles")
        .select("id, username, role, is_active")
      const activeUsers = users?.filter(u => u.is_active) || []
      const ownerCount = users?.filter(u => u.role === "owner").length || 0
      features.push({
        name: "User Profiles",
        status: usersErr ? "error" : ownerCount === 0 ? "error" : "healthy",
        lastChecked: new Date(),
        message: usersErr ? usersErr.message : `${activeUsers.length} active users (${ownerCount} owner)`,
        icon: Users,
        category: "Security",
      })
      if (ownerCount === 0) addLog("error", "No owner user found!", "Data Integrity")

      // --- Stale data warnings ---
      addLog("info", "Checking for stale data...", "Data Integrity")
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { count: stalePendingJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "ממתין")
        .lt("job_date", thirtyDaysAgo.toISOString().split("T")[0])

      if (stalePendingJobs && stalePendingJobs > 0) {
        addLog("warning", `${stalePendingJobs} jobs pending payment for 30+ days`, "Data Integrity")
        features.push({
          name: "Stale Pending Jobs",
          status: "warning",
          lastChecked: new Date(),
          message: `${stalePendingJobs} jobs pending payment 30+ days`,
          icon: Clock,
          category: "Data",
        })
      }

    } catch (error) {
      addLog("error", `Data integrity check failed: ${error}`, "Data Integrity", error)
    }

    return features
  }

  const runFullSystemCheck = async () => {
    setIsRunningTests(true)
    addLog("info", "Starting full system health check...", "System")

    try {
      // Check database
      const dbHealth = await checkDatabaseConnection()

      // Check authentication system
      const authHealth = await testAuthenticationSystem()
      
      // Check user management
      const userMgmtHealth = await testUserCreationFlow()

      // Check API endpoints
      const apiHealth = await checkAPIEndpoints()

      // Check data integrity
      const featureStatuses = await checkDataIntegrity()

      // Check storage bucket
      const storageHealth = await checkStorageBucket()
      featureStatuses.push({
        name: "Storage Bucket",
        status: storageHealth,
        lastChecked: new Date(),
        message: storageHealth === "healthy" ? "documents bucket accessible" : "Storage connection failed",
        icon: Database,
        category: "Infrastructure",
      })

      // Check orphaned records
      const orphanResults = await checkOrphanedRecords()
      featureStatuses.push(...orphanResults)

      // Check numbering config
      const numberingResult = await checkNumberingConfig()
      if (numberingResult) featureStatuses.push(numberingResult)

      // Check RLS security
      const rlsResult = await checkRLSSecurity()
      featureStatuses.push(rlsResult)

      // Check session health
      const sessionResult = await checkSessionHealth()
      featureStatuses.push(sessionResult)

      setSystemHealth({
        database: dbHealth,
        api: apiHealth,
        auth: authHealth,
        integrations: storageHealth,
      })

      setFeatures(featureStatuses)
      const checkTime = new Date()
      setLastFullCheck(checkTime)
      
      // Store check timestamp in localStorage for 24h throttling
      try {
        localStorage.setItem('maintenance:lastCheck', checkTime.toISOString())
      } catch (error) {
        console.warn('Could not store maintenance check timestamp:', error)
      }

      addLog("success", "Full system health check completed", "System")
    } catch (error) {
      addLog("error", `System health check failed: ${error}`, "System", error)
    } finally {
      setIsRunningTests(false)
    }
  }

  const autoFixDatabaseIssues = async () => {
    addLog("info", "Starting automatic database fixes...", "Auto-Fix")

    try {
      // Check if sample data exists, if not create it
      const { data: sampleWorkers } = await supabase.from("workers").select("id").eq("is_sample", true).limit(1)

      if (!sampleWorkers || sampleWorkers.length === 0) {
        addLog("info", "Creating sample workers data...", "Auto-Fix")
        await fetch("/api/workers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "עובד דוגמה",
            phone: "050-1234567",
            is_sample: true,
          }),
        })
      }

      const { data: sampleVehicles } = await supabase.from("vehicles").select("id").eq("is_sample", true).limit(1)

      if (!sampleVehicles || sampleVehicles.length === 0) {
        addLog("info", "Creating sample vehicles data...", "Auto-Fix")
        await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "רכב דוגמה",
            license_plate: "123-45-678",
            is_sample: true,
          }),
        })
      }

      const { data: sampleCarts } = await supabase.from("carts").select("id").eq("is_sample", true).limit(1)

      if (!sampleCarts || sampleCarts.length === 0) {
        addLog("info", "Creating sample carts data...", "Auto-Fix")
        await fetch("/api/carts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "עגלה דוגמה",
            capacity: "500kg",
            is_sample: true,
          }),
        })
      }

      addLog("success", "Database auto-fix completed successfully", "Auto-Fix")

      // Refresh the system check
      await runFullSystemCheck()
    } catch (error) {
      addLog("error", `Auto-fix failed: ${error}`, "Auto-Fix", error)
    }
  }

  const fixAPIEndpoints = async () => {
    addLog("info", "Attempting to fix API endpoint issues...", "Auto-Fix")

    try {
      // Check each endpoint and provide detailed diagnostics
      const endpoints = ["/api/workers", "/api/vehicles", "/api/carts", "/api/clients", "/api/jobs"]
      let fixedCount = 0

      for (const endpoint of endpoints) {
        try {
          addLog("info", `Diagnosing ${endpoint}...`, "Auto-Fix")
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            addLog("success", `${endpoint} is working correctly`, "Auto-Fix")
            fixedCount++
          } else if (response.status === 401) {
            addLog("info", `${endpoint} requires authentication (this is normal)`, "Auto-Fix")
            fixedCount++
          } else if (response.status === 404) {
            addLog("error", `${endpoint} not found - route may be missing`, "Auto-Fix")
          } else {
            addLog("warning", `${endpoint} returned ${response.status}`, "Auto-Fix")
          }
        } catch (fetchError) {
          addLog("error", `${endpoint} connection failed: ${fetchError}`, "Auto-Fix")
        }
      }

      addLog("success", `API diagnostics completed: ${fixedCount}/${endpoints.length} endpoints functional`, "Auto-Fix")
      
      // Re-run the full system check to update status
      await runFullSystemCheck()
    } catch (error) {
      addLog("error", `API fix failed: ${error}`, "Auto-Fix", error)
    }
  }

  const testAuthenticationSystem = async (): Promise<"healthy" | "warning" | "error"> => {
    try {
      addLog("info", "Testing authentication system...", "Authentication")
      
      // Test Supabase Auth session
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        addLog("error", "No Supabase Auth session found", "Authentication")
        return "error"
      }
      addLog("success", `Auth user: ${authUser.email}`, "Authentication")
      
      // Test auth profile from context
      if (authProfile) {
        addLog("success", `Profile: ${authProfile.username} (${authProfile.role})`, "Authentication")
      } else {
        addLog("warning", "Auth profile not loaded from context", "Authentication")
      }
      
      // Test user database table
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('username, role, is_active')
        .limit(5)
      
      if (usersError) {
        addLog("error", `User profiles table error: ${usersError.message}`, "Authentication")
        return "error"
      }
      
      addLog("success", `User database accessible: ${users?.length || 0} users found`, "Authentication")
      
      return "healthy"
    } catch (error) {
      addLog("error", `Authentication test failed: ${error}`, "Authentication", error)
      return "error"
    }
  }

  const testUserCreationFlow = async (): Promise<"healthy" | "warning" | "error"> => {
    try {
      addLog("info", "Testing user management flow...", "User Management")
      
      // Test database table structure
      const { data: tableInfo, error: tableError } = await supabase
        .from('user_profiles')
        .select('username, full_name, role, is_active, permissions')
        .limit(1)
      
      if (tableError) {
        addLog("error", `User profiles table error: ${tableError.message}`, "User Management")
        return "error"
      }
      
      addLog("success", "User profiles table accessible", "User Management")
      
      // Test create-user API endpoint reachability
      addLog("info", "Testing create-user API...", "User Management")
      const res = await fetch("/api/auth/create-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        addLog("success", "Create-user API reachable (validation/auth working)", "User Management")
      } else if (res.status === 500) {
        addLog("warning", "Create-user API returned 500 — check server logs", "User Management")
        return "warning"
      }
      
      return "healthy"
    } catch (error) {
      addLog("error", `User management test failed: ${error}`, "User Management", error)
      return "error"
    }
  }

  // --- Advanced Health Checks ---

  const checkStorageBucket = async (): Promise<"healthy" | "warning" | "error"> => {
    try {
      addLog("info", "Testing Supabase Storage connectivity...", "Storage")
      const { data, error } = await supabase.storage.from("documents").list("", { limit: 1 })
      if (error) {
        addLog("error", `Storage bucket error: ${error.message}`, "Storage")
        return "error"
      }
      addLog("success", `Storage bucket 'documents' accessible`, "Storage")
      return "healthy"
    } catch (error) {
      addLog("error", `Storage check failed: ${error}`, "Storage", error)
      return "error"
    }
  }

  const checkOrphanedRecords = async (): Promise<FeatureStatus[]> => {
    const orphanChecks: FeatureStatus[] = []
    try {
      addLog("info", "Checking for orphaned records...", "Data Integrity")

      // Jobs with deleted clients
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, client_id, client_name")
        .not("client_id", "is", null)
        .eq("is_deleted", false)
      const { data: clients } = await supabase.from("clients").select("id")
      const clientIds = new Set((clients || []).map(c => c.id))
      const orphanedJobs = (jobs || []).filter(j => j.client_id && !clientIds.has(j.client_id))
      if (orphanedJobs.length > 0) {
        addLog("warning", `${orphanedJobs.length} jobs reference deleted/missing clients`, "Data Integrity")
        orphanChecks.push({
          name: "Orphaned Jobs",
          status: "warning",
          lastChecked: new Date(),
          message: `${orphanedJobs.length} jobs reference missing clients`,
          icon: AlertTriangle,
          category: "Data",
        })
      }

      // Invoices with deleted clients
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, client_id")
        .not("client_id", "is", null)
      const orphanedInvoices = (invoices || []).filter(i => i.client_id && !clientIds.has(i.client_id))
      if (orphanedInvoices.length > 0) {
        addLog("warning", `${orphanedInvoices.length} invoices reference deleted/missing clients`, "Data Integrity")
        orphanChecks.push({
          name: "Orphaned Invoices",
          status: "warning",
          lastChecked: new Date(),
          message: `${orphanedInvoices.length} invoices reference missing clients`,
          icon: AlertTriangle,
          category: "Data",
        })
      }

      // Documents with missing entities
      const { data: docs } = await supabase.from("documents").select("id, entity_type, entity_id").not("entity_id", "is", null)
      let orphanedDocs = 0
      for (const doc of (docs || [])) {
        if (doc.entity_type === "job") {
          const found = (jobs || []).some(j => j.id === doc.entity_id)
          if (!found) orphanedDocs++
        } else if (doc.entity_type === "client") {
          if (!clientIds.has(doc.entity_id)) orphanedDocs++
        }
      }
      if (orphanedDocs > 0) {
        addLog("warning", `${orphanedDocs} documents reference missing entities`, "Data Integrity")
        orphanChecks.push({
          name: "Orphaned Documents",
          status: "warning",
          lastChecked: new Date(),
          message: `${orphanedDocs} documents reference missing entities`,
          icon: AlertTriangle,
          category: "Data",
        })
      }

      if (orphanChecks.length === 0) {
        addLog("success", "No orphaned records found", "Data Integrity")
      }
    } catch (error) {
      addLog("error", `Orphan check failed: ${error}`, "Data Integrity", error)
    }
    return orphanChecks
  }

  const checkNumberingConfig = async (): Promise<FeatureStatus | null> => {
    try {
      addLog("info", "Checking numbering configuration...", "Configuration")
      const { data, error } = await supabase
        .from("business_settings")
        .select("job_number_prefix, job_number_digits, invoice_number_prefix, invoice_number_digits, form_number_prefix, form_number_digits")
        .limit(1)
        .single()

      if (error) {
        addLog("warning", "Numbering config not found in business_settings", "Configuration")
        return {
          name: "Numbering Config",
          status: "warning",
          lastChecked: new Date(),
          message: "Not configured — using defaults",
          icon: Settings,
          category: "Configuration",
        }
      }

      const issues: string[] = []
      if ((data.job_number_digits ?? 0) < 1 || (data.job_number_digits ?? 0) > 8) issues.push("job digits out of range")
      if ((data.invoice_number_digits ?? 0) < 1 || (data.invoice_number_digits ?? 0) > 8) issues.push("invoice digits out of range")
      if ((data.form_number_digits ?? 0) < 1 || (data.form_number_digits ?? 0) > 8) issues.push("form digits out of range")

      if (issues.length > 0) {
        addLog("warning", `Numbering config issues: ${issues.join(", ")}`, "Configuration")
        return {
          name: "Numbering Config",
          status: "warning",
          lastChecked: new Date(),
          message: issues.join(", "),
          icon: Settings,
          category: "Configuration",
        }
      }

      addLog("success", `Numbering: jobs=${data.job_number_prefix || "(none)"}-${"0".repeat(data.job_number_digits || 4)}, invoices=${data.invoice_number_prefix || "INV"}, forms=${data.form_number_prefix || "FRM"}`, "Configuration")
      return null // healthy, no feature status needed
    } catch (error) {
      addLog("error", `Numbering config check failed: ${error}`, "Configuration", error)
      return null
    }
  }

  const checkRLSSecurity = async (): Promise<FeatureStatus> => {
    try {
      addLog("info", "Testing RLS security...", "Security")
      // Try to access data — if RLS is working, we should only see data allowed by our policies
      const { error: rlsError } = await supabase.from("user_profiles").select("id").limit(1)
      if (rlsError && rlsError.code === "42501") {
        addLog("error", "RLS blocking access to user_profiles — check policies", "Security")
        return { name: "RLS Policies", status: "error", lastChecked: new Date(), message: "RLS blocking legitimate access", icon: Lock, category: "Security" }
      }
      addLog("success", "RLS policies allowing authenticated access", "Security")
      return { name: "RLS Policies", status: "healthy", lastChecked: new Date(), message: "Active and allowing auth access", icon: Lock, category: "Security" }
    } catch (error) {
      addLog("error", `RLS check failed: ${error}`, "Security", error)
      return { name: "RLS Policies", status: "error", lastChecked: new Date(), message: "Check failed", icon: Lock, category: "Security" }
    }
  }

  const checkSessionHealth = async (): Promise<FeatureStatus> => {
    try {
      addLog("info", "Checking session health...", "Security")
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        addLog("error", "No active session", "Security")
        return { name: "Session", status: "error", lastChecked: new Date(), message: "No active session", icon: Lock, category: "Security" }
      }
      const expiresAt = new Date(session.expires_at! * 1000)
      const now = new Date()
      const minutesLeft = Math.round((expiresAt.getTime() - now.getTime()) / 60000)
      if (minutesLeft < 5) {
        addLog("warning", `Session expiring in ${minutesLeft} minutes`, "Security")
        return { name: "Session", status: "warning", lastChecked: new Date(), message: `Expires in ${minutesLeft}m — refresh soon`, icon: Lock, category: "Security" }
      }
      addLog("success", `Session valid, expires in ${minutesLeft}m`, "Security")
      return { name: "Session", status: "healthy", lastChecked: new Date(), message: `Valid for ${minutesLeft} more minutes`, icon: Lock, category: "Security" }
    } catch (error) {
      addLog("error", `Session check failed: ${error}`, "Security", error)
      return { name: "Session", status: "error", lastChecked: new Date(), message: "Check failed", icon: Lock, category: "Security" }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50"
      case "warning":
        return "text-yellow-600 bg-yellow-50"
      case "error":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4" />
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      case "error":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      default:
        return "text-blue-600"
    }
  }

  useEffect(() => {
    if (authLoading) return

    // Auth is already verified by proxy middleware.
    // Just check role-based access here.
    if (!authProfile) {
      // Profile not loaded yet — wait (don't redirect, proxy already checked auth)
      return
    }

    if (authProfile.role !== "owner" && authProfile.role !== "admin") {
      setHasAccess(false)
      return
    }

    setHasAccess(true)
    addLog("info", "Maintenance dashboard initialized", "System")
    loadLogHistory()
    
    // Check if we should auto-run the system check
    const shouldAutoCheck = () => {
      try {
        const lastCheck = localStorage.getItem('maintenance:lastCheck')
        if (!lastCheck) return true
        
        const lastCheckTime = new Date(lastCheck)
        const now = new Date()
        const hoursSinceLastCheck = (now.getTime() - lastCheckTime.getTime()) / (1000 * 60 * 60)
        
        return hoursSinceLastCheck >= 24
      } catch (error) {
        return true
      }
    }
    
    if (shouldAutoCheck()) {
      runFullSystemCheck()
    } else {
      const lastCheck = localStorage.getItem('maintenance:lastCheck')
      if (lastCheck) {
        const lastCheckTime = new Date(lastCheck)
        setLastFullCheck(lastCheckTime)
        addLog("info", `מערכת נבדקה לאחרונה ב-${lastCheckTime.toLocaleString('he-IL')}`, "System")
      }
    }
  }, [authProfile, authLoading, router])

  const healthyFeatures = features.filter((f) => f.status === "healthy").length
  const warningFeatures = features.filter((f) => f.status === "warning").length
  const errorFeatures = features.filter((f) => f.status === "error").length

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center py-20" dir="rtl">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="font-hebrew text-right">אין לך הרשאות גישה</CardTitle>
            <CardDescription className="font-hebrew text-right">דף התחזוקה זמין למנהלים בלבד</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const mainContent = (
    <>
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(systemHealth.database)}>
                    {getStatusIcon(systemHealth.database)}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium font-hebrew">מסד נתונים</p>
                    <p className="text-xs text-gray-600 font-hebrew">
                      {systemHealth.database === "healthy" ? "פעיל" : "בעיה"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(systemHealth.api)}>{getStatusIcon(systemHealth.api)}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium font-hebrew">API</p>
                    <p className="text-xs text-gray-600 font-hebrew">
                      {systemHealth.api === "healthy" ? "פעיל" : "בעיה"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(systemHealth.auth)}>{getStatusIcon(systemHealth.auth)}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium font-hebrew">אימות</p>
                    <p className="text-xs text-gray-600 font-hebrew">פעיל</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <span className="text-xs text-green-600 font-hebrew">{healthyFeatures}</span>
                    <span className="text-xs text-yellow-600 font-hebrew">{warningFeatures}</span>
                    <span className="text-xs text-red-600 font-hebrew">{errorFeatures}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium font-hebrew">תכונות</p>
                    <p className="text-xs text-gray-600 font-hebrew">{features.length} סה"כ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6" dir="rtl">
            <TabsList className="grid w-full grid-cols-4" dir="rtl">
              <TabsTrigger value="overview" className="font-hebrew">
                סקירה כללית
              </TabsTrigger>
              <TabsTrigger value="features" className="font-hebrew">
                מעקב תכונות
              </TabsTrigger>
              <TabsTrigger value="logs" className="font-hebrew">
                קונסול לוגים
              </TabsTrigger>
              <TabsTrigger value="actions" className="font-hebrew">
                פעולות תחזוקה
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-hebrew flex items-center gap-2">
                      <Zap className="w-5 h-5 text-vazana-teal" />
                      סטטוס מערכת
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <Badge className={getStatusColor(systemHealth.database)}>
                          {getStatusIcon(systemHealth.database)}
                        </Badge>
                        <div className="text-right">
                          <p className="font-medium font-hebrew">חיבור מסד נתונים</p>
                          <p className="text-sm text-gray-600 font-hebrew">Supabase PostgreSQL</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <Badge className={getStatusColor(systemHealth.api)}>{getStatusIcon(systemHealth.api)}</Badge>
                        <div className="text-right">
                          <p className="font-medium font-hebrew">API Endpoints</p>
                          <p className="text-sm text-gray-600 font-hebrew">REST API Services</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-hebrew flex items-center gap-2">
                      <Clock className="w-5 h-5 text-vazana-teal" />
                      בדיקה אחרונה
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-vazana-dark">
                          {lastFullCheck ? lastFullCheck.toLocaleTimeString("he-IL") : "לא בוצעה"}
                        </p>
                        <p className="text-sm text-gray-600 font-hebrew">
                          {lastFullCheck ? lastFullCheck.toLocaleDateString("he-IL") : "בדיקה ראשונה"}
                        </p>
                      </div>

                      <Button
                        onClick={runFullSystemCheck}
                        disabled={isRunningTests}
                        className="w-full bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
                      >
                        {isRunningTests ? (
                          <>
                            <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                            בודק מערכת...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 ml-2" />
                            הרץ בדיקה מלאה
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
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
                      <div className="text-center py-8 text-gray-500 font-hebrew">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-300 mb-4" />
                        <p>אין בעיות מדווחות</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-hebrew flex items-center gap-2">
                    <Activity className="w-5 h-5 text-vazana-teal" />
                    מעקב תכונות מערכת
                  </CardTitle>
                  <CardDescription className="font-hebrew text-right">
                    מעקב בזמן אמת על תפקוד כל התכונות במערכת
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature) => (
                      <Card key={feature.name} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getStatusColor(feature.status)}>{getStatusIcon(feature.status)}</Badge>
                          {feature.icon && <feature.icon className="w-5 h-5 text-vazana-teal" />}
                        </div>
                        <div className="text-right">
                          <h3 className="font-medium font-hebrew">{feature.name}</h3>
                          <p className="text-sm text-gray-600 font-hebrew">{feature.message}</p>
                          <p className="text-xs text-gray-400 font-hebrew mt-1">
                            נבדק: {feature.lastChecked.toLocaleTimeString("he-IL")}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-hebrew flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-vazana-teal" />
                    קונסול לוגים חי
                  </CardTitle>
                  <CardDescription className="font-hebrew text-right">
                    מעקב בזמן אמת על כל הפעילות במערכת
                  </CardDescription>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportLogs} className="font-hebrew bg-transparent">
                      <Download className="w-4 h-4 ml-1" />
                      יצא לוגים
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearLogs} className="font-hebrew bg-transparent">
                      <Trash2 className="w-4 h-4 ml-1" />
                      נקה לוגים
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLogging(!isLogging)}
                      className="font-hebrew"
                    >
                      {isLogging ? (
                        <>
                          <Pause className="w-4 h-4 ml-1" />
                          השהה
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 ml-1" />
                          המשך
                        </>
                      )}
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

            <TabsContent value="actions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-hebrew flex items-center gap-2">
                    <Settings className="w-5 h-5 text-vazana-teal" />
                    פעולות תחזוקה
                  </CardTitle>
                  <CardDescription className="font-hebrew text-right">כלים לתחזוקה ותיקון בעיות במערכת</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="text-right mb-4">
                        <h3 className="font-medium font-hebrew mb-2">בדיקת חיבורי מסד נתונים</h3>
                        <p className="text-sm text-gray-600 font-hebrew">בדוק את החיבור למסד הנתונים ותקינות הטבלאות</p>
                      </div>
                      <div className="space-y-2">
                        <Button
                          onClick={checkDatabaseConnection}
                          className="w-full bg-blue-600 hover:bg-blue-700 font-hebrew"
                        >
                          <Database className="w-4 h-4 ml-2" />
                          בדוק מסד נתונים
                        </Button>
                        <Button
                          onClick={autoFixDatabaseIssues}
                          variant="outline"
                          className="w-full font-hebrew bg-transparent"
                        >
                          <RefreshCw className="w-4 h-4 ml-2" />
                          תקן בעיות מסד נתונים
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-right mb-4">
                        <h3 className="font-medium font-hebrew mb-2">בדיקת API Endpoints</h3>
                        <p className="text-sm text-gray-600 font-hebrew">בדוק את תקינות כל נקודות הקצה של ה-API</p>
                      </div>
                      <div className="space-y-2">
                        <Button
                          onClick={checkAPIEndpoints}
                          className="w-full bg-green-600 hover:bg-green-700 font-hebrew"
                        >
                          <Zap className="w-4 h-4 ml-2" />
                          בדוק API
                        </Button>
                        <Button
                          onClick={fixAPIEndpoints}
                          variant="outline"
                          className="w-full font-hebrew bg-transparent"
                        >
                          <RefreshCw className="w-4 h-4 ml-2" />
                          תקן בעיות API
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-right mb-4">
                        <h3 className="font-medium font-hebrew mb-2">בדיקת שלמות נתונים</h3>
                        <p className="text-sm text-gray-600 font-hebrew">בדוק את שלמות הנתונים בכל הטבלאות</p>
                      </div>
                      <Button
                        onClick={() => checkDataIntegrity().then(setFeatures)}
                        className="w-full bg-purple-600 hover:bg-purple-700 font-hebrew"
                      >
                        <FileText className="w-4 h-4 ml-2" />
                        בדוק שלמות נתונים
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="text-right mb-4">
                        <h3 className="font-medium font-hebrew mb-2">בדיקת מערכת אימות</h3>
                        <p className="text-sm text-gray-600 font-hebrew">בדוק התחברות, פגישות והרשאות משתמש</p>
                      </div>
                      <div className="space-y-2">
                        <Button
                          onClick={async () => {
                            try {
                              await testAuthenticationSystem()
                            } catch (error) {
                              addLog("error", `Test failed: ${error}`, "Authentication")
                            }
                          }}
                          className="w-full bg-orange-600 hover:bg-orange-700 font-hebrew"
                        >
                          <Lock className="w-4 h-4 ml-2" />
                          בדוק מערכת אימות
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              await testUserCreationFlow()
                            } catch (error) {
                              addLog("error", `Test failed: ${error}`, "User Management")
                            }
                          }}
                          variant="outline"
                          className="w-full font-hebrew bg-transparent"
                        >
                          <Users className="w-4 h-4 ml-2" />
                          בדוק ניהול משתמשים
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-right mb-4">
                        <h3 className="font-medium font-hebrew mb-2">בדיקה מלאה</h3>
                        <p className="text-sm text-gray-600 font-hebrew">הרץ בדיקה מקיפה של כל המערכת</p>
                      </div>
                      <Button
                        onClick={runFullSystemCheck}
                        disabled={isRunningTests}
                        className="w-full bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
    </>
  )

  if (embedded) return mainContent

  return (
    <PageLayout
      title="מרכז תחזוקה"
      subtitle="מעקב בזמן אמת על בריאות המערכת ותפקודה"
      titleIcon={Activity}
      backHref="/"
      variant="list"
      maxWidth="7xl"
    >
      {mainContent}
    </PageLayout>
  )
}

export default function MaintenancePage() {
  // Redirect to settings maintenance tab
  const router = useRouter()
  useEffect(() => {
    router.replace('/settings?tab=maintenance')
  }, [router])
  return <div className="flex items-center justify-center py-20 font-hebrew text-gray-500">מעביר להגדרות...</div>
}
