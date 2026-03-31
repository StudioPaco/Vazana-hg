"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import EditJobModal from "@/components/jobs/edit-job-modal"
import ImportJobsModal from "@/components/jobs/import-jobs-modal"
import { toast } from "@/hooks/use-toast"
import StatusBadge from "@/components/ui/status-badge"

// Job status is calculated client-side based on date rules:
//   Past (>24h ago) → "הושלם" (completed/green)
//   Within ±24h     → "בתהליך" (in progress/yellow)
//   Future          → "ממתין" (waiting/default)
const calculateJobStatus = (jobDate: string): string => {
  const now = new Date()
  const date = new Date(jobDate)
  const diffHours = (date.getTime() - now.getTime()) / (1000 * 3600)
  if (diffHours < -24) return "הושלם"
  if (diffHours <= 24) return "בתהליך"
  return "ממתין"
}

const calculatePaymentStatus = (jobStatus: string, currentPayment: string): string => {
  if (jobStatus === "הושלם" && currentPayment !== "שולם") return "ממתין לתשלום"
  if (jobStatus !== "הושלם") return "לא רלוונטי"
  return currentPayment
}

// Convert shift type to Hebrew
const getShiftTypeInHebrew = (shiftType: string): string => {
  const shiftMap: Record<string, string> = {
    'day': 'יום',
    'night': 'לילה',
    'double': 'כפול',
    '24 שעות': 'כפול',
    'יום': 'יום',
    'לילה': 'לילה',
    'כפול': 'כפול'
  }
  return shiftMap[shiftType] || shiftType
}
import {
  Plus,
  Search,
  MapPin,
  User,
  Truck,
  Edit,
  Trash2,
  Grid3X3,
  List,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Briefcase,
  RotateCcw,
  Upload,
} from "lucide-react"
import Link from "next/link"

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
  job_specific_shift_rate?: number
  payment_status: string
  job_status: string
  notes: string
  created_at: string
  is_deleted?: boolean
}

interface JobsPageProps {
  showHeader?: boolean
  onStatsCalculated?: (stats: {
    totalRevenue: number
    pendingJobs: number
    urgentJobs: number
    completedJobs: number
  }) => void
}

