"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Phone, Mail, MapPin, Users, Trophy, ChevronDown, ChevronUp, Edit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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
  address: string
  city: string
  security_rate: number
  installation_rate: number
  payment_method: number
  status: string
  notes: string
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [clientJobs, setClientJobs] = useState<{ [key: string]: Job[] }>({})
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [newClientModalOpen, setNewClientModalOpen] = useState(false)

  // Calculate client statistics
  const activeClientsCount = clients.filter((client) => client.status === "active").length
  const averageSecurityRate =
    clients.length > 0 ? Math.round(clients.reduce((sum, client) => sum + client.security_rate, 0) / clients.length) : 0
    
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
        console.log("[v0] Fetching clients from API...")

        const response = await fetch("/api/clients")
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const result = await response.json()
        const data = result.data || []

        console.log("[v0] Successfully fetched clients:", data)
        setClients(data)
        setFilteredClients(data)
      } catch (error) {
        console.error("[v0] Failed to load clients:", error)
        setClients([])
        setFilteredClients([])
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  useEffect(() => {
    const filtered = clients.filter(
      (client) =>
        client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.city.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredClients(filtered)
  }, [searchTerm, clients])
  
  useEffect(() => {
    if (clients.length > 0) {
      fetchClientStats()
    }
  }, [clients])

  const handleDeleteClient = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק לקוח זה?")) {
      setClients(clients.filter((client) => client.id !== id))
    }
  }

  const handleCopyClient = async (client: Client) => {
    const clientInfo = `${client.company_name}\n${client.contact_person}\n${client.phone}\n${client.email}\n${client.address}, ${client.city}`
    try {
      await navigator.clipboard.writeText(clientInfo)
      alert("פרטי הלקוח הועתקו ללוח")
    } catch (error) {
      console.error("Failed to copy client info:", error)
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
        .limit(10)

      if (error) {
        console.error("[v0] Error fetching client jobs:", error)
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
      console.error("[v0] Failed to fetch client jobs:", error)
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
        <div className="relative pb-16">
          <div className="absolute top-0 right-0">
            <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
            <p className="text-sm text-gray-600">נהל את קשרי הלקוחות שלך ומידע חשוב</p>
          </div>
          <div className="absolute top-0 left-0">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="relative pb-16">
        <div className="absolute top-0 right-0">
          <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
          <p className="text-sm text-gray-600">נהל את קשרי הלקוחות שלך ומידע חשוב</p>
        </div>
        <div className="absolute top-0 left-0">
          <Users className="h-6 w-6 text-gray-400" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatsContainer
            title="תעריף אבטחה ממוצע"
            value={`₪${averageSecurityRate}`}
            icon={Users}
            color="blue"
          />
          
          <StatsContainer
            title="לקוחות פעילים"
            value={activeClientsCount}
            icon={Users}
            color="green"
          />
          
          <StatsContainer
            title="לקוח מוביל החודש"
            value={mostActiveClient.name}
            subtitle={`${mostActiveClient.count} עבודות`}
            icon={Trophy}
            color="yellow"
          />
        </div>
        
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="חפש לקוחות (שם, איש קשר, עיר)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
              dir="rtl"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          
          <Button 
            onClick={() => setNewClientModalOpen(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            <Plus className="ml-2 h-4 w-4" />
            הוסף לקוח
          </Button>
        </div>

        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                <Plus className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium mb-2">לא נמצאו לקוחות</p>
                <p className="text-sm">
                  {searchTerm ? "נסה לשנות את מונחי החיפוש" : "הוסף את הלקוח הראשון שלך כדי להתחיל"}
                </p>
              </div>
            </CardContent>
          </Card>
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
                          {client.address}, {client.city}
                        </span>
                        <MapPin className="h-3 w-3 text-gray-500" />
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div>
                        <p className="text-xs text-gray-600">תעריף אבטחה</p>
                        <p className="font-medium text-sm">₪{client.security_rate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">תעריף התקנה</p>
                        <p className="font-medium text-sm">₪{client.installation_rate}</p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div>
                        <p className="text-xs text-gray-600">אופן תשלום (יומי)</p>
                        <p className="font-medium text-sm">{client.payment_method}</p>
                      </div>
                      {client.notes && (
                        <div>
                          <p className="text-xs text-gray-600">הערות</p>
                          <p className="text-xs text-gray-700">{client.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => toggleJobHistory(client.id)}
                      className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors py-2"
                    >
                      <span>הצג 10 עבודות אחרונות</span>
                      {expandedClient === client.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {expandedClient === client.id && (
                      <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3">
                        {clientJobs[client.id] && clientJobs[client.id].length > 0 ? (
                          clientJobs[client.id].map((job) => (
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
                          ))
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
              client.id === updatedClient.id ? updatedClient : client
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
    </div>
  )
}
