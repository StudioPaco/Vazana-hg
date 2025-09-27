"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import {
  DatabaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  SettingsIcon,
  BugIcon,
  ListIcon,
} from "lucide-react"

interface TableStatus {
  name: string
  count: number
  status: "success" | "warning" | "error"
  lastUpdated?: string
}

interface DebugLog {
  timestamp: string
  level: "info" | "warning" | "error"
  message: string
  details?: any
}

export default function MaintenancePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([])
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const addDebugLog = (level: "info" | "warning" | "error", message: string, details?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleString("he-IL"),
      level,
      message,
      details,
    }
    setDebugLogs((prev) => [log, ...prev].slice(0, 50)) // Keep last 50 logs
    console.log(`[v0] ${level.toUpperCase()}: ${message}`, details || "")
  }

  useEffect(() => {
    const loggedIn = localStorage.getItem("vazana_logged_in")
    if (loggedIn === "true") {
      setIsAuthenticated(true)
      addDebugLog("info", "User authenticated successfully")
    } else {
      addDebugLog("warning", "User not authenticated, redirecting to login")
      router.push("/auth/login")
    }
    setIsLoading(false)
  }, [router])

  const checkDatabaseStatus = async () => {
    setIsRefreshing(true)
    addDebugLog("info", "Starting database status check")

    try {
      const supabase = createClient()
      const tables = [
        "clients",
        "workers",
        "vehicles",
        "carts",
        "work_types",
        "jobs",
        "receipts",
        "business_settings",
        "user_profiles",
        "users",
        "documents",
      ]

      const statuses: TableStatus[] = []

      for (const table of tables) {
        try {
          addDebugLog("info", `Checking table: ${table}`)

          const { data, error, count } = await supabase.from(table).select("*", { count: "exact", head: true })

          if (error) {
            addDebugLog("error", `Error checking table ${table}`, error)
            statuses.push({
              name: table,
              count: 0,
              status: "error",
            })
          } else {
            const recordCount = count || 0
            const status = recordCount === 0 ? "warning" : "success"

            addDebugLog("info", `Table ${table}: ${recordCount} records`, { count: recordCount })

            statuses.push({
              name: table,
              count: recordCount,
              status,
              lastUpdated: new Date().toLocaleString("he-IL"),
            })
          }
        } catch (tableError) {
          addDebugLog("error", `Exception checking table ${table}`, tableError)
          statuses.push({
            name: table,
            count: 0,
            status: "error",
          })
        }
      }

      setTableStatuses(statuses)
      addDebugLog("info", "Database status check completed")
    } catch (error) {
      addDebugLog("error", "Failed to check database status", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const populateSampleData = async () => {
    addDebugLog("info", "Starting sample data population")

    try {
      const supabase = createClient()
      const sampleUserId = "550e8400-e29b-41d4-a716-446655440000"

      // Sample work types
      const workTypes = [
        { name_he: "אבטחה", name_en: "Security", created_by: "system", created_by_id: sampleUserId, is_sample: true },
        {
          name_he: "התקנה",
          name_en: "Installation",
          created_by: "system",
          created_by_id: sampleUserId,
          is_sample: true,
        },
        {
          name_he: "תחזוקה",
          name_en: "Maintenance",
          created_by: "system",
          created_by_id: sampleUserId,
          is_sample: true,
        },
      ]

      const { error: workTypesError } = await supabase.from("work_types").insert(workTypes)
      if (workTypesError) {
        addDebugLog("error", "Failed to insert work types", workTypesError)
      } else {
        addDebugLog("info", "Sample work types inserted successfully")
      }

      // Sample workers
      const workers = [
        {
          name: "יוסי כהן",
          phone_number: "050-1234567",
          shift_rate: 150,
          created_by: "system",
          created_by_id: sampleUserId,
          is_sample: true,
          address: "תל אביב",
          payment_terms_days: 30,
        },
        {
          name: "דני לוי",
          phone_number: "052-9876543",
          shift_rate: 140,
          created_by: "system",
          created_by_id: sampleUserId,
          is_sample: true,
          address: "חיפה",
          payment_terms_days: 30,
        },
      ]

      const { error: workersError } = await supabase.from("workers").insert(workers)
      if (workersError) {
        addDebugLog("error", "Failed to insert workers", workersError)
      } else {
        addDebugLog("info", "Sample workers inserted successfully")
      }

      // Sample vehicles
      const vehicles = [
        {
          license_plate: "123-45-678",
          name: "פורד טרנזיט",
          details: "רכב עבודה ראשי",
          created_by: "system",
          created_by_id: sampleUserId,
          is_sample: true,
        },
        {
          license_plate: "987-65-432",
          name: "איווקו דיילי",
          details: "רכב עבודה משני",
          created_by: "system",
          created_by_id: sampleUserId,
          is_sample: true,
        },
      ]

      const { error: vehiclesError } = await supabase.from("vehicles").insert(vehicles)
      if (vehiclesError) {
        addDebugLog("error", "Failed to insert vehicles", vehiclesError)
      } else {
        addDebugLog("info", "Sample vehicles inserted successfully")
      }

      // Sample carts
      const carts = [
        {
          name: "נגרר כלים",
          details: "נגרר עם כלי עבודה",
          created_by: "system",
          created_by_id: sampleUserId,
          is_sample: true,
        },
      ]

      const { error: cartsError } = await supabase.from("carts").insert(carts)
      if (cartsError) {
        addDebugLog("error", "Failed to insert carts", cartsError)
      } else {
        addDebugLog("info", "Sample carts inserted successfully")
      }

      // Sample clients
      const clients = [
        {
          company_name: 'חברת אבטחה מקצועית בע"מ',
          contact_person: "משה ישראלי",
          phone: "03-1234567",
          email: "moshe@security.co.il",
          address: "רחוב הרצל 123, תל אביב",
          city: "תל אביב",
          security_rate: 180,
          installation_rate: 200,
          payment_method: 1,
          status: "active",
          created_by: "system",
          created_by_id: sampleUserId,
          is_sample: true,
        },
        {
          company_name: "מרכז קניות גדול",
          contact_person: "שרה לוי",
          phone: "04-9876543",
          email: "sara@mall.co.il",
          address: "שדרות בן גוריון 456, חיפה",
          city: "חיפה",
          security_rate: 160,
          installation_rate: 190,
          payment_method: 2,
          status: "active",
          created_by: "system",
          created_by_id: sampleUserId,
          is_sample: true,
        },
      ]

      const { error: clientsError } = await supabase.from("clients").insert(clients)
      if (clientsError) {
        addDebugLog("error", "Failed to insert clients", clientsError)
      } else {
        addDebugLog("info", "Sample clients inserted successfully")
      }

      addDebugLog("info", "Sample data population completed successfully")

      // Refresh the status after populating data
      setTimeout(() => {
        checkDatabaseStatus()
      }, 1000)
    } catch (error) {
      addDebugLog("error", "Failed to populate sample data", error)
    }
  }

  const clearDebugLogs = () => {
    setDebugLogs([])
    addDebugLog("info", "Debug logs cleared")
  }

  useEffect(() => {
    if (isAuthenticated) {
      checkDatabaseStatus()
    }
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-900 text-lg">טוען...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-teal-600" />
            דף תחזוקה ובדיקות
          </h1>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/")} variant="outline" className="bg-white">
              חזור לדף הבית
            </Button>
            <Button onClick={checkDatabaseStatus} disabled={isRefreshing} className="bg-teal-600 hover:bg-teal-700">
              {isRefreshing ? (
                <RefreshCwIcon className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <RefreshCwIcon className="h-4 w-4 ml-2" />
              )}
              רענן סטטוס
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="h-5 w-5 text-blue-600" />
                סטטוס מסד הנתונים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tableStatuses.map((table) => (
                  <div key={table.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {table.status === "success" && <CheckCircleIcon className="h-4 w-4 text-green-600" />}
                      {table.status === "warning" && <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />}
                      {table.status === "error" && <XCircleIcon className="h-4 w-4 text-red-600" />}
                      <span className="font-medium">{table.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          table.status === "success"
                            ? "default"
                            : table.status === "warning"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {table.count} רשומות
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {tableStatuses.some((t) => t.status === "warning") && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm mb-3">
                    נמצאו טבלאות ריקות. זה עלול לגרום לבעיות בתפריטים הנפתחים.
                  </p>
                  <Button onClick={populateSampleData} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                    הוסף נתוני דוגמה
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListIcon className="h-5 w-5 text-purple-600" />
                תכונות המערכת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ניהול עבודות</span>
                  <Badge variant="default">פעיל</Badge>
                </div>
                <div className="flex justify-between">
                  <span>ניהול לקוחות</span>
                  <Badge variant="default">פעיל</Badge>
                </div>
                <div className="flex justify-between">
                  <span>ניהול עובדים</span>
                  <Badge variant="default">פעיל</Badge>
                </div>
                <div className="flex justify-between">
                  <span>ניהול רכבים</span>
                  <Badge variant="default">פעיל</Badge>
                </div>
                <div className="flex justify-between">
                  <span>חשבוניות</span>
                  <Badge variant="secondary">בפיתוח</Badge>
                </div>
                <div className="flex justify-between">
                  <span>סנכרון יומן</span>
                  <Badge variant="secondary">בפיתוח</Badge>
                </div>
                <div className="flex justify-between">
                  <span>דוחות</span>
                  <Badge variant="secondary">בפיתוח</Badge>
                </div>
                <div className="flex justify-between">
                  <span>אימות משתמשים</span>
                  <Badge variant="outline">מקומי</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Console */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BugIcon className="h-5 w-5 text-red-600" />
                קונסולת דיבוג
              </div>
              <Button onClick={clearDebugLogs} size="sm" variant="outline">
                נקה לוגים
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {debugLogs.length === 0 ? (
                <div className="text-gray-500">אין לוגי דיבוג...</div>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-400">[{log.timestamp}]</span>
                    <span
                      className={`ml-2 ${
                        log.level === "error"
                          ? "text-red-400"
                          : log.level === "warning"
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {log.level.toUpperCase()}:
                    </span>
                    <span className="ml-2">{log.message}</span>
                    {log.details && (
                      <div className="text-gray-300 text-xs mt-1 mr-4">{JSON.stringify(log.details, null, 2)}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => router.push("/jobs/new")} className="bg-teal-600 hover:bg-teal-700">
                בדוק טופס עבודה חדשה
              </Button>
              <Button onClick={() => router.push("/clients")} className="bg-blue-600 hover:bg-blue-700">
                בדוק ניהול לקוחות
              </Button>
              <Button onClick={() => window.open("/api/health", "_blank")} variant="outline">
                בדוק API Health
              </Button>
              <Button
                onClick={() => {
                  addDebugLog("info", "Manual test log entry", { test: true, timestamp: Date.now() })
                }}
                variant="outline"
              >
                בדוק לוג דיבוג
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
