"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

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
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setJobs(data || [])
        setFilteredJobs(data || [])
      } catch (error) {
        console.error("Failed to fetch jobs:", error)
        // Use sample data as fallback
        const sampleJobs: Job[] = [
          {
            id: "1",
            job_number: "0006",
            client_name: "אדהם עבודות פיתוח",
            job_date: "2025-08-13",
            work_type: "אבטחה",
            shift_type: "יום",
            site: "לוחמי הגטו",
            city: "תל אביב",
            worker_name: "עמית קורח",
            vehicle_name: "רכב 1",
            cart_name: "עגלה A",
            total_amount: 900,
            payment_status: "ממתין לתשלום",
            job_status: "פעיל",
            notes: "עבודה רגילה",
            created_at: "2025-08-13T10:00:00Z",
          },
        ]
        setJobs(sampleJobs)
        setFilteredJobs(sampleJobs)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  useEffect(() => {
    let filtered = jobs.filter(
      (job) =>
        job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.work_type.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.job_status === statusFilter)
    }

    if (clientFilter !== "all") {
      filtered = filtered.filter((job) => job.client_name === clientFilter)
    }

    setFilteredJobs(filtered)
  }, [searchTerm, statusFilter, clientFilter, jobs])

  const handleDeleteJob = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק עבודה זו?")) {
      try {
        const { error } = await supabase.from("jobs").delete().eq("id", id)

        if (error) throw error

        setJobs(jobs.filter((job) => job.id !== id))
      } catch (error) {
        console.error("Failed to delete job:", error)
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

  // Calculate statistics
  const totalRevenue = jobs.reduce((sum, job) => sum + (job.total_amount || 0), 0)
  const pendingJobs = jobs.filter((job) => job.job_status === "ממתין" || job.job_status === "בתהליך").length
  const urgentJobs = jobs.filter((job) => job.job_status === "דחוף").length
  const completedJobs = jobs.filter((job) => job.job_status === "הושלם").length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/jobs/new">
            <Button className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
              <Plus className="w-4 h-4 ml-2" />
              עבודה חדשה
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="font-hebrew"
          >
            {viewMode === "list" ? <Grid3X3 className="w-4 h-4 ml-2" /> : <List className="w-4 h-4 ml-2" />}
            תצוגת רשת
          </Button>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-vazana-dark font-hebrew">עבודות</h1>
          <p className="text-gray-600 font-hebrew">נהל את כל העבודות והשירותים והפרויקטים שלך</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="w-8 h-8 text-gray-400" />
              <div className="text-right">
                <p className="text-sm text-gray-600 font-hebrew">הכנסות חודשי</p>
                <p className="text-xl font-bold text-vazana-dark">₪{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div className="text-right">
                <p className="text-sm text-gray-600 font-hebrew">עבודות ממתינות</p>
                <p className="text-xl font-bold text-vazana-dark">{pendingJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div className="text-right">
                <p className="text-sm text-gray-600 font-hebrew">עבודות דחופות</p>
                <p className="text-xl font-bold text-vazana-dark">{urgentJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="text-right">
                <p className="text-sm text-gray-600 font-hebrew">סה"כ עבודות חודש</p>
                <p className="text-xl font-bold text-vazana-dark">{completedJobs}</p>
              </div>
            </div>
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
              <SelectItem value="דחוף">דחוף</SelectItem>
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
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <Truck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2 font-hebrew">לא נמצאו עבודות</p>
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
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="font-hebrew bg-transparent">
                      <Edit className="w-4 h-4 ml-1" />
                      ערוך
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-hebrew text-red-600 hover:text-red-700 bg-transparent"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      מחק
                    </Button>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-vazana-dark font-hebrew">עבודה #{job.job_number}</h3>
                    <p className="text-sm text-gray-600 font-hebrew">{job.client_name}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Job Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-gray-500 font-hebrew">תאריך</p>
                      <p className="font-medium font-hebrew">{new Date(job.job_date).toLocaleDateString("he-IL")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 font-hebrew">סוג עבודה</p>
                      <p className="font-medium font-hebrew">{job.work_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 font-hebrew">משמרת</p>
                      <p className="font-medium font-hebrew">{job.shift_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 font-hebrew">עיר</p>
                      <p className="font-medium font-hebrew">{job.city}</p>
                    </div>
                  </div>

                  {/* Location and Worker */}
                  <div className="bg-gray-50 p-3 rounded-lg text-right space-y-2">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-600 font-hebrew">{job.site}</span>
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-600 font-hebrew">{job.worker_name}</span>
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-600 font-hebrew">{job.vehicle_name}</span>
                      <Truck className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Status and Amount */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(job.job_status)}>{job.job_status}</Badge>
                      <Badge className={getPaymentStatusColor(job.payment_status)}>{job.payment_status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-vazana-dark">₪{job.total_amount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
