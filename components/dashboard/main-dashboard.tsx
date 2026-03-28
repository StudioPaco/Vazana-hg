"use client"

import { useState, useEffect } from "react"
import {
  DollarSign, Briefcase, Users, CheckCircle, TrendingUp, Calendar, Bell, Plus, FileText,
  Clock, AlertTriangle, MapPin, Truck, UserCheck, Target, BarChart3, ArrowUpLeft
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsContainer } from "@/components/ui/stats-container"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "בוקר טוב"
  if (hour >= 12 && hour < 17) return "צהריים טובים"
  if (hour >= 17 && hour < 22) return "ערב טוב"
  return "לילה טוב"
}

function getHebrewDate(): string {
  return new Date().toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `₪${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₪${Math.round(value).toLocaleString()}`
  return `₪${value}`
}

const jobStatusColors: Record<string, string> = {
  "ממתין": "bg-blue-100 text-blue-800",
  "בתהליך": "bg-amber-100 text-amber-800",
  "הושלם": "bg-green-100 text-green-800",
  "דחוף": "bg-red-100 text-red-800",
}

const paymentStatusColors: Record<string, string> = {
  "ממתין לתשלום": "bg-yellow-100 text-yellow-800",
  "שולם": "bg-green-100 text-green-800",
  "מאוחר": "bg-red-100 text-red-800",
}

const statusBarColors: Record<string, string> = {
  "ממתין": "bg-blue-400",
  "בתהליך": "bg-amber-400",
  "הושלם": "bg-green-500",
  "דחוף": "bg-red-500",
}

/* ── Stat Card (Play pattern) ─────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  color: string
  href?: string
}) {
  const inner = (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <div className={`absolute inset-y-0 end-0 w-1 ${color}`} />
      <CardContent className="flex items-center gap-4 p-4 pe-5">
        <div className="min-w-0 flex-1 text-right">
          <p className="text-sm text-gray-500 font-hebrew">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 font-hebrew">{subtitle}</p>}
        </div>
        <div className="shrink-0 rounded-lg bg-gray-100 p-2.5">{icon}</div>
        {href && (
          <ArrowUpLeft className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 absolute top-2 start-2" />
        )}
      </CardContent>
    </Card>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

/* ── Pipeline Bar ─────────────────────────────────────────────────────────── */

