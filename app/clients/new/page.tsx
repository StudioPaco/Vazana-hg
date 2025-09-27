"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserIcon } from "lucide-react"
import SidebarNavigation from "@/components/layout/sidebar-navigation"

export default function NewClientPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentTerms: "monthly",
    hourlyRate: "",
    maintenanceRate: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      console.log("[v0] Submitting client form with data:", formData)

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: formData.companyName,
          contact_person: formData.contactPerson, // Fixed: matches DB schema
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          po_box: formData.postalCode,
          payment_method: formData.paymentTerms === "monthly" ? 1 : formData.paymentTerms === "immediate" ? 2 : 3, // Fixed: convert to integer
          security_rate: Number.parseFloat(formData.hourlyRate) || 0, // Fixed: matches DB schema
          installation_rate: Number.parseFloat(formData.maintenanceRate) || 0, // Fixed: matches DB schema
          notes: formData.notes,
          status: "active",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error creating client:", errorData)
        alert("שגיאה ביצירת הלקוח: " + (errorData.error || "שגיאה לא ידועה"))
        return
      }

      const result = await response.json()
      console.log("[v0] Client created successfully:", result)
      alert("הלקוח נוצר בהצלחה!")
      router.push("/clients")
    } catch (error) {
      console.error("[v0] Failed to create client:", error)
      alert("שגיאה ביצירת הלקוח: בעיית רשת או שרת")
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
            <h1 className="text-2xl font-bold text-gray-900 text-right">הוסף לקוח חדש</h1>
            <p className="text-gray-600 text-right mt-2">נהל את קשרי הלקוחות ומידע חשוב שלך</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <UserIcon className="h-5 w-5 text-vazana-teal" />
                  <span>הוסף לקוח חדש</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-right block">
                    כתובת
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="כתובת רחוב"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-right block">
                    עיר
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="שם העיר"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-right block">
                    תיבת דואר
                  </Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="מספר תיבת דואר"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms" className="text-right block">
                    אופן תשלום
                  </Label>
                  <Select
                    value={formData.paymentTerms}
                    onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="בחר אופן תשלום" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">חודשי</SelectItem>
                      <SelectItem value="immediate">מיידי</SelectItem>
                      <SelectItem value="quarterly">רבעוני</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="text-right block">
                    תעריף שעתי (₪)
                  </Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="120"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenanceRate" className="text-right block">
                    תעריף הערכה (₪)
                  </Label>
                  <Input
                    id="maintenanceRate"
                    type="number"
                    value={formData.maintenanceRate}
                    onChange={(e) => setFormData({ ...formData, maintenanceRate: e.target.value })}
                    placeholder="150"
                    className="text-right"
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
                הוסף לקוח
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
