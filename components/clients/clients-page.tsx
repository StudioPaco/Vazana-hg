"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Phone, Mail, MapPin, Edit, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

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
  is_sample?: boolean
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const supabase = createClient()

        const { data, error } = await supabase.from("clients").select("*").order("created_date", { ascending: false })

        if (error) {
          console.error("[v0] Supabase error:", error)
          setError(`שגיאה בטעינת לקוחות: ${error.message}`)
          return
        }

        console.log("[v0] Fetched clients from database:", data)

        if (!data || data.length === 0) {
          console.log("[v0] No clients found in database")
          setError("לא נמצאו לקוחות במסד הנתונים")
        }

        setClients(data || [])
        setFilteredClients(data || [])
        setError(null)
      } catch (error) {
        console.error("[v0] Failed to fetch clients:", error)
        setError("שגיאה בחיבור למסד הנתונים")
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
      try {
        const supabase = createClient()
        const { error } = await supabase.from("clients").delete().eq("id", id)

        if (error) {
          console.error("Supabase delete error:", error)
          return
        }

        setClients(clients.filter((client) => client.id !== id))
      } catch (error) {
        console.error("Failed to delete client:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 dir-rtl relative">
        <div className="absolute top-0 right-0">
          <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
        </div>
        <div className="absolute top-0 left-0">
          <Users className="h-6 w-6 text-gray-400" />
        </div>

        <div className="pt-12 animate-pulse space-y-6">
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
    <div className="p-6 space-y-6 dir-rtl relative">
      <div className="absolute top-0 right-0">
        <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
        <p className="text-sm text-gray-600">נהל את קשרי הלקוחות שלך ומידע חשוב</p>
      </div>
      <div className="absolute top-0 left-0">
        <Users className="h-6 w-6 text-gray-400" />
      </div>

      <div className="pt-16 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black">
            <Link href="/clients/new">
              <Plus className="ml-2 h-4 w-4" />
              הוסף לקוח
            </Link>
          </Button>
        </div>

        <div className="relative max-w-md mr-auto">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חפש לקוחות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right"
          />
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="text-center py-6">
              <p className="text-red-600">{error}</p>
              <Button variant="outline" className="mt-2 bg-transparent" onClick={() => window.location.reload()}>
                נסה שוב
              </Button>
            </CardContent>
          </Card>
        )}

        {!error && filteredClients.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow relative">
                <CardHeader className="relative">
                  <div className="absolute top-4 right-4">
                    <CardTitle className="text-lg text-right">{client.company_name}</CardTitle>
                    <CardDescription className="text-right">{client.contact_person}</CardDescription>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge variant={client.status === "active" ? "default" : "secondary"}>
                      {client.status === "active" ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-16">
                  {client.phone && (
                    <div className="flex items-center text-sm text-gray-600 justify-end">
                      <span className="mr-2">{client.phone}</span>
                      <Phone className="h-4 w-4" />
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center text-sm text-gray-600 justify-end">
                      <span className="mr-2">{client.email}</span>
                      <Mail className="h-4 w-4" />
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center text-sm text-gray-600 justify-end">
                      <span className="mr-2">
                        {client.address}, {client.city}
                      </span>
                      <MapPin className="h-4 w-4" />
                    </div>
                  )}
                </CardContent>

                <div className="pt-2 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm text-right">
                    <div>
                      <p className="text-gray-500">תעריף אבטחה</p>
                      <p className="font-medium">₪{client.security_rate}/יום</p>
                    </div>
                    <div>
                      <p className="text-gray-500">תעריף התקנה</p>
                      <p className="font-medium">₪{client.installation_rate}/שעה</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href={`/clients/${client.id}/edit`}>
                      <Edit className="ml-2 h-4 w-4" />
                      ערוך
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