function PipelineBar({ stages }: { stages: { status: string; count: number }[] }) {
  const total = stages.reduce((sum, s) => sum + s.count, 0)
  if (total === 0) return <p className="text-sm text-gray-400 font-hebrew">אין נתונים</p>

  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
        {stages.map((s) => (
          <div
            key={s.status}
            className={`${statusBarColors[s.status] ?? "bg-gray-300"} transition-all`}
            style={{ width: `${(s.count / total) * 100}%` }}
            title={`${s.status}: ${s.count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {stages.map((s) => (
          <div key={s.status} className="flex items-center gap-1.5 text-xs font-hebrew">
            <div className={`h-2.5 w-2.5 rounded-full ${statusBarColors[s.status] ?? "bg-gray-300"}`} />
            <span className="text-gray-500">{s.status} ({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Dashboard Stats Interface ────────────────────────────────────────────── */

interface DashboardStats {
  activeJobs: number
  completedJobs: number
  pendingJobs: number
  overduePayments: number
  totalRevenue: number
  totalClients: number
  activeClients: number
  totalWorkers: number
  totalVehicles: number
  pendingInvoices: number
  jobsByStatus: { status: string; count: number }[]
  upcomingJobs: any[]
  recentInvoices: any[]
  recentCompletedJobs: any[]
}

/* ── Main Dashboard ───────────────────────────────────────────────────────── */

export default function MainDashboard({ showHeader = true }: { showHeader?: boolean }) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [approachingJobsCount, setApproachingJobsCount] = useState(5)
  const supabase = createClient()

  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    overduePayments: 0,
    totalRevenue: 0,
    totalClients: 0,
    activeClients: 0,
    totalWorkers: 0,
    totalVehicles: 0,
    pendingInvoices: 0,
    jobsByStatus: [],
    upcomingJobs: [],
    recentInvoices: [],
    recentCompletedJobs: [],
  })

  // Parallel data fetch (Play pattern)
  useEffect(() => {
    async function loadDashboard() {
      try {
        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

        const [
          jobsRes,
          clientsRes,
          workersRes,
          vehiclesRes,
          invoicesRes,
          upcomingRes,
          completedRes,
        ] = await Promise.all([
          supabase.from("jobs").select("id, job_status, payment_status, total_amount, job_date"),
          (supabase.from("clients") as any).select("id", { count: "exact", head: true }),
          (supabase.from("workers") as any).select("id", { count: "exact", head: true }),
          (supabase.from("vehicles") as any).select("id", { count: "exact", head: true }),
          supabase.from("invoices").select("id, status, total_amount, invoice_date, invoice_number, clients(company_name)"),
          supabase
            .from("jobs")
            .select("id, job_date, site, city, job_status, client_name, shift_type, work_type")
            .gte("job_date", today.toISOString().split("T")[0])
            .lte("job_date", nextWeek.toISOString().split("T")[0])
            .in("job_status", ["ממתין", "בתהליך"])
            .order("job_date", { ascending: true })
            .limit(10),
          // Recent completed jobs
          supabase
            .from("jobs")
            .select("id, job_date, site, city, client_name, work_type, total_amount")
            .eq("job_status", "הושלם")
            .order("job_date", { ascending: false })
            .limit(5),
        ])

        const jobs = jobsRes.data ?? []
        const invoices = invoicesRes.data ?? []

        // Aggregate job statuses
        const statusMap = new Map<string, number>()
        let activeJobs = 0, completedJobs = 0, pendingJobs = 0, totalRevenue = 0, overduePayments = 0

        for (const j of jobs) {
          const status = j.job_status || "ממתין"
          statusMap.set(status, (statusMap.get(status) ?? 0) + 1)
          if (status === "בתהליך") activeJobs++
          if (status === "הושלם") completedJobs++
          if (status === "ממתין") pendingJobs++
          totalRevenue += j.total_amount || 0
          if (j.payment_status === "מאוחר") overduePayments++
        }

        const pendingInvoices = invoices.filter((i: any) => i.status === "sent" || i.status === "draft").length

        // Process upcoming jobs
        const processedUpcoming = (upcomingRes.data ?? []).map((job: any) => {
          const jobDate = new Date(job.job_date)
          const diffDays = Math.ceil((jobDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          const location = [job.site, job.city].filter(Boolean).join(", ") || "מיקום לא צוין"
          return {
            ...job,
            location,
            date: jobDate.toLocaleDateString("he-IL"),
            daysUntil: diffDays === 0 ? "היום" : diffDays === 1 ? "מחר" : `בעוד ${diffDays} ימים`,
            isToday: diffDays === 0,
            isTomorrow: diffDays === 1,
          }
        })

        setStats({
          activeJobs,
          completedJobs,
          pendingJobs,
          overduePayments,
          totalRevenue,
          totalClients: clientsRes.count ?? 0,
          activeClients: clientsRes.count ?? 0,
          totalWorkers: workersRes.count ?? 0,
          totalVehicles: vehiclesRes.count ?? 0,
          pendingInvoices,
          jobsByStatus: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
          upcomingJobs: processedUpcoming,
          recentInvoices: invoices.slice(0, 5),
          recentCompletedJobs: (completedRes.data ?? []).map((j: any) => ({
            ...j,
            location: [j.site, j.city].filter(Boolean).join(", ") || "מיקום לא צוין",
            date: new Date(j.job_date).toLocaleDateString("he-IL"),
          })),
        })
      } catch (error) {
        console.error("Dashboard load error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()

    // Load preference
    const saved = localStorage.getItem("approachingJobsCount")
    if (saved) setApproachingJobsCount(Number(saved))
  }, [])

  const [statsExpanded, setStatsExpanded] = useState(false)

  const quickActions = [
    { name: "עבודה חדשה", href: "/jobs/new", icon: Plus, color: "bg-teal-600 hover:bg-teal-700 text-white" },
    { name: "הפקת חשבונית", href: "/invoices/new", icon: FileText, color: "bg-amber-500 hover:bg-amber-600 text-white" },
    { name: "לקוח חדש", href: "/clients", icon: Users, color: "bg-blue-500 hover:bg-blue-600 text-white" },
  ]

  const userName = profile?.full_name || profile?.username || ""

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Greeting Banner ──────────────────────────────────────── */}
      <div className="space-y-1" suppressHydrationWarning>
        <h2 className="text-2xl font-medium tracking-tight font-hebrew" suppressHydrationWarning>
          {getGreeting()}{userName ? `, ${userName}` : ""}
        </h2>
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-500 font-hebrew" suppressHydrationWarning>
          <span suppressHydrationWarning>{getHebrewDate()}</span>
          {!loading && (
            <>
              <span className="hidden sm:inline">—</span>
              <span className="hidden sm:inline">
                {[
                  stats.activeJobs > 0 ? `${stats.activeJobs} עבודות פעילות` : null,
                  stats.pendingJobs > 0 ? `${stats.pendingJobs} ממתינות` : null,
                  stats.overduePayments > 0 ? `${stats.overduePayments} תשלומים באיחור` : null,
                ].filter(Boolean).join(" · ")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Quick Actions + Stats Toggle ─────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStatsExpanded(!statsExpanded)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-hebrew transition-colors border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400"
        >
          <BarChart3 className="w-4 h-4" />
          <span>{statsExpanded ? "הסתר" : "סטטיסטיקות"}</span>
        </button>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <button
                className={`${action.color} flex items-center gap-2 rounded-lg border border-transparent px-5 py-2.5 text-sm font-medium font-hebrew transition-colors`}
              >
                <action.icon className="w-4 h-4" />
                <span>{action.name}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stat Cards (summary row, always visible) ────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Briefcase className="h-5 w-5 text-blue-600" />}
          label="עבודות פעילות"
          value={stats.activeJobs}
          subtitle={`${stats.completedJobs} הושלמו החודש`}
          color="bg-blue-500"
          href="/jobs"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          label="הכנסות"
          value={formatCurrency(stats.totalRevenue)}
          subtitle={stats.overduePayments > 0 ? `${stats.overduePayments} תשלומים באיחור` : "כל התשלומים בזמן"}
          color="bg-green-500"
          href="/invoices"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-amber-600" />}
          label="לקוחות"
          value={stats.totalClients}
          subtitle={`${stats.totalWorkers} עובדים · ${stats.totalVehicles} רכבים`}
          color="bg-amber-500"
          href="/clients"
        />
        <StatCard
          icon={<FileText className="h-5 w-5 text-violet-600" />}
          label="חשבוניות ממתינות"
          value={stats.pendingInvoices}
          color="bg-violet-500"
          href="/invoices"
        />
      </div>

      {/* ── Expanded Stats ──────────────────────────────────────── */}
      {statsExpanded && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<CheckCircle className="h-5 w-5 text-green-600" />} label="עבודות שהושלמו" value={stats.completedJobs} color="bg-green-500" />
          <StatCard icon={<Clock className="h-5 w-5 text-yellow-600" />} label="עבודות ממתינות" value={stats.pendingJobs} color="bg-yellow-500" />
          <StatCard icon={<Truck className="h-5 w-5 text-gray-600" />} label="רכבים" value={stats.totalVehicles} color="bg-gray-500" />
          <StatCard icon={<UserCheck className="h-5 w-5 text-purple-600" />} label="עובדים" value={stats.totalWorkers} color="bg-purple-500" />
        </div>
      )}

      {/* ── Job Status Pipeline ──────────────────────────────────── */}
      {stats.jobsByStatus.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3" dir="rtl">
            <h3 className="text-sm font-semibold font-hebrew">סטטוס עבודות</h3>
            <Link href="/jobs" className="text-xs text-gray-400 hover:text-gray-600 font-hebrew">צפה בהכל</Link>
          </div>
          <PipelineBar stages={stats.jobsByStatus} />
        </div>
      )}

      {/* ── Upcoming Jobs (full width) ─────────────────────────── */}
      <div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4" dir="rtl">
            <h3 className="text-sm font-semibold font-hebrew flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              עבודות קרובות
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={approachingJobsCount}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setApproachingJobsCount(v)
                  localStorage.setItem("approachingJobsCount", String(v))
                }}
                className="text-xs border rounded px-2 py-1 font-hebrew"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <Link href="/jobs" className="text-vazana-teal hover:underline text-xs font-hebrew">
                צפה בהכל
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-50 rounded-lg" />
              ))}
            </div>
          ) : stats.upcomingJobs.length > 0 ? (
            <div className="space-y-2">
              {stats.upcomingJobs.slice(0, approachingJobsCount).map((job: any) => (
                <div
                  key={job.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    job.isToday ? "bg-red-50 border-s-4 border-red-500"
                    : job.isTomorrow ? "bg-yellow-50 border-s-4 border-yellow-500"
                    : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={`text-[10px] ${jobStatusColors[job.job_status] ?? "bg-gray-100 text-gray-700"}`}>
                      {job.job_status}
                    </Badge>
                    <span className="text-xs text-gray-500 font-hebrew font-medium">{job.daysUntil}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium font-hebrew">{job.client_name || "לקוח לא ידוע"}</p>
                    <p className="text-xs text-gray-500 font-hebrew">{job.location} · {job.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-hebrew">אין עבודות מתוכננות לשבוע הקרוב</p>
              <Link href="/jobs/new" className="mt-2 inline-block text-xs text-vazana-teal hover:underline font-hebrew">
                + תכנן עבודה חדשה
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Completed Jobs + Financial Summary (side by side) ────── */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* Recent Completed Jobs (2/3 width — first child = RIGHT in RTL) */}
        {stats.recentCompletedJobs.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold font-hebrew flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                עבודות שהושלמו לאחרונה
              </h3>
              <Link href="/jobs" className="text-xs text-gray-400 hover:text-gray-600 font-hebrew">צפה בהכל</Link>
            </div>
            <div className="space-y-2">
              {stats.recentCompletedJobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {job.total_amount > 0 && (
                      <span className="text-xs text-green-700 font-medium">₪{job.total_amount.toLocaleString()}</span>
                    )}
                    <span className="text-xs text-gray-500 font-hebrew">{job.date}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium font-hebrew">{job.client_name || "לקוח לא ידוע"}</p>
                    <p className="text-xs text-gray-500 font-hebrew">{job.work_type} · {job.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Summary (1/3 width — second child = LEFT in RTL) */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold font-hebrew flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" />
              סקירה כספית
            </h3>
            <Link href="/invoices" className="text-xs text-gray-400 hover:text-gray-600 font-hebrew">צפה בהכל</Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-green-800 font-hebrew">הכנסות</p>
                <p className="text-xs text-green-600 font-hebrew">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-800 font-hebrew">חשבוניות ממתינות</p>
                <p className="text-xs text-blue-600 font-hebrew">{stats.pendingInvoices}</p>
              </div>
            </div>
            {stats.overduePayments > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-800 font-hebrew">תשלומים באיחור</p>
                  <p className="text-xs text-red-600 font-hebrew">{stats.overduePayments}</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Truck className="w-5 h-5 text-gray-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 font-hebrew">משאבים</p>
                <p className="text-xs text-gray-600 font-hebrew">{stats.totalWorkers} עובדים · {stats.totalVehicles} רכבים</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
