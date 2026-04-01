"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  User,
  Truck,
  AlertTriangle,
  Check,
  X,
  ShoppingCart,
  Layers,
  Download,
  Eye,
} from "lucide-react"
import PageLayout from "@/components/layout/page-layout"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface Job {
  id: string
  job_number: string
  client_name: string
  job_date: string
  work_type: string
  shift_type: string
  site: string
  city: string
  worker_name: string
  vehicle_name: string
  cart_name: string
  total_amount: number
  notes: string
}

interface Worker { id: string; name: string }
interface Vehicle { id: string; name: string; license_plate?: string }
interface CartItem { id: string; name: string }

interface Availability {
  id: string
  resource_type: string
  resource_id: string
  date: string
  is_available: boolean
  reason?: string
}

type ResourceType = "workers" | "vehicles" | "carts" | "cross"
type ViewScope = "week" | "month"

export default function CalendarPage() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [carts, setCarts] = useState<CartItem[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const initialType = (searchParams.get('type') as ResourceType) || "workers"
  const [resourceType, setResourceType] = useState<ResourceType>(initialType)
  const [viewScope, setViewScope] = useState<ViewScope>("week")
  const [weekOffset, setWeekOffset] = useState(0)
  const [showClashesOnly, setShowClashesOnly] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const supabase = createClient()

  const fetchAvailability = useCallback(async () => {
    const { data } = await supabase
      .from("resource_availability")
      .select("*")
      .order("date")
    setAvailability(data || [])
  }, [])

  useEffect(() => {
    Promise.all([
      fetch("/api/jobs").then(r => r.json()),
      fetch("/api/workers").then(r => r.json()),
      fetch("/api/vehicles").then(r => r.json()),
      supabase.from("carts").select("*").order("name"),
      fetchAvailability(),
    ]).then(([jobsRes, workersRes, vehiclesRes, cartsRes]) => {
      setJobs(jobsRes.data || [])
      setWorkers(workersRes.data || workersRes || [])
      setVehicles(vehiclesRes.data || vehiclesRes || [])
      setCarts(cartsRes.data || [])
    }).catch(err => {
      console.error("Failed to load calendar data:", err)
    }).finally(() => setLoading(false))
  }, [])

  // Calculate dates based on scope
  const dates = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7))
    const numDays = 7
    return Array.from({ length: numDays }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return d
    })
  }, [weekOffset, viewScope])

  // Month calendar grid: 6 weeks x 7 days
  const monthGrid = useMemo(() => {
    const today = new Date()
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + weekOffset, 1)
    const firstDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay()) // back to Sunday

    const weeks: Date[][] = []
    const current = new Date(startDate)
    for (let w = 0; w < 6; w++) {
      const week: Date[] = []
      for (let d = 0; d < 7; d++) {
        week.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
      weeks.push(week)
    }
    return { weeks, month: targetMonth.getMonth(), year: targetMonth.getFullYear() }
  }, [weekOffset])

  const dayNames = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]
  const dayNamesFull = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]

  // Build lookup: dateStr -> resourceName -> jobs[] for a given resource type
  // Jobs by date for month calendar view
  const jobsByDate = useMemo(() => {
    const map: Record<string, Job[]> = {}
    for (const job of jobs) {
      const dateStr = job.job_date?.split("T")[0]
      if (!dateStr) continue
      if (!map[dateStr]) map[dateStr] = []
      map[dateStr].push(job)
    }
    return map
  }, [jobs])

  const buildJobMap = useCallback((type: "workers" | "vehicles" | "carts") => {
    const map: Record<string, Record<string, Job[]>> = {}
    for (const job of jobs) {
      const dateStr = job.job_date?.split("T")[0]
      if (!dateStr) continue
      if (!map[dateStr]) map[dateStr] = {}
      const name = type === "workers" ? job.worker_name : type === "vehicles" ? job.vehicle_name : job.cart_name
      if (!name) continue
      if (!map[dateStr][name]) map[dateStr][name] = []
      map[dateStr][name].push(job)
    }
    return map
  }, [jobs])

  const jobsByDateResource = useMemo(() => buildJobMap(resourceType === "cross" ? "workers" : resourceType), [buildJobMap, resourceType])
  const jobsByDateVehicle = useMemo(() => resourceType === "cross" ? buildJobMap("vehicles") : {}, [buildJobMap, resourceType])
  const jobsByDateCart = useMemo(() => resourceType === "cross" ? buildJobMap("carts") : {}, [buildJobMap, resourceType])

  const availabilityMap = useMemo(() => {
    const map: Record<string, Availability> = {}
    for (const a of availability) map[`${a.resource_id}_${a.date}`] = a
    return map
  }, [availability])

  // Resources list
  const resources = useMemo(() => {
    if (resourceType === "cross") {
      return [
        ...workers.map(w => ({ id: w.id, name: w.name, type: "worker" as const })),
        ...vehicles.map(v => ({ id: v.id, name: v.name, type: "vehicle" as const })),
        ...carts.map(c => ({ id: c.id, name: c.name, type: "cart" as const })),
      ]
    }
    if (resourceType === "workers") return workers.map(w => ({ id: w.id, name: w.name, type: "worker" as const }))
    if (resourceType === "vehicles") return vehicles.map(v => ({ id: v.id, name: v.name, type: "vehicle" as const }))
    return carts.map(c => ({ id: c.id, name: c.name, type: "cart" as const }))
  }, [resourceType, workers, vehicles, carts])

  // Detect clashes
  const clashes = useMemo(() => {
    const clashSet = new Set<string>()
    const allMaps = resourceType === "cross"
      ? [buildJobMap("workers"), buildJobMap("vehicles"), buildJobMap("carts")]
      : [jobsByDateResource]
    for (const map of allMaps) {
      for (const [dateStr, byResource] of Object.entries(map)) {
        for (const [name, jobList] of Object.entries(byResource)) {
          if (jobList.length > 1) clashSet.add(`${name}_${dateStr}`)
        }
      }
    }
    return clashSet
  }, [jobsByDateResource, buildJobMap, resourceType])

  const clashCount = clashes.size

  const [togglingCells, setTogglingCells] = useState<Set<string>>(new Set())

  const toggleAvailability = async (resourceId: string, dateStr: string, resType: string) => {
    const key = `${resourceId}_${dateStr}`
    setTogglingCells(prev => new Set(prev).add(key))
    try {
      const existing = availabilityMap[key]
      if (existing) {
        if (!existing.is_available) {
          const { error } = await supabase.from("resource_availability").delete().eq("id", existing.id)
          if (error) throw error
        } else {
          const { error } = await supabase.from("resource_availability").update({ is_available: false }).eq("id", existing.id)
          if (error) throw error
        }
      } else {
        const { error } = await supabase.from("resource_availability").insert({
          resource_type: resType,
          resource_id: resourceId,
          date: dateStr,
          is_available: false,
          reason: "סומן ידנית",
        })
        if (error) throw error
      }
      await fetchAvailability()
    } catch (err) {
      console.error("Failed to toggle availability:", err)
      toast({ title: "שגיאה בעדכון זמינות", variant: "destructive" })
    } finally {
      setTogglingCells(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const getJobsForCell = (resourceName: string, resourceTypeStr: string, dateStr: string): Job[] => {
    if (resourceType === "cross") {
      const map = resourceTypeStr === "worker" ? buildJobMap("workers") : resourceTypeStr === "vehicle" ? buildJobMap("vehicles") : buildJobMap("carts")
      return map[dateStr]?.[resourceName] || []
    }
    return jobsByDateResource[dateStr]?.[resourceName] || []
  }

  // Export schedule as printable page
  const handleExport = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const headerCells = dates.map(d =>
      `<th style="border:1px solid #ccc;padding:4px;text-align:center;font-size:11px;background:#f5f5f5;">${dayNames[d.getDay()]}<br>${d.getDate()}/${d.getMonth()+1}</th>`
    ).join('')
    const bodyRows = resources.map(r => {
      const cells = dates.map(d => {
        const dateStr = d.toISOString().split("T")[0]
        const cellJobs = getJobsForCell(r.name, r.type, dateStr)
        return `<td style="border:1px solid #ccc;padding:2px;font-size:10px;vertical-align:top;">${
          cellJobs.map(j => `<div style="background:#fef3c7;border-radius:3px;padding:1px 3px;margin:1px 0;">${j.client_name}</div>`).join('')
        }</td>`
      }).join('')
      const typeIcon = r.type === "worker" ? "👷" : r.type === "vehicle" ? "🚛" : "🛒"
      return `<tr><td style="border:1px solid #ccc;padding:4px;font-weight:bold;font-size:11px;white-space:nowrap;">${typeIcon} ${r.name}</td>${cells}</tr>`
    }).join('')

    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8">
      <title>לוח זמנים</title>
      <style>body{font-family:Arial;padding:10px;direction:rtl}table{width:100%;border-collapse:collapse}h2{text-align:center}</style>
    </head><body><h2>וזאנה — לוח זמנים</h2>
      <table><thead><tr><th style="border:1px solid #ccc;padding:4px;background:#f5f5f5;">משאב</th>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody></table></body></html>`)
    w.document.close()
    w.print()
  }

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString()
  const formatDate = (d: Date) => d.toLocaleDateString("he-IL", { day: "numeric", month: "short" })

  const getShiftColor = (shiftType: string) => {
    if (shiftType === "יום" || shiftType === "day") return "bg-amber-100 text-amber-800 border-amber-300"
    if (shiftType === "לילה" || shiftType === "night") return "bg-indigo-100 text-indigo-800 border-indigo-300"
    return "bg-purple-100 text-purple-800 border-purple-300"
  }

  const getTypeIcon = (type: string) => {
    if (type === "worker") return <User className="w-3 h-3 inline" />
    if (type === "vehicle") return <Truck className="w-3 h-3 inline" />
    return <ShoppingCart className="w-3 h-3 inline" />
  }

  const filteredResources = showClashesOnly
    ? resources.filter(r => dates.some(d => clashes.has(`${r.name}_${d.toISOString().split("T")[0]}`)))
    : resources

  // Capacity stats
  const totalSlots = resources.length * dates.length
  const busySlots = useMemo(() => {
    let count = 0
    for (const r of resources) {
      for (const d of dates) {
        const dateStr = d.toISOString().split("T")[0]
        if (getJobsForCell(r.name, r.type, dateStr).length > 0) count++
      }
    }
    return count
  }, [resources, dates, jobs])
  const capacityPct = totalSlots > 0 ? Math.round((busySlots / totalSlots) * 100) : 0

  // Enhanced stats: jobs this week, jobs this month, top worker
  const weekJobCount = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    const startStr = startOfWeek.toISOString().split("T")[0]
    const endStr = endOfWeek.toISOString().split("T")[0]
    return jobs.filter(j => {
      const d = j.job_date?.split("T")[0]
      return d && d >= startStr && d <= endStr
    }).length
  }, [jobs])

  const monthJobCount = useMemo(() => {
    const today = new Date()
    const startStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const endStr = lastDay.toISOString().split("T")[0]
    return jobs.filter(j => {
      const d = j.job_date?.split("T")[0]
      return d && d >= startStr && d <= endStr
    }).length
  }, [jobs])

  const topWorker = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const j of jobs) {
      if (j.worker_name) {
        counts[j.worker_name] = (counts[j.worker_name] || 0) + 1
      }
    }
    let best = ""
    let max = 0
    for (const [name, count] of Object.entries(counts)) {
      if (count > max) { max = count; best = name }
    }
    return best ? { name: best, count: max } : null
  }, [jobs])

  if (loading) {
    return (
      <PageLayout title="לוח זמנים" subtitle="זמינות משאבים ועבודות" titleIcon={CalendarIcon} variant="list" maxWidth="7xl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="לוח זמנים" subtitle="זמינות משאבים ועבודות" titleIcon={CalendarIcon} variant="list" maxWidth="7xl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-3" dir="rtl">
        <Card><CardContent className="px-3 py-2 flex items-center justify-between">
          <span className="text-lg font-bold text-vazana-dark">{resources.length}</span>
          <span className="text-xs text-gray-500 font-hebrew">משאבים</span>
        </CardContent></Card>
        <Card><CardContent className="px-3 py-2 flex items-center justify-between">
          <span className="text-lg font-bold text-teal-600">{busySlots}</span>
          <span className="text-xs text-gray-500 font-hebrew">תפוסות</span>
        </CardContent></Card>
        <Card><CardContent className="px-3 py-2 flex items-center justify-between">
          <span className={`text-lg font-bold ${capacityPct > 80 ? 'text-red-500' : capacityPct > 50 ? 'text-amber-500' : 'text-green-500'}`}>{capacityPct}%</span>
          <span className="text-xs text-gray-500 font-hebrew">תפוסה</span>
        </CardContent></Card>
        <Card><CardContent className="px-3 py-2 flex items-center justify-between">
          <span className={`text-lg font-bold ${clashCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{clashCount}</span>
          <span className="text-xs text-gray-500 font-hebrew">התנגשויות</span>
        </CardContent></Card>
        <Card><CardContent className="px-3 py-2 flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">{weekJobCount}</span>
          <span className="text-xs text-gray-500 font-hebrew">הזמנות השבוע</span>
        </CardContent></Card>
        <Card><CardContent className="px-3 py-2 flex items-center justify-between">
          <span className="text-lg font-bold text-indigo-600">{monthJobCount}</span>
          <span className="text-xs text-gray-500 font-hebrew">הזמנות החודש</span>
        </CardContent></Card>
        {topWorker && (
          <Card><CardContent className="px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-bold text-amber-600 truncate max-w-[80px]" title={topWorker.name}>{topWorker.name}</span>
            <span className="text-xs text-gray-500 font-hebrew">עובד מוביל ({topWorker.count})</span>
          </CardContent></Card>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-3" dir="rtl">
        {/* Right side: resource filter + clash + export */}
        <div className="flex items-center gap-2 shrink-0">
          <Select value={resourceType} onValueChange={(v) => setResourceType(v as ResourceType)} dir="rtl">
            <SelectTrigger className="w-[130px] font-hebrew text-right h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="workers"><span className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> עובדים</span></SelectItem>
              <SelectItem value="vehicles"><span className="flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> רכבים</span></SelectItem>
              <SelectItem value="carts"><span className="flex items-center gap-2"><ShoppingCart className="w-3.5 h-3.5" /> עגלות</span></SelectItem>
              <SelectItem value="cross"><span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> כל המשאבים</span></SelectItem>
            </SelectContent>
          </Select>

          {clashCount > 0 && (
            <Button
              variant={showClashesOnly ? "default" : "outline"} size="sm"
              onClick={() => {
                const newVal = !showClashesOnly
                setShowClashesOnly(newVal)
                if (newVal && clashes.size > 0) {
                  const firstClash = Array.from(clashes)[0]
                  const clashDate = firstClash.split('_').pop()
                  if (clashDate) {
                    const d = new Date(clashDate)
                    const today = new Date()
                    const diffDays = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    setWeekOffset(Math.floor((diffDays + today.getDay()) / 7))
                  }
                }
              }}
              className={`h-8 text-xs font-hebrew gap-1 ${showClashesOnly ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-red-600 border-red-300'}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {clashCount}
            </Button>
          )}

          <Button variant="outline" size="sm" className="h-8 text-xs font-hebrew" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 ml-1" />
            ייצוא
          </Button>
        </div>

        {/* Center: scope toggle + navigation + date */}
        <div className="flex items-center gap-2 mx-auto">
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {([["week", "שבוע"], ["month", "חודש"]] as const).map(([val, label]) => (
              <Button key={val} variant="ghost" size="sm"
                onClick={() => setViewScope(val)}
                className={`font-hebrew text-xs px-2 py-1 h-7 ${viewScope === val ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'}`}
              >{label}</Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 font-hebrew text-xs min-w-[40px]" onClick={() => setWeekOffset(0)}>היום</Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-hebrew text-gray-600 min-w-[120px] mr-4">
            {viewScope === 'month'
              ? new Date(monthGrid.year, monthGrid.month).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
              : `${formatDate(dates[0])} — ${formatDate(dates[dates.length - 1])}`
            }
          </span>
        </div>
      </div>

      {/* Month Calendar View */}
      {viewScope === 'month' && (
        <div className="border rounded-lg bg-white min-h-[calc(100vh-380px)]">
          <div className="text-center py-2 border-b bg-gray-50 font-hebrew font-semibold text-gray-700">
            {new Date(monthGrid.year, monthGrid.month).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
          </div>
          <div className="grid grid-cols-7" dir="rtl">
            {/* Day headers */}
            {dayNamesFull.map(day => (
              <div key={day} className="text-center py-2 text-xs font-medium text-gray-500 font-hebrew border-b bg-gray-50">
                {day}
              </div>
            ))}
            {/* Calendar cells */}
            {monthGrid.weeks.flatMap((week, wi) =>
              week.map((date, di) => {
                const dateStr = date.toISOString().split("T")[0]
                const dayJobs = jobsByDate[dateStr] || []
                const isCurrentMonth = date.getMonth() === monthGrid.month
                const isTodayDate = date.toDateString() === new Date().toDateString()
                const isSabbath = date.getDay() === 6
                // Detect clashes: same worker or vehicle on same day
                const dayHasClash = dayJobs.length > 1 && (
                  new Set(dayJobs.map(j => j.worker_name).filter(Boolean)).size < dayJobs.filter(j => j.worker_name).length ||
                  new Set(dayJobs.map(j => j.vehicle_name).filter(Boolean)).size < dayJobs.filter(j => j.vehicle_name).length
                )
                // When showClashesOnly, skip non-clash days
                if (showClashesOnly && isCurrentMonth && !dayHasClash && dayJobs.length > 0) {
                  // Dim non-clash days
                }

                return (
                  <div
                    key={`${wi}-${di}`}
                    className={`border-b border-l min-h-[90px] p-1 ${
                      dayHasClash && isCurrentMonth ? 'bg-red-50' :
                      !isCurrentMonth ? 'bg-gray-50/50 text-gray-300' :
                      showClashesOnly && !dayHasClash ? 'bg-gray-50/30 opacity-40' :
                      isTodayDate ? 'bg-teal-50' :
                      isSabbath ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-0.5 ${isTodayDate ? 'text-teal-700 font-bold' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                      {date.getDate()}
                    </div>
                    {isCurrentMonth && dayJobs.length > 0 && (
                      <div className="space-y-0.5">
                        {dayJobs.slice(0, 3).map(job => (
                          <div
                            key={job.id}
                            className={`rounded px-1 py-0.5 text-[9px] border cursor-pointer hover:ring-1 hover:ring-teal-400 ${getShiftColor(job.shift_type)}`}
                            onClick={() => setSelectedJob(job)}
                            title={`#${job.job_number} — ${job.client_name}\n${job.worker_name || ''} · ${job.site}`}
                          >
                            <div className="font-medium truncate">{job.client_name}</div>
                            <div className="opacity-75 truncate">{job.worker_name || job.site}</div>
                          </div>
                        ))}
                        {dayJobs.length > 3 && (
                          <div className="text-[9px] text-gray-400 text-center">+{dayJobs.length - 3} עוד</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Resource Matrix (today/week view) */}
      {viewScope !== 'month' && (
      <div className="border rounded-lg overflow-x-auto bg-white min-h-[calc(100vh-380px)]">
        <table className="w-full text-sm h-full" dir="rtl" style={{ minHeight: 'calc(100vh - 300px)' }}>
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2 text-right font-medium text-gray-600 font-hebrew sticky right-0 bg-gray-50 min-w-[100px] border-l z-10">
                משאב
              </th>
              {dates.map((date, i) => (
                <th key={i} className={`px-1 py-2 text-center font-medium font-hebrew min-w-[100px] ${
                  isToday(date) ? "bg-teal-50 text-teal-700" : date.getDay() === 6 ? "bg-gray-100 text-gray-500" : "text-gray-600"
                }`}>
                  <div className="text-[10px]">{dayNames[date.getDay()]}</div>
                  <div className={`text-xs ${isToday(date) ? "font-bold" : ""}`}>
                    {date.getDate()}/{date.getMonth()+1}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan={dates.length + 1} className="text-center py-8 text-gray-500 font-hebrew">
                  {showClashesOnly ? "אין התנגשויות" : "אין משאבים במערכת"}
                </td>
              </tr>
            ) : (
              filteredResources.map((resource) => (
                <tr key={`${resource.type}-${resource.id}`} className="hover:bg-gray-50/50">
                  <td className="px-2 py-1 font-medium font-hebrew text-right sticky right-0 bg-white border-l text-xs z-10 whitespace-nowrap">
                    <span className="ml-1 text-gray-400">{getTypeIcon(resource.type)}</span>
                    {resource.name}
                  </td>
                  {dates.map((date, i) => {
                    const dateStr = date.toISOString().split("T")[0]
                    const cellJobs = getJobsForCell(resource.name, resource.type, dateStr)
                    const hasClash = cellJobs.length > 1
                    const avail = availabilityMap[`${resource.id}_${dateStr}`]
                    const isUnavailable = avail && !avail.is_available
                    const isSabbath = date.getDay() === 6

                    return (
                      <td key={i}
                        className={`px-0.5 py-0.5 align-top relative transition-colors ${
                          hasClash ? "bg-red-50" : isUnavailable ? "bg-gray-200" : isToday(date) ? "bg-teal-50/30" : isSabbath ? "bg-gray-50" : ""
                        }`}
                      >
                        {/* Click area for availability toggle */}
                        <div
                          className={`min-h-[32px] cursor-pointer ${togglingCells.has(`${resource.id}_${dateStr}`) ? 'opacity-50 pointer-events-none' : ''}`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('[data-job]')) return
                            toggleAvailability(resource.id, dateStr, resource.type)
                          }}
                        >
                          {togglingCells.has(`${resource.id}_${dateStr}`) && (
                            <div className="flex items-center justify-center h-8">
                              <div className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          {!togglingCells.has(`${resource.id}_${dateStr}`) && isUnavailable && cellJobs.length === 0 && (
                            <div className="flex items-center justify-center h-8">
                              <X className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                          )}
                          {hasClash && (
                            <div className="absolute top-0 left-0 z-10">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                            </div>
                          )}
                          {cellJobs.length > 0 && (
                            <div className="space-y-0.5">
                              {cellJobs.map((job) => (
                                <div key={job.id} data-job
                                  className={`rounded px-1 py-0.5 text-[10px] border cursor-pointer hover:ring-2 hover:ring-teal-400 ${getShiftColor(job.shift_type)} ${hasClash ? 'ring-1 ring-red-400' : ''}`}
                                  onClick={() => setSelectedJob(job)}
                                >
                                  <div className="font-medium truncate">{job.client_name}</div>
                                  <div className="opacity-75 truncate">{job.site}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {cellJobs.length === 0 && !isUnavailable && !togglingCells.has(`${resource.id}_${dateStr}`) && (
                            <div className="flex items-center justify-center h-8">
                              <Check className="w-3 h-3 text-green-300" />
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-3 justify-center text-[10px]" dir="rtl">
        {[
          ["bg-amber-100 border-amber-300", "יום"],
          ["bg-indigo-100 border-indigo-300", "לילה"],
          ["bg-purple-100 border-purple-300", "כפול"],
        ].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-4 h-3 rounded border ${cls}`}></div>
            <span className="font-hebrew text-gray-600">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-400" /><span className="font-hebrew text-gray-600">זמין</span></div>
        <div className="flex items-center gap-1"><X className="w-3.5 h-3.5 text-gray-400" /><span className="font-hebrew text-gray-600">לא זמין</span></div>
        <div className="flex items-center gap-1"><div className="w-4 h-3 rounded bg-red-50 border border-red-300"></div><span className="font-hebrew text-gray-600">התנגשות</span></div>
        <span className="font-hebrew text-gray-400">לחץ תא = שנה זמינות | לחץ עבודה = פרטים</span>
      </div>

      {/* Job Details Popup */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-hebrew">עבודה #{selectedJob?.job_number}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-3 text-sm font-hebrew">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">לקוח:</span> <span className="font-medium">{selectedJob.client_name}</span></div>
                <div><span className="text-gray-500">תאריך:</span> <span className="font-medium">{new Date(selectedJob.job_date).toLocaleDateString('he-IL')}</span></div>
                <div><span className="text-gray-500">סוג:</span> <span className="font-medium">{selectedJob.work_type}</span></div>
                <div><span className="text-gray-500">משמרת:</span> <Badge className={`${getShiftColor(selectedJob.shift_type)} text-xs`}>{selectedJob.shift_type}</Badge></div>
                <div><span className="text-gray-500">אתר:</span> <span className="font-medium">{selectedJob.site}</span></div>
                <div><span className="text-gray-500">עיר:</span> <span className="font-medium">{selectedJob.city}</span></div>
                <div><span className="text-gray-500">עובד:</span> <span className="font-medium">{selectedJob.worker_name || '—'}</span></div>
                <div><span className="text-gray-500">רכב:</span> <span className="font-medium">{selectedJob.vehicle_name || '—'}</span></div>
              </div>
              {selectedJob.notes && (
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">הערות:</span> {selectedJob.notes}
                </div>
              )}
              <div className="text-left font-bold text-lg">₪{(selectedJob.total_amount || 0).toLocaleString()}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
