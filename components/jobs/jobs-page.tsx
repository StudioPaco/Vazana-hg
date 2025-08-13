"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Calendar, MapPin, User, Truck, Edit, Trash2, Grid3X3, List, Eye } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

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
  total_amount: string
  payment_status: string
  notes: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [loading, setLoading] = useState(true)

  // Sample data for demonstration
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
      total_amount: "900",
      payment_status: "פעיל",
      notes: "עבודה רגילה",
    },
  ]

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Use sample data for now
        setJobs(sampleJobs)
        setFilteredJobs(sampleJobs)
      } catch (error) {
        console.error("Failed to fetch jobs:", error)
        // Fallback to sample data
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
        job.worker_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.payment_status === statusFilter)
    }

    setFilteredJobs(filtered)
  }, [searchTerm, statusFilter, jobs])

  const handleDeleteJob = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק עבודה זו?")) {
      try {
        await apiClient.deleteJob(id)
        setJobs(jobs.filter((job) => job.id !== id))
      } catch (error) {
        console.error("Failed to delete job:", error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "שולם":
      case "הושלם":
        return "bg-green-100 text-green-800"
      case "פעיל":
      case "בתהליך":
        return "bg-vazana-teal/20 text-vazana-teal"
      case "ממתין":
        return "bg-yellow-100 text-yellow-800"
      case "מאוחר":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="font-hebrew"
          >
            {viewMode === "list" ? <Grid3X3 className="w-4 h-4 ml-2" /> : <List className="w-4 h-4 ml-2" />}
            {viewMode === "list" ? "תצוגת רשת" : "תצוגת רשימה"}
          </Button>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-vazana-dark font-hebrew">עבודות</h1>
          <p className="text-gray-600 font-hebrew">נהל את קשרי הלקוחות ואנשי הקשר שלך</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-right">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-hebrew">לקוחות לא פעילים</p>
              <p className="text-xl font-bold text-vazana-dark">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 text-right">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 bg-vazana-teal/20 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-vazana-teal" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-hebrew">לקוחות פעילים</p>
              <p className="text-xl font-bold text-vazana-dark">{filteredJobs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 text-right">
          <div className="flex items-center justify-between">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="חפש לקוחות (שם, אימ' קשר, דואל)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 shadow-none text-right font-hebrew"
            />
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <Truck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2 font-hebrew">טרם הוקמו עבודות</p>
              <p className="text-sm font-hebrew">
                {searchTerm || statusFilter !== "all"
                  ? "נסה לשנות את החיפוש או המסננים"
                  : "התחל על ידי הפקת חשבונית או קבלה"}
              </p>
              <Button className="mt-4 bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew" asChild>
                <Link href="/jobs/new">
                  <Plus className="ml-2 h-4 w-4" />
                  הפק חשבונית ראשונה
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="font-hebrew bg-transparent">
                        <Edit className="w-4 h-4 ml-1" />
                        ערוך
                      </Button>
                      <Button variant="outline" size="sm" className="font-hebrew bg-transparent">
                        <Trash2 className="w-4 h-4 ml-1" />
                        הסתר
                      </Button>
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-vazana-dark font-hebrew">{job.client_name}</h3>
                      <p className="text-sm text-gray-600 font-hebrew">{job.worker_name}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-50 p-4 rounded-lg text-right space-y-2">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-600 font-hebrew">052-5110001</span>
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-600 font-hebrew">shift/₪{job.total_amount}</span>
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-600 font-hebrew">shift/₪{job.total_amount}</span>
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Status and Details */}
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(job.payment_status)} dir="rtl">
                      {job.payment_status}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-hebrew">מועדים שקל לפי חודש</p>
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
