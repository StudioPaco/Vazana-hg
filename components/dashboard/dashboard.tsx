"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, Truck, Plus, TrendingUp, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

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
  const [recentJobs, setRecentJobs] = useState<any[]>([])
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
        const pendingJobs = jobs.filter((job: any) => job.payment_status === "pending").length
        const completedJobs = jobs.filter((job: any) => job.payment_status === "paid").length
        const monthlyRevenue = jobs
          .filter((job: any) => job.payment_status === "paid")
          .reduce((sum: number, job: any) => sum + (Number.parseFloat(job.total_amount) || 0), 0)

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
      title: "Total Clients",
      titleHe: "סה״כ לקוחות",
      value: stats.totalClients,
      icon: Users,
      color: "text-vazana-teal",
      bgColor: "bg-vazana-teal bg-opacity-20",
    },
    {
      title: "Active Jobs",
      titleHe: "עבודות פעילות",
      value: stats.totalJobs,
      icon: Briefcase,
      color: "text-vazana-yellow",
      bgColor: "bg-vazana-yellow bg-opacity-30",
    },
    {
      title: "Workers",
      titleHe: "עובדים",
      value: stats.totalWorkers,
      icon: Users,
      color: "text-vazana-dark",
      bgColor: "bg-vazana-dark bg-opacity-10",
    },
    {
      title: "Vehicles",
      titleHe: "כלי רכב",
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
      {/* Header - Updated with Vazana colors */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-vazana-dark">Dashboard</h1>
          <p className="text-gray-600">לוח בקרה - Overview of your business</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button asChild className="bg-vazana-yellow text-vazana-dark hover:bg-vazana-yellow/90">
            <Link href="/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-vazana-teal text-vazana-teal hover:bg-vazana-teal hover:text-white bg-transparent"
          >
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-l-4 border-l-vazana-yellow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-vazana-dark">{stat.title}</CardTitle>
                <p className="text-xs text-gray-400">{stat.titleHe}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-vazana-dark">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue and Status Cards - Updated with Vazana colors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-vazana-teal">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-vazana-dark">Monthly Revenue</CardTitle>
              <p className="text-xs text-gray-400">הכנסות חודשיות</p>
            </div>
            <TrendingUp className="h-5 w-5 text-vazana-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vazana-dark">₪{stats.monthlyRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-vazana-yellow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-vazana-dark">Pending Jobs</CardTitle>
              <p className="text-xs text-gray-400">עבודות ממתינות</p>
            </div>
            <Clock className="h-5 w-5 text-vazana-yellow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vazana-dark">{stats.pendingJobs}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-vazana-teal">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-vazana-dark">Completed Jobs</CardTitle>
              <p className="text-xs text-gray-400">עבודות שהושלמו</p>
            </div>
            <CheckCircle className="h-5 w-5 text-vazana-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vazana-dark">{stats.completedJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-vazana-dark">Recent Jobs</CardTitle>
              <CardDescription>עבודות אחרונות - Latest job activities</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-vazana-teal text-vazana-teal hover:bg-vazana-teal hover:text-white bg-transparent"
            >
              <Link href="/jobs">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No jobs yet. Create your first job to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-vazana-yellow transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-vazana-dark">Job #{job.job_number}</h4>
                      <Badge
                        variant={job.payment_status === "paid" ? "default" : "secondary"}
                        className={
                          job.payment_status === "paid"
                            ? "bg-vazana-teal text-white"
                            : job.payment_status === "pending"
                              ? "bg-vazana-yellow text-vazana-dark"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {job.payment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {job.client_name} • {job.site} • {job.work_type}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(job.job_date).toLocaleDateString("he-IL")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-vazana-dark">₪{job.total_amount}</p>
                    <p className="text-sm text-gray-500">{job.worker_name}</p>
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
