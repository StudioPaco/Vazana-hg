"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, FileText, Download, Eye, Edit, Calendar, DollarSign, Clock, CheckCircle, ChevronDown, ChevronUp, Briefcase, List, Grid3X3 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { StatsContainer } from "@/components/ui/stats-container"
import StatusBadge from "@/components/ui/status-badge"
import { InvoicePreviewModal } from "@/components/invoices/invoice-preview-modal"
import { exportToXLSX, exportToCSV } from "@/lib/export-utils"

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  total_amount: number
  status: string
  invoice_date: string
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
  const [clientFilter, setClientFilter] = useState("all")
  const [viewMode, setViewMode] = useState<'list' | 'table'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('vazana-invoices-viewMode') as any) || 'list'
    return 'list'
  })
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'number'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('vazana-invoices-sortBy') as any) || 'date'
    return 'date'
  })
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('vazana-invoices-sortDir') as any) || 'desc'
    return 'desc'
  })
  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'last_month'>('all')
  const [loading, setLoading] = useState(true)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [invoiceJobs, setInvoiceJobs] = useState<Record<string, JobLineItem[]>>({})
  const [allClients, setAllClients] = useState<string[]>([])
  const { toast } = useToast()

  // Sync external props with internal state
  useEffect(() => {
    setSearchTerm(externalSearchTerm)
  }, [externalSearchTerm])

  useEffect(() => {
    setStatusFilter(externalStatusFilter)
  }, [externalStatusFilter])

  // Persist sort preferences
  useEffect(() => {
    localStorage.setItem('vazana-invoices-sortBy', sortBy)
    localStorage.setItem('vazana-invoices-sortDir', sortDir)
  }, [sortBy, sortDir])

  useEffect(() => { localStorage.setItem('vazana-invoices-viewMode', viewMode) }, [viewMode])

  // Fetch all clients for the filter dropdown
  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(result => {
      const names = (result.data || []).map((c: any) => c.company_name).sort()
      setAllClients(names)
    }).catch((err) => console.error("Invoice data fetch error:", err))
  }, [])

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
          title: "שגיאה",
          description: "שגיאה בטעינת חשבוניות",
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
        (invoice.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.clients?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter)
    }

    if (clientFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.clients?.company_name === clientFilter)
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()
      let startDate: Date
      let endDate: Date

      if (dateRange === "this_month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      } else {
        // last_month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      }

      filtered = filtered.filter((invoice) => {
        const invDate = new Date(invoice.invoice_date)
        return invDate >= startDate && invDate <= endDate
      })
    }

    // Sorting
    const dir = sortDir === 'desc' ? -1 : 1
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return (new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime()) * dir
      } else if (sortBy === 'amount') {
        return (a.total_amount - b.total_amount) * dir
      } else {
        const aNum = parseInt(a.invoice_number) || 0
        const bNum = parseInt(b.invoice_number) || 0
        return (aNum - bNum) * dir
      }
    })

    setFilteredInvoices(filtered)
  }, [searchTerm, statusFilter, clientFilter, sortBy, sortDir, dateRange, invoices])

  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null)
  const [invoiceDocCounts, setInvoiceDocCounts] = useState<Record<string, number>>({})

  // Fetch document counts for invoices
  useEffect(() => {
    fetch('/api/documents?entityType=invoice').then(r => r.json()).then((docs: any[]) => {
      const counts: Record<string, number> = {}
      if (Array.isArray(docs)) docs.forEach(d => { if (d.entity_id) counts[d.entity_id] = (counts[d.entity_id] || 0) + 1 })
      setInvoiceDocCounts(counts)
    }).catch((err) => console.error("Invoice data fetch error:", err))
  }, [])

  const handlePrintInvoice = (invoice: Invoice) => {
    setPrintInvoice(invoice)
  }

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
        title: "הצלחה",
        description: "חשבונית PDF הורדה בהצלחה",
      })
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בהורדת PDF",
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
      case "cancelled":
        return "בוטל"
      default:
        return "לא ידוע"
    }
  }

  // Helper: check if invoice is overdue (must be defined before useMemo that references it)
  const isOverdue = (dueDate: string, status: string) => {
    return status !== "paid" && new Date(dueDate) < new Date()
  }

  // Calculate statistics - memoized to prevent infinite loops
  const stats = useMemo(() => {
    const totalRevenue = filteredInvoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0)

    const pendingInvoices = filteredInvoices.filter(inv => inv.status === "sent").length
    const overdueInvoices = filteredInvoices.filter(inv => isOverdue(inv.due_date, inv.status)).length
    const totalInvoicesThisMonth = filteredInvoices.filter(inv => {
      const invoiceDate = new Date(inv.invoice_date)
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

  // Unique client names for filter dropdown
  // Use allClients from separate DB fetch (not dependent on invoices existing)
  const uniqueClients = allClients

  // Total amount of filtered invoices
  const filteredTotal = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0)
  }, [filteredInvoices])

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Row 1: Button + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white font-hebrew h-9 text-sm">
            <Link href="/invoices/new">
              <Plus className="w-4 h-4 ml-1" />
              חשבונית חדשה
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const headers = [
                { key: 'invoice_number', label: 'מספר חשבונית' },
                { key: 'client_name', label: 'לקוח' },
                { key: 'issue_date', label: 'תאריך הנפקה' },
                { key: 'total_amount', label: 'סכום' },
                { key: 'status', label: 'סטטוס' },
                { key: 'notes', label: 'הערות' },
              ]
              exportToXLSX(filteredInvoices, headers, 'חשבוניות')
            }}
            className="font-hebrew text-xs h-9"
          >
            <Download className="w-4 h-4 ml-1" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const headers = [
                { key: 'invoice_number', label: 'מספר חשבונית' },
                { key: 'client_name', label: 'לקוח' },
                { key: 'issue_date', label: 'תאריך הנפקה' },
                { key: 'total_amount', label: 'סכום' },
                { key: 'status', label: 'סטטוס' },
                { key: 'notes', label: 'הערות' },
              ]
              exportToCSV(filteredInvoices, headers, 'חשבוניות')
            }}
            className="font-hebrew text-xs h-9"
          >
            <Download className="w-4 h-4 ml-1" />
            CSV
          </Button>
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {([["date", "תאריך"], ["amount", "סכום"], ["number", "מספר"]] as const).map(([key, label]) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => { if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy(key); setSortDir('desc') } }}
                className={`font-hebrew text-xs px-2 py-1 h-7 ${
                  sortBy === key ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} {sortBy === key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}
            className={`px-2 py-1 h-7 ${viewMode === 'list' ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'}`}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setViewMode('table')}
            className={`px-2 py-1 h-7 ${viewMode === 'table' ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'}`}>
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Row 2: Filters + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3" dir="rtl">
        <div className="flex flex-wrap gap-2">
          <Select value={clientFilter} onValueChange={(value) => setClientFilter(value)} dir="rtl">
            <SelectTrigger className="w-full sm:w-[160px] font-hebrew text-right h-9">
              <SelectValue placeholder="כל הלקוחות" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">כל הלקוחות</SelectItem>
              {uniqueClients.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)} dir="rtl">
            <SelectTrigger className="w-full sm:w-[140px] font-hebrew text-right h-9">
              <SelectValue placeholder="כל הסטטוסים" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="draft">טיוטה</SelectItem>
              <SelectItem value="sent">נשלח</SelectItem>
              <SelectItem value="paid">שולם</SelectItem>
              <SelectItem value="overdue">באיחור</SelectItem>
              <SelectItem value="cancelled">בוטל</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(value: 'all' | 'this_month' | 'last_month') => setDateRange(value)} dir="rtl">
            <SelectTrigger className="w-full sm:w-[140px] font-hebrew text-right h-9">
              <SelectValue placeholder="כל התקופות" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">כל התקופות</SelectItem>
              <SelectItem value="this_month">החודש הנוכחי</SelectItem>
              <SelectItem value="last_month">חודש קודם</SelectItem>
            </SelectContent>
          </Select>

          {(clientFilter !== "all" || statusFilter !== "all" || dateRange !== "all" || searchTerm) && (
            <Button variant="ghost" size="sm" onClick={() => { setClientFilter("all"); setStatusFilter("all"); setDateRange("all"); setSearchTerm("") }} className="font-hebrew text-xs text-gray-500 h-9">
              נקה סינון
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="חפש חשבוניות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right font-hebrew w-[220px] h-9 text-sm"
          />
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium mb-2">לא נמצאו חשבוניות</p>
                <p className="text-sm">
                  {searchTerm || statusFilter !== "all" || clientFilter !== "all" || dateRange !== "all"
                    ? "נסה לשנות את החיפוש או המסננים"
                    : "צור את החשבונית הראשונה שלך כדי להתחיל"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm" dir="rtl">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">מספר</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">לקוח</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">תאריך</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">פרעון</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">סכום</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">סטטוס</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium font-hebrew">
                      {invoice.invoice_number}
                      {invoiceDocCounts[invoice.id] > 0 && <a href={`/documents?filter=invoice&entityId=${invoice.id}`} className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800 mr-2"><FileText className="w-3 h-3" />{invoiceDocCounts[invoice.id]}</a>}
                    </td>
                    <td className="px-4 py-3 font-hebrew">{invoice.clients?.company_name || 'לקוח לא ידוע'}</td>
                    <td className="px-4 py-3 font-hebrew">{new Date(invoice.invoice_date).toLocaleDateString("he-IL")}</td>
                    <td className="px-4 py-3 font-hebrew">{new Date(invoice.due_date).toLocaleDateString("he-IL")}</td>
                    <td className="px-4 py-3 font-medium tabular-nums" dir="ltr">₪{Number(invoice.total_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${getStatusColor(isOverdue(invoice.due_date, invoice.status) ? "overdue" : invoice.status)} text-xs`}>
                        {getStatusInHebrew(isOverdue(invoice.due_date, invoice.status) ? "overdue" : invoice.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs font-hebrew"
                        onClick={() => handlePrintInvoice(invoice)}>תצוגה</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="px-4 py-2">
                  <div className="relative mb-4">
                    {/* Invoice info - positioned at top-right */}
                    <div className="absolute top-0 right-0 text-right">
                      <h3 className="text-lg font-bold text-gray-900">
                        חשבונית #{invoice.invoice_number}
                        {invoiceDocCounts[invoice.id] > 0 && <a href={`/documents?filter=invoice&entityId=${invoice.id}`} className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800 mr-2"><FileText className="w-3.5 h-3.5" />{invoiceDocCounts[invoice.id]}</a>}
                      </h3>
                      <p className="text-sm text-gray-600">{invoice.clients?.company_name || 'לקוח לא ידוע'}</p>
                      <Badge
                        className={getStatusColor(
                          isOverdue(invoice.due_date, invoice.status) ? "overdue" : invoice.status,
                        ) + " mt-1 text-xs"}
                      >
                        {getStatusInHebrew(isOverdue(invoice.due_date, invoice.status) ? "overdue" : invoice.status)}
                      </Badge>
                    </div>

                    {/* Preview button */}
                    <div className="absolute top-0 left-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintInvoice(invoice)}
                        className="bg-transparent border-gray-300 h-8 px-3 text-xs font-hebrew"
                      >
                        תצוגה
                      </Button>
                    </div>

                    {/* Spacer to ensure content doesn't overlap */}
                    <div className="h-8"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end">
                        <span className="mr-2 text-sm">{new Date(invoice.invoice_date).toLocaleDateString("he-IL")}</span>
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
                      <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3" dir="rtl">
                        {invoiceJobs[invoice.id] && invoiceJobs[invoice.id].length > 0 ? (
                          invoiceJobs[invoice.id].map((jobItem) => (
                            <div
                              key={jobItem.id}
                              className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-b-0 text-sm"
                            >
                              <span className="font-medium font-hebrew whitespace-nowrap">#{jobItem.jobs?.job_number || '—'}</span>
                              <span className="text-gray-500 font-hebrew">{new Date(jobItem.job_date).toLocaleDateString("he-IL")}</span>
                              <span className="text-gray-600 font-hebrew truncate">{jobItem.work_type} - {jobItem.site_location}</span>
                              {jobItem.jobs?.worker_name && <span className="text-xs text-gray-400 font-hebrew">{jobItem.jobs.worker_name}</span>}
                              <div className="mr-auto flex items-center gap-2">
                                <StatusBadge status={jobItem.jobs?.job_status || "הושלם"} type="job" size="sm" />
                                <span className="text-xs font-medium">₪{Number(jobItem.line_total || 0).toLocaleString()}</span>
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

      {/* Total amount footer */}
      {filteredInvoices.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
          <span className="text-sm text-gray-600 font-hebrew">
            {filteredInvoices.length} חשבוניות
          </span>
          <span className="text-lg font-bold text-vazana-dark font-hebrew">
            סה״כ: ₪{filteredTotal.toLocaleString()}
          </span>
        </div>
      )}

      {/* Print Modal — same as preview, fetches jobs for selected invoice */}
      {printInvoice && (
        <PrintInvoiceModal
          invoice={printInvoice}
          onClose={() => setPrintInvoice(null)}
        />
      )}
    </div>
  )
}

/** Inline print modal that reuses InvoicePreviewModal */
function PrintInvoiceModal({ invoice, onClose }: { invoice: any; onClose: () => void }) {
  const [jobs, setJobs] = useState<any[]>([])
  const [manualItems, setManualItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = (window as any).__supabase || null
    // Fetch line items via API
    fetch(`/api/invoices/${invoice.id}/line-items`).then(r => r.json()).then(result => {
      const items = result.data || []
      setJobs(items.filter((li: any) => li.job_id).map((li: any) => ({
        id: li.job_id || li.id,
        job_number: li.jobs?.job_number || 'N/A',
        work_type: li.work_type || '',
        job_date: li.job_date || '',
        site: li.site_location || '',
        city: '',
        total_amount: Number(li.line_total) || 0,
      })))
      setManualItems(items.filter((li: any) => !li.job_id).map((li: any) => ({
        description: li.description || '',
        job_date: li.job_date || '',
        unit_price: Number(li.line_total) || 0,
        work_type: li.work_type || 'ידני',
        site: li.site_location || '',
      })))
    }).catch((err) => console.error("Invoice data fetch error:", err)).finally(() => setLoading(false))
  }, [invoice.id])

  if (loading) return null

  return (
    <InvoicePreviewModal
      isOpen={true}
      onClose={onClose}
      selectedJobs={jobs}
      manualItems={manualItems}
      invoiceNumber={invoice.invoice_number}
      clientName={invoice.clients?.company_name || 'לקוח לא ידוע'}
      summary={{
        subtotal: Number(invoice.total_amount) / 1.18 || 0,
        tax_amount: Number(invoice.total_amount) - (Number(invoice.total_amount) / 1.18) || 0,
        total_amount: Number(invoice.total_amount) || 0,
      }}
      notes={invoice.notes || ''}
      paymentTerms={invoice.payment_terms || ''}
      includeBankDetails={true}
    />
  )
}
