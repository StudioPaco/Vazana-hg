"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import SidebarNavigation from "@/components/layout/sidebar-navigation"

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentTerms: "active",
    hourlyRate: "",
    maintenanceRate: "",
    notes: "",
  })

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).single()

        if (error) {
          console.error("Error fetching client:", error)
          return
        }

        if (data) {
          setFormData({
            companyName: data.company_name || "",
            contactPerson: data.contact_person || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            postalCode: data.postal_code || "",
            paymentTerms: data.payment_terms || "active",
            hourlyRate: data.hourly_rate?.toString() || "",
            maintenanceRate: data.maintenance_rate?.toString() || "",
            notes: data.notes || "",
          })
        }
      } catch (error) {
        console.error("Failed to fetch client:", error)
      }
    }

    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const supabase = createClient()
      const clientData = {
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        payment_terms: formData.paymentTerms,
        hourly_rate: Number.parseFloat(formData.hourlyRate) || 0,
        maintenance_rate: Number.parseFloat(formData.maintenanceRate) || 0,
        notes: formData.notes,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("clients").update(clientData).eq("id", clientId).select()

      if (error) {
        console.error("Error updating client:", error)
        alert("שגיאה בעדכון הלקוח")
        return
      }

      console.log("Client updated successfully:", data)
      router.push("/clients")
    } catch (error) {
      console.error("Failed to update client:", error)
      alert("שגיאה בעדכון הלקוח")
    }
  }

  const handleCancel = () => {
    router.push("/clients")
  }

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <SidebarNavigation />
      <div className="flex-1 mr-64">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Title positioned in top-right corner */}
          <div className="relative mb-8">
            <UserIcon className="absolute top-0 left-0 w-6 h-6 text-vazana-teal" />
            <h1 className="text-2xl font-bold text-gray-900 text-right">עריכת לקוח</h1>
            <p className="text-gray-600 text-right mt-2">עדכן פרטי לקוח קיים</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <UserIcon className="h-5 w-5 text-vazana-teal" />
                  <span>פרטי לקוח</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Same form fields as new client page */}
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-right block">
                    שם החברה *
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="הזן שם חברה"
                    className="text-right"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="text-right block">
                    איש קשר *
                  </Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="שם איש קשר ראשי"
                    className="text-right"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-right block">
                    כתובת דוא"ל *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="text-left"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-right block">
                    מספר טלפון *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="050-1234567"
                    className="text-right"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes" className="text-right block">
                    הערות
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="הערות נוספות על לקוח זה..."
                    className="min-h-[80px] text-right"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-start">
              <Button type="submit" className="bg-vazana-teal hover:bg-vazana-teal/90 text-white px-8">
                עדכן לקוח
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} className="px-8 bg-transparent">
                ביטול
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
