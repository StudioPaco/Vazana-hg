"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserIcon, Save, X } from "lucide-react"
import { getModalClasses } from "@/lib/modal-utils"

interface Client {
  id: string
  company_name: string
  contact_person: string
  email: string
  phone: string
  address?: string
  city?: string
  po_box?: string
  payment_terms?: number
  security_rate?: number
  installation_rate?: number
  notes?: string
  status?: string
  created_at?: string
  updated_at?: string
}

interface NewClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientCreated: (client: Client) => void
}

export default function NewClientModal({ open, onOpenChange, onClientCreated }: NewClientModalProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentTerms: "immediate",
    hourlyRate: "",
    maintenanceRate: "",
    notes: "",
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
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
          payment_method: formData.paymentTerms, // Store the actual payment terms string
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
      
      // Reset form
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        paymentTerms: "immediate",
        hourlyRate: "",
        maintenanceRate: "",
        notes: "",
      })
      
      onClientCreated(result.data)
      onOpenChange(false)
      alert("הלקוח נוצר בהצלחה!")
    } catch (error) {
      console.error("[v0] Failed to create client:", error)
      alert("שגיאה ביצירת הלקוח: בעיית רשת או שרת")
    }
    setIsSubmitting(false)
  }

  const handleCancel = () => {
    // Reset form
    setFormData({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      paymentTerms: "immediate",
      hourlyRate: "",
      maintenanceRate: "",
      notes: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getModalClasses("max-w-4xl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <UserIcon className="h-5 w-5 text-vazana-teal" />
            הוסף לקוח חדש
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <UserIcon className="h-5 w-5 text-vazana-teal" />
                <span>פרטי הלקוח</span>
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
                    <SelectItem value="immediate">מיידי</SelectItem>
                    <SelectItem value="current+15">שוטף +15</SelectItem>
                    <SelectItem value="current+30">שוטף +30</SelectItem>
                    <SelectItem value="current+60">שוטף +60</SelectItem>
                    <SelectItem value="current+90">שוטף +90</SelectItem>
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
            <Button 
              type="submit" 
              className="bg-vazana-teal hover:bg-vazana-teal/90 text-white px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  שומר...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  הוסף לקוח
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              className="px-8 bg-transparent"
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}