"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Phone, Mail, MapPin, Users, Trophy, ChevronDown, ChevronUp, Edit, Trash2, Copy, ArrowUpDown, Filter, Grid3X3, List, Download, Briefcase } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import ClientEditModal from "@/components/clients/client-edit-modal"
import NewClientModal from "@/components/clients/new-client-modal"
import StatusBadge from "@/components/ui/status-badge"
import { StatsContainer } from "@/components/ui/stats-container"

interface Client {
  id: string
  company_name: string
  contact_person: string
  phone: string
  email: string
  address?: string
  city?: string
  security_rate?: number
  installation_rate?: number
  payment_method?: string
  status?: string
  notes?: string
}

interface Job {
  id: string
  job_number: string
  work_type: string
  job_date: string
  site: string
  payment_status: string
  job_status?: string
}

interface ClientsPageProps {
  showHeader?: boolean
  searchTerm?: string
  onStatsCalculated?: (stats: {
    averageSecurityRate: number
    activeClientsCount: number
    mostActiveClient: { name: string; count: number }
  }) => void
}

export default function ClientsPage({ showHeader = true, searchTerm: externalSearchTerm = "", onStatsCalculated }: ClientsPageProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm)
  const [statusFilter, setStatusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name')
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list')
  const [loading, setLoading] = useState(true)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [clientJobs, setClientJobs] = useState<{ [key: string]: Job[] }>({})
  const [jobsPerPage, setJobsPerPage] = useState(5)
  const [jobPage, setJobPage] = useState<{ [key: string]: number }>({})
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [newClientModalOpen, setNewClientModalOpen] = useState(false)

  // Calculate client statistics
  const activeClientsCount = clients.filter((client) => client.status === "active").length
  const averageSecurityRate =
    clients.length > 0 ? Math.round(clients.reduce((sum, client) => sum + (client.security_rate || 0), 0) / clients.length) : 0

  const [realClientStats, setRealClientStats] = useState<{[key: string]: number}>({})
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  const getMostActiveClient = () => {
    let mostActiveClient = null
    let maxJobs = 0

    clients.forEach((client) => {
      const jobCount = realClientStats[client.id] || 0
      if (jobCount > maxJobs) {
        maxJobs = jobCount
        mostActiveClient = { name: client.company_name, count: jobCount }
      }
    })

    return mostActiveClient || { name: "אין נתונים", count: 0 }
  }

  const fetchClientStats = async () => {
    if (clients.length === 0 || isLoadingStats) return

    setIsLoadingStats(true)
    try {
      const supabase = createClient()
      const statsPromises = clients.map(async (client) => {
        const { data, error } = await supabase
          .from("jobs")
          .select("id")
          .eq("client_id", client.id)

        return {
          clientId: client.id,
          count: error ? 0 : (data?.length || 0)
        }
      })

      const results = await Promise.all(statsPromises)
      const statsMap = results.reduce((acc, result) => {
        acc[result.clientId] = result.count
        return acc
      }, {} as {[key: string]: number})

      setRealClientStats(statsMap)
    } catch (error) {
      console.error("Failed to fetch client stats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const mostActiveClient = getMostActiveClient()

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients")

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const result = await response.json()
        const data = result.data || []

        setClients(data)
        setFilteredClients(data)
      } catch (error) {
        console.error("Failed to load clients:", error)
        setClients([])
        setFilteredClients([])
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Sync external search term with internal state
  useEffect(() => {
    setSearchTerm(externalSearchTerm)
  }, [externalSearchTerm])

  // Derive unique cities for the city filter dropdown
  const uniqueCities = useMemo(() => {
    const cities = clients
      .map(c => c.city)
      .filter((city): city is string => !!city && city.trim() !== '')
    return Array.from(new Set(cities)).sort()
  }, [clients])

  useEffect(() => {
    let filtered = clients.filter(
      (client) =>
        client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.city || '').toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.status === statusFilter)
    }

    // City filter
    if (cityFilter !== "all") {
      filtered = filtered.filter((client) => client.city === cityFilter)
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.company_name.localeCompare(b.company_name, 'he')
      } else {
        // Sort by id as proxy for date added (newest first)
        return b.id.localeCompare(a.id)
      }
    })

    setFilteredClients(filtered)
  }, [searchTerm, statusFilter, cityFilter, sortBy, clients])

  useEffect(() => {
    if (clients.length > 0) {
      fetchClientStats()
    }
  }, [clients])

  // Call stats callback when stats change - using useMemo to prevent infinite loops
  const statsData = useMemo(() => {
    const mostActive = getMostActiveClient()
    return {
      averageSecurityRate,
      activeClientsCount,
      mostActiveClient: mostActive
    }
  }, [averageSecurityRate, activeClientsCount, realClientStats])

  useEffect(() => {
    if (onStatsCalculated && !loading && statsData) {
      onStatsCalculated(statsData)
    }
  }, [statsData, loading, onStatsCalculated])

  const handleDeleteClient = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק לקוח זה?")) {
      try {
        const response = await fetch(`/api/clients/${id}`, { method: "DELETE" })
        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || "Failed to delete client")
        }
        setClients(clients.filter((client) => client.id !== id))
      } catch (error) {
        console.error("Failed to delete client:", error)
        toast({ title: "שגיאה במחיקת הלקוח. נסה שוב.", variant: "destructive" })
      }
    }
  }

  const handleCopyClient = async (client: Client) => {
    const addressInfo = [client.address, client.city].filter(Boolean).join(', ')
    const clientInfo = `${client.company_name}\n${client.contact_person}\n${client.phone}\n${client.email}${addressInfo ? `\n${addressInfo}` : ''}`
    try {
      await navigator.clipboard.writeText(clientInfo)
      toast({ title: "פרטי הלקוח הועתקו ללוח", variant: "success" })
    } catch (error) {
      console.error("Failed to copy client info:", error)
    }
  }

  const handleExportCSV = async () => {
    const headers = ["שם חברה", "איש קשר", "טלפון", "אימייל", "כתובת", "עיר", "תעריף אבטחה", "תעריף התקנה", "אופן תשלום", "סטטוס", "מספר עבודות"]
    const paymentMethodMap: Record<string, string> = {
      '1': 'מיידי', '2': 'שוטף +15', '3': 'שוטף +30', '4': 'שוטף +60', '5': 'שוטף +90'
    }
    const rows = filteredClients.map(c => [
      c.company_name,
      c.contact_person,
      c.phone,
      c.email,
      c.address || '',
      c.city || '',
      String(c.security_rate || 0),
      String(c.installation_rate || 0),
      paymentMethodMap[String(c.payment_method)] || c.payment_method || '',
      c.status === 'active' ? 'פעיל' : 'לא פעיל',
      String(realClientStats[c.id] || 0),
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    try {
      await navigator.clipboard.writeText(csvContent)
      toast({ title: `נתוני ${filteredClients.length} לקוחות הועתקו ללוח כ-CSV`, variant: "success" })
    } catch (error) {
      console.error("Failed to copy CSV:", error)
    }
  }

  // Note: Job statuses are now managed solely through database values

  const fetchClientJobs = async (clientId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("jobs")
        .select("id, job_number, work_type, job_date, site, payment_status, job_status")
        .eq("client_id", clientId)
        .order("job_date", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Error fetching client jobs:", error)
        setClientJobs((prev) => ({ ...prev, [clientId]: [] }))
        return
      }

      if (data) {
        // Use job_status directly from database (should be auto-calculated)
        const jobsWithStatus = data.map(job => ({
          ...job,
          job_status: job.job_status || 'ממתין' // Default to waiting if missing
        }))
        setClientJobs((prev) => ({ ...prev, [clientId]: jobsWithStatus }))
      }
    } catch (error) {
      console.error("Failed to fetch client jobs:", error)
    }
  }

  const toggleJobHistory = async (clientId: string) => {
    if (expandedClient === clientId) {
      setExpandedClient(null)
    } else {
      setExpandedClient(clientId)
      if (!clientJobs[clientId]) {
        await fetchClientJobs(clientId)
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toolbar -- always visible */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setNewClientModalOpen(true)}
            className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
          >
            <Plus className="w-4 h-4 ml-2" />
            לקוח חדש
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="font-hebrew text-xs"
          >
            <Download className="w-4 h-4 ml-1" />
            ייצוא CSV
          </Button>

          {/* Sorting Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy('name')}
              className={`font-hebrew text-xs px-3 py-1 transition-colors ${
                sortBy === 'name'
                  ? 'bg-teal-500 text-white hover:bg-teal-600'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              שם
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
              תאריך הוספה
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={`px-2 py-1 transition-colors ${
              viewMode === 'list'
                ? 'bg-teal-500 text-white hover:bg-teal-600'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('table')}
            className={`px-2 py-1 transition-colors ${
              viewMode === 'table'
                ? 'bg-teal-500 text-white hover:bg-teal-600'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] font-hebrew">
              <SelectValue placeholder="כל הסטטוסים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="active">פעיל</SelectItem>
              <SelectItem value="inactive">לא פעיל</SelectItem>
            </SelectContent>
          </Select>

          {uniqueCities.length > 0 && (
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full sm:w-[160px] font-hebrew">
                <SelectValue placeholder="כל הערים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הערים</SelectItem>
                {uniqueCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="חפש לקוחות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right font-hebrew w-full sm:w-[300px]"
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <Plus className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2">לא נמצאו לקוחות</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== "all" || cityFilter !== "all"
                  ? "נסה לשנות את החיפוש או המסננים"
                  : "הוסף את הלקוח הראשון שלך כדי להתחיל"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm" dir="rtl">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">שם חברה</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">איש קשר</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">טלפון</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">עיר</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">סטטוס</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">עבודות</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 font-hebrew">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{client.company_name}</td>
                    <td className="px-4 py-3 text-gray-600">{client.contact_person}</td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">{client.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{client.city || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-xs">
                        {client.status === "active" ? "פעיל" : "לא פעיל"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{realClientStats[client.id] || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => { setEditingClient(client); setEditModalOpen(true) }}>ערוך</Button>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleCopyClient(client)}>העתק</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="px-4 py-2">
                <div className="relative mb-4">
                  {/* Client name and info - positioned at top-right */}
                  <div className="absolute top-0 right-0 text-right">
                    <h3 className="text-lg font-bold text-gray-900">{client.company_name}</h3>
                    <p className="text-sm text-gray-600">{client.contact_person}</p>
                    <Badge variant={client.status === "active" ? "default" : "secondary"} className="mt-1 text-xs">
                      {client.status === "active" ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </div>

                  {/* Action buttons - positioned at top-left */}
                  <div className="absolute top-0 left-0 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyClient(client)}
                      className="bg-transparent border-gray-300 h-8 px-3 text-xs"
                    >
                      העתק
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="bg-transparent border-gray-300 h-8 px-3 text-xs"
                    >
                      <span
                        onClick={() => {
                          setEditingClient(client)
                          setEditModalOpen(true)
                        }}
                      >
                        ערוך
                      </span>
                    </Button>
                  </div>

                  {/* Spacer to ensure content doesn't overlap */}
                  <div className="h-8"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-end">
                      <span className="mr-2 text-sm">{client.phone}</span>
                      <Phone className="h-3 w-3 text-gray-500" />
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="mr-2 text-sm">{client.email}</span>
                      <Mail className="h-3 w-3 text-gray-500" />
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="mr-2 text-sm">
                        {[client.address, client.city].filter(Boolean).join(', ') || 'לא הוגדר'}
                      </span>
                      <MapPin className="h-3 w-3 text-gray-500" />
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div>
                      <p className="text-xs text-gray-600">תעריף אבטחה</p>
                      <p className="font-medium text-sm">₪{client.security_rate || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">תעריף התקנה</p>
                      <p className="font-medium text-sm">₪{client.installation_rate || 0}</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div>
                      <p className="text-xs text-gray-600">אופן תשלום</p>
                      <p className="font-medium text-sm">{{
                        '1': 'מיידי', '2': 'שוטף +15', '3': 'שוטף +30', '4': 'שוטף +60', '5': 'שוטף +90'
                      }[String(client.payment_method)] || client.payment_method || 'לא הוגדר'}</p>
                    </div>
                    {client.notes && (
                      <div>
                        <p className="text-xs text-gray-600">הערות</p>
                        <p className="text-xs text-gray-700">{client.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      toggleJobHistory(client.id)
                      if (expandedClient !== client.id) {
                        setJobPage(prev => ({ ...prev, [client.id]: 0 }))
                      }
                    }}
                    className="w-full flex items-center justify-center gap-3 text-sm text-gray-600 hover:text-gray-800 transition-colors py-1"
                  >
                    <div className="flex items-center gap-2">
                      {realClientStats[client.id] > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Briefcase className="w-3 h-3" />
                          {realClientStats[client.id]}
                        </Badge>
                      )}
                      {expandedClient === client.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-hebrew">הצג עבודות אחרונות</span>
                      {expandedClient === client.id && (
                        <select
                          value={jobsPerPage}
                          onChange={(e) => {
                            e.stopPropagation()
                            setJobsPerPage(Number(e.target.value))
                            setJobPage(prev => ({ ...prev, [client.id]: 0 }))
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs border rounded px-1 py-0.5 font-hebrew"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                        </select>
                      )}
                    </div>
                  </button>

                  {expandedClient === client.id && (
                    <div className="mt-2 space-y-2 bg-gray-50 rounded-lg p-3">
                      {clientJobs[client.id] && clientJobs[client.id].length > 0 ? (
                        <>
                          {clientJobs[client.id]
                            .slice(
                              (jobPage[client.id] || 0) * jobsPerPage,
                              ((jobPage[client.id] || 0) + 1) * jobsPerPage
                            )
                            .map((job) => (
                            <div
                              key={job.id}
                              className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                            >
                              <StatusBadge
                                status={job.job_status || "ממתין"}
                                type="job"
                                size="sm"
                              />
                              <div className="text-right">
                                <p className="font-medium text-sm">עבודה #{job.job_number}</p>
                                <p className="text-xs text-gray-600">
                                  {job.work_type} - {job.site}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(job.job_date).toLocaleDateString("he-IL")}
                                </p>
                              </div>
                            </div>
                          ))}
                          {/* Pagination */}
                          {clientJobs[client.id].length > jobsPerPage && (
                            <div className="flex items-center justify-center gap-2 pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={(jobPage[client.id] || 0) === 0}
                                onClick={() => setJobPage(prev => ({ ...prev, [client.id]: (prev[client.id] || 0) - 1 }))}
                                className="text-xs font-hebrew"
                              >
                                הקודם
                              </Button>
                              <span className="text-xs text-gray-500 font-hebrew">
                                {(jobPage[client.id] || 0) + 1} / {Math.ceil(clientJobs[client.id].length / jobsPerPage)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={((jobPage[client.id] || 0) + 1) * jobsPerPage >= clientJobs[client.id].length}
                                onClick={() => setJobPage(prev => ({ ...prev, [client.id]: (prev[client.id] || 0) + 1 }))}
                                className="text-xs font-hebrew"
                              >
                                הבא
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-center text-sm text-gray-500 py-4">אין עבודות קודמות</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientEditModal
        client={editingClient}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onClientUpdated={(updatedClient) => {
          setClients(clients.map(client =>
            client.id === updatedClient.id ? { ...client, ...updatedClient } : client
          ))
          setEditingClient(null)
        }}
      />

      <NewClientModal
        open={newClientModalOpen}
        onOpenChange={setNewClientModalOpen}
        onClientCreated={(newClient) => {
          setClients([newClient, ...clients])
          setFilteredClients([newClient, ...filteredClients])
        }}
      />
    </div>
  )
}
