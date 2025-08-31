"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import SidebarNavigation from "@/components/layout/sidebar-navigation"
import { MainContent } from "@/components/layout/main-content"

export default function NewWorkerPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
    shift_rate: "",
    availability: "available",
    payment_terms_days: "30",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("workers")
        .insert([
          {
            ...formData,
            shift_rate: formData.shift_rate ? Number.parseFloat(formData.shift_rate) : null,
            payment_terms_days: Number.parseInt(formData.payment_terms_days),
          },
        ])
        .select()

      if (error) {
        console.error("Error creating worker:", error)
        alert("שגיאה ביצירת העובד")
        return
      }

      alert("העובד נוצר בהצלחה!")
      router.push("/settings/resources/workers")
    } catch (error) {
      console.error("Failed to create worker:", error)
      alert("שגיאה ביצירת העובד")
    }
  }

  return (
    <>
      <SidebarNavigation />
      <MainContent>
        <div className="p-6 max-w-2xl mx-auto" dir="rtl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">עובד חדש</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>פרטי העובד</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right block">
                    שם העובד *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-right"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-right block">
                    מספר טלפון *
                  </Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="text-right"
                    placeholder="050-1234567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-right block">
                    כתובת
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift_rate" className="text-right block">
                    תעריף משמרת (₪)
                  </Label>
                  <Input
                    id="shift_rate"
                    type="number"
                    step="0.01"
                    value={formData.shift_rate}
                    onChange={(e) => setFormData({ ...formData, shift_rate: e.target.value })}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability" className="text-right block">
                    זמינות
                  </Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, availability: value })}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="בחר זמינות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">זמין</SelectItem>
                      <SelectItem value="busy">עסוק</SelectItem>
                      <SelectItem value="unavailable">לא זמין</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_terms_days" className="text-right block">
                    תנאי תשלום (ימים)
                  </Label>
                  <Input
                    id="payment_terms_days"
                    type="number"
                    value={formData.payment_terms_days}
                    onChange={(e) => setFormData({ ...formData, payment_terms_days: e.target.value })}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-right block">
                    הערות
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="text-right"
                  />
                </div>

                <div className="flex gap-4 justify-start">
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                    צור עובד
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/settings/resources/workers")}>
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
