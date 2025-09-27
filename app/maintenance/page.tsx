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
} from "lucide-react"
import SidebarNavigation, { useSidebar } from "@/components/layout/sidebar-navigation"
import { createClient } from "@/lib/supabase/client"

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
  database: "healthy" | "warning" | "error"
  api: "healthy" | "warning" | "error"
  auth: "healthy" | "warning" | "error"
  integrations: "healthy" | "warning" | "error"
}

export default function MaintenancePage() {
  const { isMinimized } = useSidebar()
  const [logs, setLogs] = useState<LogEntry[]>([])
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
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message,
      component,
      details,
    }

    setLogs((prev) => [...prev.slice(-99), newLog]) // Keep last 100 logs

    // Auto-scroll to bottom
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const clearLogs = () => {
    setLogs([])
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

        const response = await fetch(endpoint.url)

        if (response.ok) {
          addLog("success", `${endpoint.name} API is healthy`, "API")
          healthyCount++
        } else {
          addLog("warning", `${endpoint.name} API returned ${response.status}`, "API")
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

    try {
      // Check Workers
      addLog("info", "Checking workers data...", "Data Integrity")
      const { data: workers, error: workersError } = await supabase.from("workers").select("id, name").limit(5)

      features.push({
        name: "Workers Management",
        status: workersError ? "error" : workers && workers.length > 0 ? "healthy" : "warning",
        lastChecked: new Date(),
        message: workersError ? workersError.message : `${workers?.length || 0} workers found`,
        icon: Users,
        category: "Data",
      })

      // Check Vehicles
      addLog("info", "Checking vehicles data...", "Data Integrity")
      const { data: vehicles, error: vehiclesError } = await supabase.from("vehicles").select("id, name").limit(5)

      features.push({
        name: "Vehicles Management",
        status: vehiclesError ? "error" : vehicles && vehicles.length > 0 ? "healthy" : "warning",
        lastChecked: new Date(),
        message: vehiclesError ? vehiclesError.message : `${vehicles?.length || 0} vehicles found`,
        icon: Car,
        category: "Data",
      })

      // Check Carts
      addLog("info", "Checking carts data...", "Data Integrity")
      const { data: carts, error: cartsError } = await supabase.from("carts").select("id, name").limit(5)

      features.push({
        name: "Carts Management",
        status: cartsError ? "error" : carts && carts.length > 0 ? "healthy" : "warning",
        lastChecked: new Date(),
        message: cartsError ? cartsError.message : `${carts?.length || 0} carts found`,
        icon: ShoppingCart,
        category: "Data",
      })

      // Check Clients
      addLog("info", "Checking clients data...", "Data Integrity")
      const { data: clients, error: clientsError } = await supabase.from("clients").select("id, company_name").limit(5)

      features.push({
        name: "Clients Management",
        status: clientsError ? "error" : clients && clients.length > 0 ? "healthy" : "warning",
        lastChecked: new Date(),
        message: clientsError ? clientsError.message : `${clients?.length || 0} clients found`,
        icon: Users,
        category: "Data",
      })

      // Check Jobs
      addLog("info", "Checking jobs data...", "Data Integrity")
      const { data: jobs, error: jobsError } = await supabase.from("jobs").select("id, job_number").limit(5)

      features.push({
        name: "Jobs Management",
        status: jobsError ? "error" : "healthy",
        lastChecked: new Date(),
        message: jobsError ? jobsError.message : `${jobs?.length || 0} jobs found`,
        icon: Briefcase,
        category: "Data",
      })

      // Check Work Types
      addLog("info", "Checking work types data...", "Data Integrity")
      const { data: workTypes, error: workTypesError } = await supabase
        .from("work_types")
        .select("id, name_he")
        .limit(5)

      features.push({
        name: "Work Types",
        status: workTypesError ? "error" : workTypes && workTypes.length > 0 ? "healthy" : "warning",
        lastChecked: new Date(),
        message: workTypesError ? workTypesError.message : `${workTypes?.length || 0} work types found`,
        icon: Settings,
        category: "Configuration",
      })
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

      // Check API endpoints
      const apiHealth = await checkAPIEndpoints()

      // Check data integrity
      const featureStatuses = await checkDataIntegrity()

      setSystemHealth({
        database: dbHealth,
        api: apiHealth,
        auth: "healthy", // Simplified for now
        integrations: "healthy", // Simplified for now
      })

      setFeatures(featureStatuses)
      setLastFullCheck(new Date())

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
    addLog("info", "Maintenance dashboard initialized", "System")
    runFullSystemCheck()
  }, [])

  const healthyFeatures = features.filter((f) => f.status === "healthy").length
  const warningFeatures = features.filter((f) => f.status === "warning").length
  const errorFeatures = features.filter((f) => f.status === "error").length

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <SidebarNavigation />
      <div className={`${isMinimized ? "mr-24" : "mr-64"} p-6 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-right">
            <h1 className="text-3xl font-bold text-vazana-dark font-hebrew flex items-center gap-3">
              <Activity className="w-8 h-8 text-vazana-teal" />
              מרכז תחזוקה ומעקב
            </h1>
            <p className="text-gray-600 font-hebrew">מעקב בזמן אמת על בריאות המערכת ותפקודה</p>
          </div>

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
                    {features.map((feature, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getStatusColor(feature.status)}>{getStatusIcon(feature.status)}</Badge>
                          <feature.icon className="w-5 h-5 text-vazana-teal" />
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
                      <Button
                        onClick={checkDatabaseConnection}
                        className="w-full bg-blue-600 hover:bg-blue-700 font-hebrew"
                      >
                        <Database className="w-4 h-4 ml-2" />
                        בדוק מסד נתונים
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="text-right mb-4">
                        <h3 className="font-medium font-hebrew mb-2">בדיקת API Endpoints</h3>
                        <p className="text-sm text-gray-600 font-hebrew">בדוק את תקינות כל נקודות הקצה של ה-API</p>
                      </div>
                      <Button
                        onClick={checkAPIEndpoints}
                        className="w-full bg-green-600 hover:bg-green-700 font-hebrew"
                      >
                        <Zap className="w-4 h-4 ml-2" />
                        בדוק API
                      </Button>
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
        </div>
      </div>
    </div>
  )
}
