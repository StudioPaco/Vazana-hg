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
import StatusBadge from "@/components/ui/status-badge"

// Note: Job statuses are now managed solely through database values
// Status calculation is handled by manual updates or edit modal

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
  payment_status: string
  job_status: string
  notes: string
  created_at: string
  is_deleted?: boolean
}

export default function JobsPage() {
  const { preferences, loading: preferencesLoading, updatePreference } = useUserPreferences()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'number' | 'date'>('number')

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        console.log("[v0] Fetching jobs from API...")
        
        const response = await fetch('/api/jobs')
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        
        const result = await response.json()
        const allJobs = result.data || []
        
        console.log("[v0] Successfully fetched jobs:", allJobs)
        
        // Use jobs exactly as they come from the database - no status calculation
        console.log("[v0] Using job statuses directly from database")
        
        setJobs(allJobs)
        setFilteredJobs(allJobs)
      } catch (error) {
        console.error("[v0] Failed to fetch jobs:", error)
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
    filtered.sort((a, b) => {
      if (sortBy === 'number') {
        const aNum = parseInt(a.job_number) || 0
        const bNum = parseInt(b.job_number) || 0
        return aNum - bNum
      } else {
        return new Date(b.job_date).getTime() - new Date(a.job_date).getTime()
      }
    })

    setFilteredJobs(filtered)
  }, [searchTerm, statusFilter, clientFilter, jobs, preferences, sortBy])

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
        alert("שגיאה במחיקת העבודה")
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
        alert("שגיאה בשחזור העבודה")
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

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedJobs(newExpanded)
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
        <div className="absolute top-0 right-0 text-right">
          <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="absolute top-0 left-0">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="pt-16 animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
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
      <div className="absolute top-0 right-0 text-right z-10">
        <h1 className="text-2xl font-bold text-vazana-dark font-hebrew">עבודות</h1>
        <p className="text-gray-600 font-hebrew">נהל את כל העבודות והשירותים והפרויקטים שלך</p>
      </div>

      <div className="absolute top-0 left-0 z-10">
        <Briefcase className="w-8 h-8 text-vazana-teal" />
      </div>

      <div className="pt-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-4 mb-6">
          <Link href="/jobs/new">
            <Button className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
              <Plus className="w-4 h-4 ml-2" />
              עבודה חדשה
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newViewMode = preferences?.jobs_view_mode === "list" ? "grid" : "list"
              updatePreference('jobs_view_mode', newViewMode)
            }}
            className="font-hebrew"
          >
            {preferences?.jobs_view_mode === "list" ? <Grid3X3 className="w-4 h-4 ml-2" /> : <List className="w-4 h-4 ml-2" />}
            תצוגת רשת
          </Button>
          
          {/* Sorting Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy('number')}
              className={`font-hebrew text-xs px-3 py-1 transition-colors ${
                sortBy === 'number' 
                  ? 'bg-teal-500 text-white hover:bg-teal-600' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              מספר עבודה
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy('date')}
              className={`font-hebrew text-xs px-3 py-1 transition-colors ${
                sortBy === 'date' 
                  ? 'bg-teal-500 text-white hover:bg-teal-600' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              תאריך
            </Button>
          </div>
        </div>

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

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] font-hebrew">
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="פעיל">פעיל</SelectItem>
                <SelectItem value="בתהליך">בתהליך</SelectItem>
                <SelectItem value="הושלם">הושלם</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-full sm:w-[180px] font-hebrew">
                <SelectValue placeholder="כל הלקוחות" />
              </SelectTrigger>
              <SelectContent>
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
          <Card className="relative">
            <div className="absolute top-4 right-4 text-right">
              <h3 className="font-bold text-vazana-dark font-hebrew">לא נמצאו עבודות</h3>
            </div>
            <Truck className="absolute top-4 left-4 w-6 h-6 text-gray-300" />
            <CardContent className="text-center py-12 pt-16">
              <div className="text-gray-500">
                <p className="text-sm font-hebrew">
                  {searchTerm || statusFilter !== "all"
                    ? "נסה לשנות את החיפוש או המסננים"
                    : "התחל ביצירת העבודה הראשונה שלך"}
                </p>
                <Button className="mt-4 bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew" asChild>
                  <Link href="/jobs/new">
                    <Plus className="ml-2 h-4 w-4" />
                    צור עבודה חדשה
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={`mt-6 ${preferences?.jobs_view_mode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}`}>
            {filteredJobs.map((job) => {
              const isExpanded = expandedJobs.has(job.id)

              return (
                <Card key={job.id} className={`hover:shadow-md transition-all duration-200 relative cursor-pointer ${
                  job.is_deleted ? 'border-red-300 bg-red-50' : 
                  job.job_status === 'הושלם' ? 'border-green-300 bg-green-50' :
                  job.job_status === 'בתהליך' ? 'border-yellow-300 bg-yellow-50' : ''
                }`}>
                  <div className="absolute top-4 right-4 text-right">
                    <h3 className={`font-bold font-hebrew ${
                      job.is_deleted ? 'text-red-600 line-through' : 'text-vazana-dark'
                    }`}>עבודה #{job.job_number}</h3>
                    <p className={`text-sm font-hebrew ${
                      job.is_deleted ? 'text-red-500' : 'text-gray-600'
                    }`}>{job.client_name}</p>
                    {job.is_deleted && (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        נמחק
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    {!job.is_deleted ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="font-hebrew bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditJob(job)
                          }}
                        >
                          <Edit className="w-4 h-4 ml-1" />
                          ערוך
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-hebrew text-red-600 hover:text-red-700 bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteJob(job.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 ml-1" />
                          מחק
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-hebrew text-green-600 hover:text-green-700 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestoreJob(job.id)
                        }}
                      >
                        <RotateCcw className="w-4 h-4 ml-1" />
                        שחזר
                      </Button>
                    )}
                  </div>

                  <CardContent
                    className={`pt-12 pb-2 transition-all duration-200 ${
                      isExpanded ? "min-h-[200px]" : "min-h-[40px]"
                    }`}
                    onClick={() => toggleJobExpansion(job.id)}
                  >
                    <div className="space-y-3">
                      {!isExpanded ? (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-right">
                            <p className="text-gray-500 font-hebrew text-xs">תאריך</p>
                            <p className="font-medium font-hebrew text-sm">
                              {new Date(job.job_date).toLocaleDateString("he-IL")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 font-hebrew text-xs">משמרת</p>
                            <p className="font-medium font-hebrew text-sm">{getShiftTypeInHebrew(job.shift_type)}</p>
                          </div>
                          <div className="text-right">
                            <div className="mb-1">
                              <p className="text-gray-500 font-hebrew text-sm">אתר</p>
                              <p className="font-medium font-hebrew text-sm">{job.site}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-hebrew text-sm">עיר</p>
                              <p className="font-medium font-hebrew text-sm">{job.city}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          {/* Main Details Columns */}
                          <div className="col-span-2 space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-right">
                                <p className="text-gray-500 font-hebrew text-sm">תאריך</p>
                                <p className="font-medium font-hebrew text-base">
                                  {new Date(job.job_date).toLocaleDateString("he-IL")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-500 font-hebrew text-sm">סוג עבודה</p>
                                <p className="font-medium font-hebrew text-base">{job.work_type}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-right">
                                <p className="text-gray-500 font-hebrew text-sm">אתר</p>
                                <p className="font-medium font-hebrew text-base">{job.site}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-500 font-hebrew text-sm">עיר</p>
                                <p className="font-medium font-hebrew text-base">{job.city}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-right">
                                <p className="text-gray-500 font-hebrew text-sm">משמרת</p>
                                <p className="font-medium font-hebrew text-base">{getShiftTypeInHebrew(job.shift_type)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-500 font-hebrew text-sm">סטטוס</p>
                                <p className="font-medium font-hebrew text-base">{job.job_status}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Details Panel - Side Column */}
                          <div className="bg-blue-50 p-3 rounded-lg text-right space-y-2">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm text-gray-600 font-hebrew">{job.site}</span>
                              <MapPin className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm text-gray-600 font-hebrew">{job.worker_name}</span>
                              <User className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm text-gray-600 font-hebrew">{job.vehicle_name}</span>
                              <Truck className="w-4 h-4 text-blue-500" />
                            </div>
                            {job.cart_name && (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm text-gray-600 font-hebrew">{job.cart_name}</span>
                                <div className="w-4 h-4 text-blue-500 flex items-center justify-center">
                                  <div className="w-3 h-3 border border-blue-500 rounded-sm"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge className={`${getStatusColor(job.job_status)} ${!isExpanded ? "text-base px-3 py-1" : ""}`}>{job.job_status}</Badge>
                          {isExpanded && (
                            <Badge className={getPaymentStatusColor(job.payment_status)}>{job.payment_status}</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-vazana-dark ${isExpanded ? "text-lg" : "text-sm"}`}>
                            ₪{job.total_amount}
                          </p>
                        </div>
                      </div>

                      <div className="text-center pt-1">
                        <p className="text-xs text-gray-400 font-hebrew">
                          {isExpanded ? "לחץ כדי לכווץ" : "לחץ כדי להרחיב"}
                        </p>
                      </div>
                    </div>
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
      </div>
    </div>
  )
}
