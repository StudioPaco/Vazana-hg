"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Phone, Mail, MapPin, Users, Trophy } from "lucide-react"
import Link from "next/link"

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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  const activeClientsCount = clients.filter((client) => client.status === "active").length
  const getMostActiveClient = () => {
    const clientJobCounts = {
      "1": 8, // אדהם עבודות פיתוח
      "2": 5, // אלקים סימון בבשים
      "3": 3, // דברים זוהרים
    }

    let mostActiveClient = null
    let maxJobs = 0

    clients.forEach((client) => {
      const jobCount = clientJobCounts[client.id] || 0
      if (jobCount > maxJobs) {
        maxJobs = jobCount
        mostActiveClient = { name: client.company_name, count: jobCount }
      }
    })

    return mostActiveClient || { name: "אין נתונים", count: 0 }
  }

  const mostActiveClient = getMostActiveClient()
  const averageSecurityRate =
    clients.length > 0 ? Math.round(clients.reduce((sum, client) => sum + client.security_rate, 0) / clients.length) : 0

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const sampleClients: Client[] = [
          {
            id: "1",
            company_name: "אדהם עבודות פיתוח",
            contact_person: "אדהם כהן",
            phone: "052-5110001",
            email: "adam@example.com",
            address: "רחוב הרצל 15",
            city: "תל אביב",
            security_rate: 150,
            installation_rate: 200,
            payment_method: 30,
            status: "active",
            notes: "לקוח VIP",
          },
          {
            id: "2",
            company_name: "אלקים סימון בבשים",
            contact_person: "משה לוי",
            phone: "054-7890123",
            email: "moshe@example.com",
            address: "שדרות רוטשילד 25",
            city: "תל אביב",
            security_rate: 140,
            installation_rate: 180,
            payment_method: 15,
            status: "active",
            notes: "",
          },
          {
            id: "3",
            company_name: "דברים זוהרים",
            contact_person: "שרה כהן",
            phone: "050-1234567",
            email: "sarah@example.com",
            address: "רחוב דיזנגוף 100",
            city: "תל אביב",
            security_rate: 160,
            installation_rate: 220,
            payment_method: 45,
            status: "active",
            notes: "לקוח חדש",
          },
        ]

        console.log("[v0] Using sample clients data:", sampleClients)
        setClients(sampleClients)
        setFilteredClients(sampleClients)
      } catch (error) {
        console.error("[v0] Failed to load clients:", error)
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

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="relative">
          <div className="absolute top-0 right-0">
            <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
            <p className="text-sm text-gray-600">נהל את קשרי הלקוחות שלך ומידע חשוב</p>
          </div>
          <div className="absolute top-0 left-0">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <div className="pt-16 animate-pulse space-y-6">
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
    <div className="p-6 space-y-6" dir="rtl">
      <div className="relative pb-4">
        <div className="absolute top-0 right-0">
          <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
          <p className="text-sm text-gray-600">נהל את קשרי הלקוחות שלך ומידע חשוב</p>
        </div>
        <div className="absolute top-0 left-0">
          <Users className="h-6 w-6 text-gray-400" />
        </div>
      </div>

      <div className="pt-12 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-gray-600">תעריף אבטחה ממוצע</p>
                  <p className="text-2xl font-bold">₪{averageSecurityRate}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-gray-600">לקוחות פעילים</p>
                  <p className="text-2xl font-bold">{activeClientsCount}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-gray-600">לקוח מוביל החודש</p>
                  <p className="text-lg font-bold truncate">{mostActiveClient.name}</p>
                  <p className="text-sm text-gray-500">{mostActiveClient.count} עבודות</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <Input
              placeholder="חפש לקוחות (שם, איש קשר, עיר)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right h-full"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
        </div>

        <div className="flex justify-start">
          <Button asChild className="bg-vazana-teal hover:bg-vazana-teal/90 text-white">
            <Link href="/clients/new">
              <Plus className="ml-2 h-4 w-4" />
              הוסף לקוח
            </Link>
          </Button>
        </div>

        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-gray-500">
                <Plus className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                <p className="text-base font-medium mb-1">לא נמצאו לקוחות</p>
                <p className="text-sm">
                  {searchTerm ? "נסה לשנות את מונחי החיפוש" : "הוסף את הלקוח הראשון שלך כדי להתחיל"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyClient(client)}
                        className="bg-transparent border-gray-300 text-xs px-2 py-1 h-7"
                      >
                        העתק
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="bg-transparent border-gray-300 text-xs px-2 py-1 h-7"
                      >
                        <Link href={`/clients/${client.id}/edit`}>ערוך</Link>
                      </Button>
                    </div>

                    <div className="text-right">
                      <h3 className="text-base font-bold text-gray-900">{client.company_name}</h3>
                      <p className="text-sm text-gray-600">{client.contact_person}</p>
                      <Badge variant={client.status === "active" ? "default" : "secondary"} className="mt-1 text-xs">
                        {client.status === "active" ? "פעיל" : "לא פעיל"}
                      </Badge>
                    </div>
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

                    <div className="text-right">
                      <p className="text-gray-600 text-xs mb-1">תעריף אבטחה</p>
                      <p className="font-medium text-sm mb-2">₪{client.security_rate}</p>
                      <p className="text-gray-600 text-xs mb-1">תעריף התקנה</p>
                      <p className="font-medium text-sm">₪{client.installation_rate}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-gray-600 text-xs mb-1">תשלום (יומי)</p>
                      <p className="font-medium text-sm">{client.payment_method}</p>
                      {client.notes && (
                        <div className="mt-2">
                          <p className="text-gray-600 text-xs mb-1">הערות</p>
                          <p className="text-xs text-gray-700">{client.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center">מציגים שירי כל 10 החודש</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