export default function JobsPage({ showHeader = true, onStatsCalculated }: JobsPageProps) {
  const { preferences, loading: preferencesLoading, updatePreference } = useUserPreferences()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'number' | 'date'>(preferences?.jobs_sort_by || 'date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Sync sortBy from saved preferences once they load
  useEffect(() => {
    if (preferences?.jobs_sort_by) {
      setSortBy(preferences.jobs_sort_by)
    }
  }, [preferences?.jobs_sort_by])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        console.log("Fetching jobs from API...")
        
        const response = await fetch('/api/jobs')
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        
        const result = await response.json()
        const allJobs = result.data || []
        
        console.log("Successfully fetched jobs:", allJobs)
        
        // Calculate display status based on date rules
        const jobsWithStatus = allJobs.map((job: Job) => ({
          ...job,
          job_status: calculateJobStatus(job.job_date),
          payment_status: calculatePaymentStatus(calculateJobStatus(job.job_date), job.payment_status),
        }))
        
        setJobs(jobsWithStatus)
        setFilteredJobs(allJobs)
      } catch (error) {
        console.error("Failed to fetch jobs:", error)
        // Don't show sample data - just show empty state
        setJobs([])
        setFilteredJobs([])
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  useEffect(() => {
    if (!preferences) return
    
    let filtered = jobs.filter(
      (job) =>
        job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.work_type.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Filter by deleted status
    if (!preferences.show_deleted_jobs) {
      filtered = filtered.filter((job) => !job.is_deleted)
    }
    
    // Filter by finished status
    if (!preferences.show_finished_jobs) {
      filtered = filtered.filter((job) => job.job_status !== "הושלם")
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.job_status === statusFilter)
    }

    if (clientFilter !== "all") {
      filtered = filtered.filter((job) => job.client_name === clientFilter)
    }
    
    // Apply sorting
    const dir = sortDir === 'desc' ? -1 : 1
    filtered.sort((a, b) => {
      if (sortBy === 'number') {
        const aNum = parseInt(a.job_number) || 0
        const bNum = parseInt(b.job_number) || 0
        return (aNum - bNum) * dir
      } else {
        return (new Date(a.job_date).getTime() - new Date(b.job_date).getTime()) * dir
      }
    })

    setFilteredJobs(filtered)
  }, [searchTerm, statusFilter, clientFilter, jobs, preferences, sortBy, sortDir])

  const handleDeleteJob = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק עבודה זו?")) {
      try {
        const response = await fetch(`/api/jobs/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_deleted: true })
        })

        if (!response.ok) {
          throw new Error('Failed to delete job')
        }

        // Update local state to mark as deleted
        setJobs(jobs.map(job => 
          job.id === id ? { ...job, is_deleted: true } : job
        ))
      } catch (error) {
        console.error("Failed to delete job:", error)
        toast({ title: "שגיאה במחיקת העבודה", variant: "destructive" })
      }
    }
  }

  const handleRestoreJob = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך לשחזר עבודה זו?")) {
      try {
        // Calculate new job number for restored job based on active jobs
        const activeJobs = jobs.filter(job => !job.is_deleted && job.id !== id)
        const highestActiveJobNumber = activeJobs.length === 0 ? 0 : Math.max(
          ...activeJobs.map(job => Number.parseInt(job.job_number) || 0)
        )
        const newJobNumber = (highestActiveJobNumber + 1).toString().padStart(4, "0")

        const response = await fetch(`/api/jobs/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            is_deleted: false,
            job_number: newJobNumber
          })
        })

        if (!response.ok) {
          throw new Error('Failed to restore job')
        }

        // Update local state to mark as not deleted with new job number
        setJobs(jobs.map(job => 
          job.id === id ? { ...job, is_deleted: false, job_number: newJobNumber } : job
        ))
      } catch (error) {
        console.error("Failed to restore job:", error)
        toast({ title: "שגיאה בשחזור העבודה", variant: "destructive" })
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "הושלם":
        return "bg-green-100 text-green-800"
      case "פעיל":
      case "בתהליך":
        return "bg-vazana-teal/20 text-vazana-teal"
      case "ממתין":
        return "bg-yellow-100 text-yellow-800"
      case "דחוף":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "שולם":
        return "bg-green-100 text-green-800"
      case "ממתין לתשלום":
        return "bg-yellow-100 text-yellow-800"
      case "מאוחר":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalRevenue = jobs.reduce((sum, job) => sum + (job.total_amount || 0), 0)
  const pendingJobs = jobs.filter((job) => job.job_status === "ממתין" || job.job_status === "בתהליך").length
  const urgentJobs = jobs.filter((job) => job.job_status === "דחוף").length
  const completedJobs = jobs.filter((job) => job.job_status === "הושלם").length

  // Report stats to parent PageLayout
  useEffect(() => {
    if (onStatsCalculated && !loading) {
      onStatsCalculated({ totalRevenue, pendingJobs, urgentJobs, completedJobs })
    }
  }, [totalRevenue, pendingJobs, urgentJobs, completedJobs, loading, onStatsCalculated])

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJob(prev => prev === jobId ? null : jobId)
  }

  const handleEditJob = (job: Job) => {
    setEditingJob(job)
    setEditModalOpen(true)
  }

  const handleJobUpdated = (updatedJob: Job) => {
    setJobs(jobs.map(job => job.id === updatedJob.id ? updatedJob : job))
  }

  if (loading || preferencesLoading) {
    return (
      <div className="relative space-y-6">
        {showHeader && (
          <>
            <div className="absolute top-0 right-0 text-right">
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="absolute top-0 left-0">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </>
        )}
        <div className={`${showHeader ? 'pt-16' : ''} animate-pulse space-y-6`}>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-6">
      {showHeader && (
        <>
          <div className="absolute top-0 right-0 text-right z-10">
            <h1 className="text-2xl font-bold text-vazana-dark font-hebrew">עבודות</h1>
            <p className="text-gray-600 font-hebrew">נהל את כל העבודות והשירותים והפרויקטים שלך</p>
          </div>

          <div className="absolute top-0 left-0 z-10">
            <Briefcase className="w-8 h-8 text-vazana-teal" />
          </div>
        </>
      )}

      <div className={showHeader ? "pt-16" : ""}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/jobs/new">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-hebrew">
                <Plus className="w-4 h-4 ml-2" />
                עבודה חדשה
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="font-hebrew"
            >
              <Upload className="w-4 h-4 ml-2" />
              ייבוא מקובץ
            </Button>

            {/* Sorting Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (sortBy === 'number') {
                  setSortDir(d => d === 'desc' ? 'asc' : 'desc')
                } else {
                  setSortBy('number')
                  updatePreference('jobs_sort_by', 'number')
                  setSortDir('desc')
                }
              }}
              className={`font-hebrew text-xs px-3 py-1 transition-colors ${
                sortBy === 'number'
                  ? 'bg-teal-500 text-white hover:bg-teal-600'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              מספר {sortBy === 'number' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (sortBy === 'date') {
                  setSortDir(d => d === 'desc' ? 'asc' : 'desc')
                } else {
                  setSortBy('date')
                  updatePreference('jobs_sort_by', 'date')
                  setSortDir('desc')
                }
              }}
              className={`font-hebrew text-xs px-3 py-1 transition-colors ${
                sortBy === 'date'
                  ? 'bg-teal-500 text-white hover:bg-teal-600'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              תאריך {sortBy === 'date' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </Button>
          </div>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updatePreference('jobs_view_mode', 'list')}
              className={`px-2 py-1 ${preferences?.jobs_view_mode !== 'table' ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updatePreference('jobs_view_mode', 'table')}
              className={`px-2 py-1 ${preferences?.jobs_view_mode === 'table' ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showHeader && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="relative">
            <CardContent className="p-4">
              <DollarSign className="absolute top-4 left-4 w-8 h-8 text-gray-400" />
              <div className="absolute top-4 right-4 text-right">
                <p className="text-sm text-gray-600 font-hebrew">הכנסות חודשי</p>
                <p className="text-xl font-bold text-vazana-dark">₪{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="h-16"></div>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-4">
              <Clock className="absolute top-4 left-4 w-8 h-8 text-yellow-500" />
              <div className="absolute top-4 right-4 text-right">
                <p className="text-sm text-gray-600 font-hebrew">עבודות ממתינות</p>
                <p className="text-xl font-bold text-vazana-dark">{pendingJobs}</p>
              </div>
              <div className="h-16"></div>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-4">
              <AlertTriangle className="absolute top-4 left-4 w-8 h-8 text-red-500" />
              <div className="absolute top-4 right-4 text-right">
                <p className="text-sm text-gray-600 font-hebrew">עבודות דחופות</p>
                <p className="text-xl font-bold text-vazana-dark">{urgentJobs}</p>
              </div>
              <div className="h-16"></div>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-4">
              <CheckCircle className="absolute top-4 left-4 w-8 h-8 text-green-500" />
              <div className="absolute top-4 right-4 text-right">
                <p className="text-sm text-gray-600 font-hebrew">סה"כ עבודות חודש</p>
                <p className="text-xl font-bold text-vazana-dark">{completedJobs}</p>
              </div>
              <div className="h-16"></div>
            </CardContent>
          </Card>
        </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between" dir="rtl">
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter} dir="rtl">
              <SelectTrigger className="w-full sm:w-[180px] font-hebrew text-right">
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
                <SelectContent dir="rtl">
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="ממתין">ממתין</SelectItem>
                <SelectItem value="בתהליך">בתהליך</SelectItem>
                <SelectItem value="הושלם">הושלם</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter} dir="rtl">
              <SelectTrigger className="w-full sm:w-[180px] font-hebrew text-right">
                <SelectValue placeholder="כל הלקוחות" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">כל הלקוחות</SelectItem>
                {Array.from(new Set(jobs.map((job) => job.client_name))).map((client) => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="show-deleted"
                  checked={preferences?.show_deleted_jobs ?? false}
                  onCheckedChange={(checked) => updatePreference('show_deleted_jobs', !!checked)}
                />
                <label htmlFor="show-deleted" className="text-sm font-hebrew cursor-pointer">
                  הצג עבודות מחוקות
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="show-finished"
                  checked={preferences?.show_finished_jobs ?? true}
                  onCheckedChange={(checked) => updatePreference('show_finished_jobs', !!checked)}
                />
                <label htmlFor="show-finished" className="text-sm font-hebrew cursor-pointer">
                  הצג עבודות מושלמות
                </label>
              </div>
            </div>
            {(statusFilter !== "all" || clientFilter !== "all" || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatusFilter("all"); setClientFilter("all"); setSearchTerm("") }}
                className="font-hebrew text-xs text-gray-500 h-8"
              >
                נקה סינון
              </Button>
            )}
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="חפש עבודות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right font-hebrew w-full sm:w-[300px]"
            />
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-vazana-dark font-hebrew mb-2">לא נמצאו עבודות</h3>
            <p className="text-sm text-gray-500 font-hebrew mb-4">
              {searchTerm || statusFilter !== "all"
                ? "נסה לשנות את החיפוש או המסננים"
                : "התחל ביצירת העבודה הראשונה שלך"}
            </p>
            <Button className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew" asChild>
              <Link href="/jobs/new">
                <Plus className="ml-2 h-4 w-4" />
                צור עבודה חדשה
              </Link>
            </Button>
          </div>
        ) : preferences?.jobs_view_mode === 'table' ? (
          /* ── Table View ── */
          <div className="bg-white border rounded-lg overflow-hidden mt-6">
            <table className="w-full text-sm" dir="rtl">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">#</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">לקוח</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">תאריך</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">אתר</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">עיר</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">משמרת</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">סכום</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">סטטוס</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className={`hover:bg-gray-50 transition-colors ${
                    job.is_deleted ? 'bg-red-50' : ''
                  }`}>
                    <td className={`px-4 py-3 font-medium font-hebrew ${job.is_deleted ? 'text-red-600 line-through' : ''}`}>
                      {job.job_number}
                    </td>
                    <td className="px-4 py-3 font-hebrew">{job.client_name}</td>
                    <td className="px-4 py-3 font-hebrew">{new Date(job.job_date).toLocaleDateString("he-IL")}</td>
                    <td className="px-4 py-3 text-gray-600 font-hebrew">{job.site}</td>
                    <td className="px-4 py-3 text-gray-600 font-hebrew">{job.city}</td>
                    <td className="px-4 py-3 font-hebrew">{getShiftTypeInHebrew(job.shift_type)}</td>
                    <td className="px-4 py-3 font-medium" dir="ltr">₪{(job.total_amount || job.job_specific_shift_rate || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${getStatusColor(job.job_status)} text-xs`}>{job.job_status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {!job.is_deleted ? (
                          <>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs font-hebrew" onClick={() => handleEditJob(job)}>
                              ערוך
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs font-hebrew text-red-600" onClick={() => handleDeleteJob(job.id)}>
                              מחק
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs font-hebrew text-green-600" onClick={() => handleRestoreJob(job.id)}>
                            שחזר
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── List View (compact cards) ── */
          <div className="mt-6 space-y-2">
            {filteredJobs.map((job) => {
              const isExpanded = expandedJob === job.id

              return (
                <Card key={job.id} className={`transition-all duration-200 cursor-pointer ${
                  job.is_deleted ? 'border-red-300 bg-red-50/50' :
                  job.job_status === 'הושלם' ? 'border-green-200 bg-green-50/30' :
                  job.job_status === 'בתהליך' ? 'border-yellow-200 bg-yellow-50/30' : ''
                }`}>
                  <CardContent className="p-0">
                    {/* Compact title row */}
                    <div
                      className="flex items-center justify-between px-4 py-2"
                      dir="rtl"
                      onClick={() => toggleJobExpansion(job.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold font-hebrew text-sm ${job.is_deleted ? 'text-red-600 line-through' : 'text-vazana-dark'}`}>
                          #{job.job_number}
                        </span>
                        <span className="text-sm font-hebrew text-gray-700">{job.client_name}</span>
                        <span className="text-xs font-hebrew text-gray-400">{job.work_type}</span>
                        <span className="text-sm font-hebrew text-gray-500 tabular-nums">{new Date(job.job_date).toLocaleDateString("he-IL")}</span>
                        {job.is_deleted && (
                          <Badge variant="destructive" className="text-xs">נמחק</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(job.job_status)} text-xs`}>{job.job_status}</Badge>
                        <p className="font-bold text-vazana-dark text-sm">
                          ₪{(job.total_amount || job.job_specific_shift_rate || 0).toLocaleString()}
                        </p>
                        {!job.is_deleted ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleEditJob(job) }}>
                              <Edit className="w-3.5 h-3.5 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id) }}>
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-hebrew text-green-600" onClick={(e) => { e.stopPropagation(); handleRestoreJob(job.id) }}>
                            <RotateCcw className="w-3.5 h-3.5 ml-1" />
                            שחזר
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t px-4 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-right">
                            <p className="text-gray-500 font-hebrew text-xs">סוג עבודה</p>
                            <p className="font-medium font-hebrew">{job.work_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 font-hebrew text-xs">משמרת</p>
                            <p className="font-medium font-hebrew">{getShiftTypeInHebrew(job.shift_type)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 font-hebrew text-xs">אתר</p>
                            <p className="font-medium font-hebrew">{job.site}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 font-hebrew text-xs">עיר</p>
                            <p className="font-medium font-hebrew">{job.city}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 font-hebrew text-xs flex items-center justify-end gap-1"><User className="w-3 h-3" /> עובד</p>
                            <p className="font-medium font-hebrew">{job.worker_name || '—'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 font-hebrew text-xs flex items-center justify-end gap-1"><Truck className="w-3 h-3" /> רכב</p>
                            <p className="font-medium font-hebrew">{job.vehicle_name || '—'}</p>
                          </div>
                          {job.cart_name && (
                            <div className="text-right">
                              <p className="text-gray-500 font-hebrew text-xs">עגלה</p>
                              <p className="font-medium font-hebrew">{job.cart_name}</p>
                            </div>
                          )}
                          <div className="text-right">
                            <p className="text-gray-500 font-hebrew text-xs">תשלום</p>
                            <Badge className={`${getPaymentStatusColor(job.payment_status)} text-xs`}>{job.payment_status}</Badge>
                          </div>
                        </div>
                        {job.notes && (
                          <div className="mt-3 text-right">
                            <p className="text-gray-500 font-hebrew text-xs">הערות</p>
                            <p className="text-sm font-hebrew text-gray-700">{job.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        
        <EditJobModal
          job={editingJob}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onJobUpdated={handleJobUpdated}
        />
        
        <ImportJobsModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onImportComplete={() => {
            // Re-fetch jobs with full status calculation
            fetch('/api/jobs')
              .then(res => res.json())
              .then(result => {
                const allJobs = result.data || []
                const jobsWithStatus = allJobs.map((job: Job) => ({
                  ...job,
                  job_status: calculateJobStatus(job.job_date),
                  payment_status: calculatePaymentStatus(calculateJobStatus(job.job_date), job.payment_status),
                }))
                setJobs(jobsWithStatus)
              })
              .catch(err => console.error('Failed to refresh jobs after import:', err))
          }}
        />
      </div>
    </div>
  )
}
