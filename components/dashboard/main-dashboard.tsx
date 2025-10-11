"use client"

import { useState } from "react"
import { 
  DollarSign, Briefcase, Users, CheckCircle, TrendingUp, Calendar, Bell, Plus, FileText,
  Clock, AlertCircle, MapPin, Truck, UserCheck, Target, BarChart3, Zap
} from "lucide-react"
import Link from "next/link"
import { StatsContainer } from "@/components/ui/stats-container"
import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"

export default function MainDashboard() {
  const [approachingJobsCount, setApproachingJobsCount] = useState(3) // User preference
  const [approachingJobs, setApproachingJobs] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const supabase = createClient()
  const [stats, setStats] = useState({
    // Financial Stats
    totalRevenue: 15420, // Sample with real number
    monthlyRevenue: 8750,
    pendingInvoicePayments: 3, // Renamed for clarity
    avgJobValue: 1200,
    
    // Job Stats - Core Operations
    activeJobs: 4, // Currently running jobs
    completedJobsThisMonth: 12, // Jobs finished this month
    totalJobsThisMonth: 16, // Total jobs for this month (for success rate)
    pendingApprovalJobs: 2, // Jobs waiting for client approval
    scheduledJobs: 6, // Jobs scheduled for future dates
    
    // Client Stats - Load from actual data
    totalClients: 0, // Will be loaded from database
    activeClients: 0, // Clients with jobs this month
    newClientsThisMonth: 0,
    
    // Operational Stats
    activeVehicles: 3,
    workersOnDuty: 8,
    totalProjects: 5, // Active project sites
    
    // Performance Stats
    avgDeploymentDelay: "1.2 ימים", // Time from job creation to deployment
    monthlyTargetJobs: 20, // Target for success rate calculation
  })

  const recentJobs = [
    {
      id: "0006",
      customer: "אדהם עבודות פיתוח",
      location: "תל אביב, לוחמי הגטו",
      date: "13/08/2025",
      status: "פעיל",
      amount: "shift/₪900",
    },
  ]
  
  // Load approaching jobs from database
  const loadApproachingJobs = async () => {
    try {
      setLoadingJobs(true)
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          id,
          job_date,
          site,
          city,
          job_status,
          payment_status,
          client_name,
          shift_type,
          work_type
        `)
        .gte('job_date', today.toISOString().split('T')[0])
        .lte('job_date', nextWeek.toISOString().split('T')[0])
        .in('job_status', ['ממתין', 'בתהליך'])
        .order('job_date', { ascending: true })
        .limit(10)

      if (error) {
        console.error('Error loading approaching jobs:', error)
        return
      }

      const processedJobs = jobs?.map(job => {
        const jobDate = new Date(job.job_date)
        const diffTime = jobDate.getTime() - today.getTime()
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        // Create location string from site and city
        let location = 'מיקום לא צוין'
        if (job.site && job.city) {
          location = `${job.site}, ${job.city}`
        } else if (job.site) {
          location = job.site
        } else if (job.city) {
          location = job.city
        }
        
        // Format shift type display
        let timeDisplay = getShiftTimeInHebrew(job.shift_type)
        
        return {
          id: job.id,
          customer: job.client_name || 'לקוח לא ידוע',
          location: location,
          date: jobDate.toLocaleDateString('he-IL'),
          time: timeDisplay,
          status: getJobStatusInHebrew(job.job_status), // Use job_status column
          paymentStatus: getPaymentStatusInHebrew(job.payment_status),
          workType: job.work_type || '',
          daysUntil: daysUntil === 0 ? 'היום' : daysUntil === 1 ? 'מחר' : `בעוד ${daysUntil} ימים`,
          isToday: daysUntil === 0,
          isTomorrow: daysUntil === 1
        }
      }) || []

      setApproachingJobs(processedJobs)
    } catch (error) {
      console.error('Error loading approaching jobs:', error)
    } finally {
      setLoadingJobs(false)
    }
  }
  
  const getJobStatusInHebrew = (status: string) => {
    switch (status) {
      case 'ממתין': return 'ממתין'
      case 'בתהליך': return 'בתהליך'
      case 'הושלם': return 'הושלם'
      default: return status || 'ממתין'
    }
  }
  
  const getPaymentStatusInHebrew = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'ממתין לתשלום': return 'ממתין לתשלום'
      case 'שולם': return 'שולם'
      case 'מאוחר': return 'מאוחר'
      case 'לא רלוונטי': return 'לא רלוונטי'
      default: return paymentStatus || 'ממתין לתשלום'
    }
  }
  
  const getShiftTimeInHebrew = (shiftType: string) => {
    switch (shiftType) {
      case 'יום': return 'משמרת יום'
      case 'לילה': return 'משמרת לילה'
      case 'כפול': return 'משמרת כפולה'
      default: return shiftType || 'לא צוין'
    }
  }
  
  const saveApproachingJobsPreference = (count: number) => {
    setApproachingJobsCount(count)
    // Save to localStorage or user preferences
    if (typeof window !== 'undefined') {
      localStorage.setItem('approachingJobsCount', count.toString())
    }
  }

  // Load client stats from database
  const loadClientStats = async () => {
    try {
      // Get all clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, created_date')
        
      if (clientsError) {
        console.error('Error loading clients:', clientsError)
        return
      }
      
      const totalClients = clients?.length || 0
      
      // Get clients with jobs in the past 30 days to determine "active" clients
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: recentJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('client_id')
        .gte('job_date', thirtyDaysAgo.toISOString().split('T')[0])
        
      if (jobsError) {
        console.error('Error loading recent jobs:', jobsError)
        // Fallback to all clients if jobs query fails
        setStats(prev => ({
          ...prev,
          totalClients,
          activeClients: totalClients
        }))
        return
      }
      
      // Count unique clients with recent jobs
      const uniqueActiveClientIds = [...new Set(recentJobs?.map(job => job.client_id))]
      const activeClients = uniqueActiveClientIds.length
      
      setStats(prev => ({
        ...prev,
        totalClients,
        activeClients
      }))
      
    } catch (error) {
      console.error('Error loading client stats:', error)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadApproachingJobs()
    loadClientStats()
    
    // Load preference from localStorage
    if (typeof window !== 'undefined') {
      const savedCount = localStorage.getItem('approachingJobsCount')
      if (savedCount) {
        setApproachingJobsCount(Number(savedCount))
      }
    }
  }, [])

  const quickActions = [
    { name: "יצירת עבודה חדשה", href: "/jobs/new", icon: Plus, color: "bg-vazana-teal" },
    { name: "הפקת חשבונית", href: "/invoices/new", icon: FileText, color: "bg-vazana-yellow" },
    { name: "ניהול לקוחות", href: "/clients", icon: Users, color: "bg-blue-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-right space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-vazana-dark font-hebrew">לוח בקרה</h1>
          <p className="text-gray-600 font-hebrew">ברוכים השבים למערכת ניהול הלקוחות של וזאנה סטודיו</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <button
                className={`${action.color} text-white p-4 rounded-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity font-hebrew w-full`}
              >
                <span>{action.name}</span>
                <action.icon className="w-5 h-5" />
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Core Job Statistics - Most Important */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsContainer
          title="עבודות פעילות"
          value={stats.activeJobs}
          subtitle="בביצוע כרגע"
          icon={Briefcase}
          color="blue"
        />
        
        <StatsContainer
          title="עבודות מתוכננות"
          value={stats.scheduledJobs}
          subtitle="לביצוע בעתיד"
          icon={Calendar}
          color="teal"
        />
        
        <StatsContainer
          title="עבודות שהושלמו"
          value={stats.completedJobsThisMonth}
          subtitle="בחודש הנוכחי"
          icon={CheckCircle}
          color="green"
        />
        
        <StatsContainer
          title="אחוז השלמה"
          value={`${Math.round((stats.completedJobsThisMonth / stats.totalJobsThisMonth) * 100)}%`}
          subtitle={`${stats.completedJobsThisMonth} מתוך ${stats.totalJobsThisMonth}`}
          icon={Target}
          color="purple"
        />
      </div>
      
      {/* Financial & Client Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsContainer
          title="הכנסות החודש"
          value={`₪${stats.totalRevenue.toLocaleString()}`}
          subtitle="סך הכנסות חודשיות"
          icon={DollarSign}
          color="green"
        />
        
        <StatsContainer
          title="לקוחות פעילים"
          value={stats.activeClients || stats.totalClients}
          subtitle={`מתוך ${stats.totalClients || 5} סה"כ`}
          icon={Users}
          color="blue"
        />
        
        <StatsContainer
          title="תשלומים ממתינים"
          value={stats.pendingInvoicePayments}
          subtitle="חשבוניות לאישור"
          icon={FileText}
          color="yellow"
        />
        
        <StatsContainer
          title="עבודות לאישור לקוח"
          value={stats.pendingApprovalJobs}
          subtitle="ממתינות לאישור"
          icon={Clock}
          color="yellow"
        />
      </div>
      
      {/* Operational & Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsContainer
          title="כלי רכב פעילים"
          value={stats.activeVehicles}
          subtitle="זמינים לשימוש"
          icon={Truck}
          color="blue"
        />
        
        <StatsContainer
          title="עובדים במשמרת"
          value={stats.workersOnDuty}
          subtitle="פעילים כרגע"
          icon={UserCheck}
          color="purple"
        />
        
        <StatsContainer
          title="אתרי עבודה פעילים"
          value={stats.totalProjects}
          subtitle="פרויקטים בתהליך"
          icon={MapPin}
          color="teal"
        />
        
        <StatsContainer
          title="זמן ממוצע לפריסה"
          value={stats.avgDeploymentDelay}
          subtitle="מיצירה לביצוע"
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Overview */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Bell className="w-5 h-5 text-vazana-teal" />
            <h3 className="text-lg font-semibold text-vazana-dark font-hebrew">סקירה כספית והתראות</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-green-800 font-hebrew">שווי החודש</p>
                <p className="text-xs text-green-600 font-hebrew">₪{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-800 font-hebrew">חשבוניות במיקור</p>
                <p className="text-xs text-blue-600 font-hebrew">0</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-orange-800 font-hebrew">סך כל הכנסות כל החודשים</p>
                <p className="text-xs text-orange-600 font-hebrew">₪{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Approaching Jobs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link href="/jobs" className="text-vazana-teal hover:underline text-sm font-hebrew">
                צפה בכל העבודות
              </Link>
              <span className="text-gray-300">|</span>
              <select 
                value={approachingJobsCount} 
                onChange={(e) => saveApproachingJobsPreference(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1 font-hebrew"
              >
                <option value={3}>3 עבודות</option>
                <option value={5}>5 עבודות</option>
                <option value={10}>10 עבודות</option>
              </select>
            </div>
            <h3 className="text-lg font-semibold text-vazana-dark font-hebrew">עבודות קרובות</h3>
          </div>

          {loadingJobs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="w-32 h-4 bg-gray-200 rounded"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : approachingJobs.length > 0 ? (
            <div className="space-y-3">
              {approachingJobs.slice(0, approachingJobsCount).map((job) => (
                <div key={job.id} className={`flex items-center justify-between p-4 rounded-lg ${
                  job.isToday ? 'bg-red-50 border-l-4 border-red-500' : 
                  job.isTomorrow ? 'bg-yellow-50 border-l-4 border-yellow-500' : 
                  'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-hebrew ${
                      job.isToday ? 'bg-red-100 text-red-800' :
                      job.isTomorrow ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {job.status}
                    </span>
                    <div className="text-sm text-gray-600 font-hebrew">
                      <span className="font-medium">{job.daysUntil}</span>
                      <span className="mx-2">•</span>
                      <span>{job.time}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-vazana-dark font-hebrew">{job.customer}</p>
                    <p className="text-sm text-gray-600 font-hebrew">{job.location}</p>
                    <p className="text-xs text-gray-500 font-hebrew">{job.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-hebrew">אין עבודות מתוכננות</p>
              <Link href="/jobs/new">
                <button className="mt-3 bg-vazana-teal text-white px-4 py-2 rounded-lg font-hebrew hover:bg-opacity-90">
                  תכנן עבודה חדשה
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
