"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, FileText, Download, Eye, Edit, Calendar, DollarSign, Clock, CheckCircle, ChevronDown, ChevronUp, Briefcase } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { StatsContainer } from "@/components/ui/stats-container"
import StatusBadge from "@/components/ui/status-badge"

interface Invoice {
  id: string
  receipt_number: string
  client_id: string
  total_amount: number
  status: string
  issue_date: string
  due_date: string
  notes: string
  clients: {
    company_name: string
    contact_person: string
    email: string
  }
}

interface JobLineItem {
  id: string
  job_id: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
  work_type: string
  job_date: string
  site_location: string
  jobs?: {
    job_number: string
    job_status: string
    worker_name?: string
    shift_type?: string
  }
}

interface InvoicesPageProps {
  showHeader?: boolean
  showFilters?: boolean
  searchTerm?: string
  statusFilter?: string
  onStatsCalculated?: (stats: {
    totalRevenue: number
    pendingInvoices: number
    overdueInvoices: number
    totalInvoicesThisMonth: number
  }) => void
}

export default function InvoicesPage({ 
  showHeader = true, 
  showFilters = true, 
  searchTerm: externalSearchTerm = "", 
  statusFilter: externalStatusFilter = "all", 
  onStatsCalculated 
}: InvoicesPageProps) {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm)
  const [statusFilter, setStatusFilter] = useState(externalStatusFilter)
  const [loading, setLoading] = useState(true)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [invoiceJobs, setInvoiceJobs] = useState<Record<string, JobLineItem[]>>({})
  const { toast } = useToast()

  // Sync external props with internal state
  useEffect(() => {
    setSearchTerm(externalSearchTerm)
  }, [externalSearchTerm])

  useEffect(() => {
    setStatusFilter(externalStatusFilter)
  }, [externalStatusFilter])

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/invoices")
        if (!response.ok) throw new Error("Failed to fetch invoices")

        const result = await response.json()
        setInvoices(result.data || [])
        setFilteredInvoices(result.data || [])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch invoices",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [toast])

  useEffect(() => {
    let filtered = invoices.filter(
      (invoice) =>
        invoice.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clients.company_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }, [searchTerm, statusFilter, invoices])

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (!response.ok) throw new Error("Failed to generate PDF")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusInHebrew = (status: string) => {
    switch (status) {
      case "paid":
        return "שולם"
      case "sent":
        return "נשלח"
      case "overdue":
        return "באיחור"
      case "draft":
        return "טיוטה"
      default:
        return "לא ידוע"
    }
  }
  
  // Calculate statistics - memoized to prevent infinite loops
  const stats = useMemo(() => {
    const totalRevenue = filteredInvoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total_amount, 0)
    
    const pendingInvoices = filteredInvoices.filter(inv => inv.status === "sent").length
    const overdueInvoices = filteredInvoices.filter(inv => isOverdue(inv.due_date, inv.status)).length
    const totalInvoicesThisMonth = filteredInvoices.filter(inv => {
      const invoiceDate = new Date(inv.issue_date)
      const now = new Date()
      return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear()
    }).length

    return {
      totalRevenue,
      pendingInvoices,
      overdueInvoices,
      totalInvoicesThisMonth
    }
  }, [filteredInvoices])

  // Call stats callback when stats change - using memoized stats
  useEffect(() => {
    if (onStatsCalculated && !loading) {
      onStatsCalculated(stats)
    }
  }, [stats, loading, onStatsCalculated])

  const isOverdue = (dueDate: string, status: string) => {
    return status !== "paid" && new Date(dueDate) < new Date()
  }

  const toggleJobHistory = async (invoiceId: string) => {
    if (expandedInvoice === invoiceId) {
      setExpandedInvoice(null)
      return
    }

    setExpandedInvoice(invoiceId)

    // Fetch jobs for this invoice if not already loaded
    if (!invoiceJobs[invoiceId]) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/line-items`)
        if (!response.ok) throw new Error('Failed to fetch invoice line items')
        
        const result = await response.json()
        const jobs = result.data || []
        
        setInvoiceJobs(prev => ({
          ...prev,
          [invoiceId]: jobs
        }))
      } catch (error) {
        console.error('Failed to fetch invoice jobs:', error)
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת פרטי העבודות",
          variant: "destructive",
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        {showHeader && (
          <div className="relative pb-16">
            <div className="absolute top-0 right-0">
              <h1 className="text-2xl font-bold text-gray-900">חשבוניות</h1>
              <p className="text-sm text-gray-600">נהל ועקב אחר חשבוניות וחיובים</p>
            </div>
            <div className="absolute top-0 left-0">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
          </div>
        )}
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <div className="space-y-6" dir="rtl">
      {showHeader && (
        <div className="relative pb-16">
          <div className="absolute top-0 right-0 text-right z-10">
            <h1 className="text-2xl font-bold text-vazana-dark font-hebrew">ארכיון חשבוניות</h1>
            <p className="text-gray-600 font-hebrew">עקב אחר חשבוניות שהונפקו וסטטוס התשלומים</p>
          </div>
          
          <div className="absolute top-0 left-0 z-10">
            <FileText className="w-8 h-8 text-vazana-teal" />
          </div>
        </div>
      )}
        
      {showHeader && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsContainer
            title="הכנסות חודשיות"
            value={`₪${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="green"
          />
          
          <StatsContainer
            title="חשבוניות ממתינות"
            value={stats.pendingInvoices}
            icon={Clock}
            color="yellow"
          />
          
          <StatsContainer
            title="חשבוניות באיחור"
            value={stats.overdueInvoices}
            icon={Calendar}
            color="red"
          />
          
          <StatsContainer
            title="סה״כ חשבוניות חודש"
            value={stats.totalInvoicesThisMonth}
            icon={CheckCircle}
            color="blue"
          />
        </div>
      )}
        
      {showFilters && (
        <div className="flex items-center gap-4 mb-6">
          {/* Search and Filter - adjacent to each other */}
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="חפש חשבוניות (מספר, לקוח)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
              dir="rtl"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)} dir="rtl">
            <SelectTrigger className="w-48 text-right">
              <SelectValue placeholder="סנן לפי סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="draft">טיוטה</SelectItem>
              <SelectItem value="sent">נשלח</SelectItem>
              <SelectItem value="paid">שולם</SelectItem>
              <SelectItem value="overdue">באיחור</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium mb-2">לא נמצאו חשבוניות</p>
                <p className="text-sm">
                  {searchTerm || statusFilter !== "all"
                    ? "נסה לשנות את מונחי החיפוש או המסננים"
                    : "צור את החשבונית הראשונה שלך כדי להתחיל"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="px-4 py-2">
                  <div className="relative mb-4">
                    {/* Invoice info - positioned at top-right */}
                    <div className="absolute top-0 right-0 text-right">
                      <h3 className="text-lg font-bold text-gray-900">חשבונית #{invoice.receipt_number}</h3>
                      <p className="text-sm text-gray-600">{invoice.clients.company_name}</p>
                      <Badge
                        className={getStatusColor(
                          isOverdue(invoice.due_date, invoice.status) ? "overdue" : invoice.status,
                        ) + " mt-1 text-xs"}
                      >
                        {getStatusInHebrew(isOverdue(invoice.due_date, invoice.status) ? "overdue" : invoice.status)}
                      </Badge>
                    </div>

                    {/* Action buttons - positioned at top-left */}
                    <div className="absolute top-0 left-0 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(invoice.id, invoice.receipt_number)}
                        className="bg-transparent border-gray-300 h-8 px-3 text-xs"
                      >
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" asChild className="bg-transparent border-gray-300 h-8 px-3 text-xs">
                        <Link href={`/invoices/${invoice.id}`}>
                          צפייה
                        </Link>
                      </Button>
                    </div>

                    {/* Spacer to ensure content doesn't overlap */}
                    <div className="h-8"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end">
                        <span className="mr-2 text-sm">{new Date(invoice.issue_date).toLocaleDateString("he-IL")}</span>
                        <Calendar className="h-3 w-3 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-600">תאריך הפקה</p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end">
                        <span className="mr-2 text-sm">{new Date(invoice.due_date).toLocaleDateString("he-IL")}</span>
                        <Calendar className="h-3 w-3 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-600">תאריך פרעון</p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="font-bold text-lg text-vazana-dark">₪{invoice.total_amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">סכום כולל</p>
                    </div>
                  </div>
                  
                  {invoice.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded text-right">
                      <p className="text-xs text-gray-600">הערות:</p>
                      <p className="text-sm text-gray-700">{invoice.notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => toggleJobHistory(invoice.id)}
                      className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors py-2"
                    >
                      <span>הצג עבודות בחשבונית זו</span>
                      {expandedInvoice === invoice.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {expandedInvoice === invoice.id && (
                      <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3">
                        {invoiceJobs[invoice.id] && invoiceJobs[invoice.id].length > 0 ? (
                          invoiceJobs[invoice.id].map((jobItem) => (
                            <div
                              key={jobItem.id}
                              className="flex justify-between items-start py-3 border-b border-gray-200 last:border-b-0"
                            >
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                  <StatusBadge 
                                    status={jobItem.jobs?.job_status || "הושלם"}
                                    type="job"
                                    size="sm"
                                  />
                                  <span className="text-xs text-gray-500">סכום: ₪{jobItem.line_total.toLocaleString()}</span>
                                </div>
                                {jobItem.jobs?.worker_name && (
                                  <span className="text-xs text-gray-500">עובד: {jobItem.jobs.worker_name}</span>
                                )}
                                {jobItem.jobs?.shift_type && (
                                  <span className="text-xs text-gray-500">משמרת: {jobItem.jobs.shift_type}</span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">עבודה #{jobItem.jobs?.job_number || 'N/A'}</p>
                                <p className="text-xs text-gray-600">
                                  {jobItem.work_type} - {jobItem.site_location}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(jobItem.job_date).toLocaleDateString("he-IL")}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  כמות: {jobItem.quantity} × ₪{jobItem.unit_price.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-sm text-gray-500 py-4">טוען עבודות...</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
      )}
    </div>
  )
}
