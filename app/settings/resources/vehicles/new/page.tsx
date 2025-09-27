"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function NewVehiclePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    license_plate: "",
    details: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.license_plate.trim()) {
      alert("שם הרכב ומספר הרכב הם שדות חובה")
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("vehicles").insert([formData]).select()

      if (error) {
        console.error("Error creating vehicle:", error)
        alert(`שגיאה ביצירת הרכב: ${error.message}`)
        return
      }

      alert("הרכב נוצר בהצלחה!")
      router.push("/settings/resources/vehicles")
    } catch (error) {
      console.error("Failed to create vehicle:", error)
      alert("שגיאה ביצירת הרכב")
    }
  }

  return (
    <>
      <SidebarNavigation />
      <MainContent>
        <div className="p-6 max-w-2xl mx-auto" dir="rtl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">רכב חדש</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>פרטי הרכב</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right block">
                    שם הרכב *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-right"
                    placeholder="טנדר - טויוטה קמרי לבן"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_plate" className="text-right block">
                    מספר רכב *
                  </Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    className="text-right"
                    placeholder="123-45-678"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details" className="text-right block">
                    פרטים נוספים
                  </Label>
                  <Textarea
                    id="details"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    className="text-right"
                    placeholder="רכב עבודה ראשי, מתאים להובלת ציוד"
                  />
                </div>

                <div className="flex gap-4 justify-start">
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                    צור רכב
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/settings/resources/vehicles")}>
                    ביטול
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainContent>
    </>
  )
}
