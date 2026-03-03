"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, Truck, Plus, TrendingUp, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import type { Job } from "@/lib/types"

interface DashboardStats {
  totalClients: number
  totalJobs: number
  totalWorkers: number
  totalVehicles: number
  pendingJobs: number
  completedJobs: number
  monthlyRevenue: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalJobs: 0,
    totalWorkers: 0,
    totalVehicles: 0,
    pendingJobs: 0,
    completedJobs: 0,
    monthlyRevenue: 0,
  })
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [clientsRes, jobsRes, workersRes, vehiclesRes] = await Promise.all([
          apiClient.getClients(),
          apiClient.getJobs(),
          apiClient.getWorkers(),
          apiClient.getVehicles(),
        ])

        const jobs = jobsRes.data || []
        const pendingJobs = jobs.filter((job) => job.payment_status === "ממתין לתשלום").length
        const completedJobs = jobs.filter((job) => job.payment_status === "שולם").length
        const monthlyRevenue = jobs
          .filter((job) => job.payment_status === "שולם")
          .reduce((sum: number, job) => sum + (Number(job.total_amount) || 0), 0)

        setStats({
          totalClients: clientsRes.data?.length || 0,
          totalJobs: jobs.length,
          totalWorkers: workersRes.data?.length || 0,
          totalVehicles: vehiclesRes.data?.length || 0,
          pendingJobs,
          completedJobs,
          monthlyRevenue,
        })

        setRecentJobs(jobs.slice(0, 5))
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      title: "סה״כ לקוחות",
      value: stats.totalClients,
      icon: Users,
      color: "text-vazana-teal",
      bgColor: "bg-vazana-teal bg-opacity-20",
    },
    {
      title: "עבודות פעילות",
      value: stats.totalJobs,
      icon: Briefcase,
      color: "text-vazana-yellow",
      bgColor: "bg-vazana-yellow bg-opacity-30",
    },
    {
      title: "עובדים",
      value: stats.totalWorkers,
      icon: Users,
      color: "text-vazana-dark",
      bgColor: "bg-vazana-dark bg-opacity-10",
    },
    {
      title: "כלי רכב",
      value: stats.totalVehicles,
      icon: Truck,
      color: "text-vazana-teal",
      bgColor: "bg-vazana-teal bg-opacity-20",
    },
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-vazana-dark font-hebrew">לוח בקרה</h1>
          <p className="text-gray-600 font-hebrew">סקירה כללית של העסק שלך</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button asChild className="bg-vazana-yellow text-vazana-dark hover:bg-vazana-yellow/90 font-hebrew">
            <Link href="/jobs/new">
              <Plus className="ml-2 h-4 w-4" />
              עבודה חדשה
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-vazana-teal text-vazana-teal hover:bg-vazana-teal hover:text-white bg-transparent font-hebrew"
          >
            <Link href="/clients/new">
              <Plus className="ml-2 h-4 w-4" />
              לקוח חדש
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir="rtl">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-r-4 border-r-vazana-yellow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-right">
                <CardTitle className="text-sm font-medium text-vazana-dark font-hebrew">{stat.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-vazana-dark text-right">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue and Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" dir="rtl">
        <Card className="border-r-4 border-r-vazana-teal">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <TrendingUp className="h-5 w-5 text-vazana-teal" />
            <CardTitle className="text-sm font-medium text-vazana-dark font-hebrew">הכנסות חודשיות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vazana-dark text-right">₪{stats.monthlyRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-vazana-yellow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Clock className="h-5 w-5 text-vazana-yellow" />
            <CardTitle className="text-sm font-medium text-vazana-dark font-hebrew">ממתינות לתשלום</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vazana-dark text-right">{stats.pendingJobs}</div>
          </CardContent>
        </Card>

        <Card className="border-r-4 border-r-vazana-teal">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CheckCircle className="h-5 w-5 text-vazana-teal" />
            <CardTitle className="text-sm font-medium text-vazana-dark font-hebrew">עבודות ששולמו</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vazana-dark text-right">{stats.completedJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card dir="rtl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-vazana-dark font-hebrew">עבודות אחרונות</CardTitle>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-vazana-teal text-vazana-teal hover:bg-vazana-teal hover:text-white bg-transparent font-hebrew"
            >
              <Link href="/jobs">הצג הכל</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="font-hebrew">אין עבודות עדיין. צור את העבודה הראשונה שלך כדי להתחיל.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-vazana-yellow transition-colors"
                >
                  <div className="text-left">
                    <p className="font-medium text-vazana-dark">₪{job.total_amount}</p>
                    <p className="text-sm text-gray-500">{job.worker_name}</p>
                  </div>
                  <div className="flex-1 text-right mr-4">
                    <div className="flex items-center justify-end gap-2">
                      <Badge
                        variant={job.payment_status === "שולם" ? "default" : "secondary"}
                        className={
                          job.payment_status === "שולם"
                            ? "bg-vazana-teal text-white"
                            : job.payment_status === "ממתין לתשלום"
                              ? "bg-vazana-yellow text-vazana-dark"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {job.payment_status}
                      </Badge>
                      <h4 className="font-medium text-vazana-dark font-hebrew">עבודה #{job.job_number}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 font-hebrew">
                      {job.client_name} • {job.site} • {job.work_type}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{job.job_date ? new Date(job.job_date).toLocaleDateString("he-IL") : "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
