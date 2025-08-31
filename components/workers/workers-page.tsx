"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Phone, MapPin, Calendar, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Worker {
  id: string
  name: string
  phone_number: string
  address: string
  shift_rate: number
  payment_terms_days: number
  availability: any
  notes: string
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("workers").select("*").order("name")

        if (error) {
          console.error("[v0] Error fetching workers:", error)
          const sampleWorkers = [
            {
              id: "worker-1",
              name: "עובד 1 - נגר",
              phone_number: "050-1234567",
              address: "תל אביב",
              shift_rate: 300,
              payment_terms_days: 30,
              availability: { sun: { day: true }, mon: { day: true }, tue: { day: true } },
              notes: "עובד מנוסה",
            },
            {
              id: "worker-2",
              name: "עובד 2 - חשמלאי",
              phone_number: "052-7654321",
              address: "חיפה",
              shift_rate: 350,
              payment_terms_days: 15,
              availability: { wed: { day: true }, thu: { day: true }, fri: { day: true } },
              notes: "מתמחה בהתקנות",
            },
            {
              id: "worker-3",
              name: "עובד 3 - צבע",
              phone_number: "050-3456789",
              address: "ירושלים",
              shift_rate: 280,
              payment_terms_days: 30,
              availability: { sun: { day: true }, wed: { day: true }, fri: { day: true } },
              notes: "מומחה צביעה",
            },
          ]
          setWorkers(sampleWorkers)
          setFilteredWorkers(sampleWorkers)
        } else {
          setWorkers(data || [])
          setFilteredWorkers(data || [])
        }
      } catch (error) {
        console.error("Failed to fetch workers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkers()
  }, [])

  useEffect(() => {
    const filtered = workers.filter(
      (worker) =>
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.phone_number.includes(searchTerm) ||
        worker.address.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredWorkers(filtered)
  }, [searchTerm, workers])

  const handleDeleteWorker = async (id: string) => {
    if (confirm("Are you sure you want to delete this worker?")) {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("workers").delete().eq("id", id)

        if (error) {
          console.error("[v0] Error deleting worker:", error)
        }
        setWorkers(workers.filter((worker) => worker.id !== id))
      } catch (error) {
        console.error("Failed to delete worker:", error)
      }
    }
  }

  const getAvailabilityBadges = (availability: any) => {
    if (!availability) return []

    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const availableDays = []

    days.forEach((day, index) => {
      if (availability[day]?.day || availability[day]?.night) {
        availableDays.push(dayNames[index])
      }
    })

    return availableDays
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900">עובדים</h1>
          <p className="text-gray-600">ניהול כוח האדם שלך</p>
        </div>
        <Button asChild>
          <Link href="/settings/resources/workers/new">
            <Plus className="ml-2 h-4 w-4" />
            הוסף עובד
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search workers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Workers Grid */}
      {filteredWorkers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <Plus className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2">No workers found</p>
              <p className="text-sm">
                {searchTerm ? "Try adjusting your search terms" : "Add your first worker to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map((worker) => (
            <Card key={worker.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{worker.name}</CardTitle>
                    <CardDescription>₪{worker.shift_rate}/shift</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {worker.phone_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="mr-2 h-4 w-4" />
                      {worker.phone_number}
                    </div>
                  )}
                  {worker.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="mr-2 h-4 w-4" />
                      {worker.address}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="mr-2 h-4 w-4" />
                    Payment terms: {worker.payment_terms_days} days
                  </div>
                </div>

                {worker.availability && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-500 mb-2">Available Days:</p>
                    <div className="flex flex-wrap gap-1">
                      {getAvailabilityBadges(worker.availability).map((day) => (
                        <Badge key={day} variant="secondary" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {worker.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-500 mb-1">Notes:</p>
                    <p className="text-sm text-gray-700">{worker.notes}</p>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href={`/workers/${worker.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteWorker(worker.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
