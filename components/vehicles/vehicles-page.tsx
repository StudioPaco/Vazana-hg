"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Truck, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import VehicleEditModal from "@/components/vehicles/vehicle-edit-modal"

interface Vehicle {
  id: string
  name: string
  license_plate: string
  details: string
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("vehicles").select("*").order("name")

        if (error) {
          console.error("Error fetching vehicles:", error)
          setVehicles([])
          setFilteredVehicles([])
        } else {
          setVehicles(data || [])
          setFilteredVehicles(data || [])
        }
      } catch (error) {
        console.error("Failed to fetch vehicles:", error)
        setVehicles([])
        setFilteredVehicles([])
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  useEffect(() => {
    const filtered = vehicles.filter(
      (vehicle) =>
        vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredVehicles(filtered)
  }, [searchTerm, vehicles])

  const handleDeleteVehicle = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק רכב זה?")) {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("vehicles").delete().eq("id", id)

        if (error) {
          console.error("Error deleting vehicle:", error)
          alert("שגיאה במחיקת הרכב. נסה שוב.")
          return
        }
        setVehicles(vehicles.filter((vehicle) => vehicle.id !== id))
      } catch (error) {
        console.error("Failed to delete vehicle:", error)
        alert("שגיאה במחיקת הרכב. נסה שוב.")
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">כלי רכב</h1>
          <p className="text-gray-600">ניהול צי הרכבים שלך</p>
        </div>
        <Button asChild>
          <Link href="/settings/resources/vehicles/new">
            <Plus className="ml-2 h-4 w-4" />
            הוסף רכב
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="חפש רכבים..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <Truck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2">לא נמצאו רכבים</p>
              <p className="text-sm">
                {searchTerm ? "נסה לשנות את מילות החיפוש" : "הוסף את הרכב הראשון שלך כדי להתחיל"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                    <CardDescription className="font-mono">{vehicle.license_plate}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vehicle.details && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">פרטים:</p>
                    <p className="text-sm text-gray-700">{vehicle.details}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setEditingVehicle(vehicle)
                      setEditModalOpen(true)
                    }}
                  >
                    <Edit className="ml-2 h-4 w-4" />
                    ערוך
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteVehicle(vehicle.id)}
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
      <VehicleEditModal
        vehicle={editingVehicle}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onVehicleUpdated={(updated) => {
          setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v))
        }}
      />
    </div>
  )
}
