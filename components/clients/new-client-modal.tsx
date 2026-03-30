"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserIcon, Save, X, DollarSign } from "lucide-react"
import { getModalClasses } from "@/lib/modal-utils"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

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
  payment_method?: string
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
    paymentTerms: "1",
    hourlyRate: "",
    maintenanceRate: "",
    currentJobRate: "800",
    inspectionRate: "",
    notes: "",
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workTypes, setWorkTypes] = useState<{ id: string; name_he: string; default_rate: number }[]>([])
  const [clientRates, setClientRates] = useState<{ work_type_id: string; rate: string }[]>([])

  // Fetch work types on mount
  useState(() => {
    const supabase = createClient()
    supabase.from("work_types").select("id, name_he, default_rate").order("name_he").then(({ data }) => {
      setWorkTypes(data || [])
    })
  })

  const addClientRate = () => {
    setClientRates(prev => [...prev, { work_type_id: "", rate: "" }])
  }

  const updateClientRate = (index: number, field: string, value: string) => {
    setClientRates(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const removeClientRate = (index: number) => {
    setClientRates(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validRates = clientRates.filter(r => r.work_type_id && r.rate)
    if (validRates.length === 0) {
      toast({ title: "חובה להגדיר לפחות תעריף אחד בלשונית תעריפים", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast({ title: "שגיאה: יש להתחבר מחדש למערכת", variant: "destructive" })
        setIsSubmitting(false)
        return
      }

      const clientData = {
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || null,
        city: formData.city || null,
        po_box: formData.postalCode || null,
        payment_method: parseInt(formData.paymentTerms) || 1,
        security_rate: Number.parseFloat(formData.hourlyRate) || 0,
        installation_rate: Number.parseFloat(formData.maintenanceRate) || 0,
        current_job_rate: Number.parseFloat(formData.currentJobRate) || 800,
        notes: formData.notes || null,
        status: "active",
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        is_sample: false,
        created_by_id: user.id,
      }

      console.log("Inserting client directly via Supabase:", Object.keys(clientData))

      const { data: newClient, error } = await supabase
        .from("clients")
        .insert([clientData])
        .select()
        .single()

      if (error) {
        console.error("Supabase insert error:", error)
        toast({ 
          title: `שגיאה ביצירת הלקוח: ${error.message || error.code || "שגיאת מסד נתונים"}`, 
          variant: "destructive" 
        })
        setIsSubmitting(false)
        return
      }

      // Save client rates to client_work_type_rates
      const ratesToInsert = validRates.map(r => ({
        client_id: newClient.id,
        work_type_id: r.work_type_id,
        rate: parseFloat(r.rate),
      }))
      if (ratesToInsert.length > 0) {
        await supabase.from('client_work_type_rates').insert(ratesToInsert)
      }

      // Set the first rate as current_job_rate on the client
      if (ratesToInsert.length > 0) {
        await supabase.from('clients').update({ current_job_rate: ratesToInsert[0].rate }).eq('id', newClient.id)
      }

      // Reset form
      setClientRates([])
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        paymentTerms: "1",
        hourlyRate: "",
        maintenanceRate: "",
        currentJobRate: "800",
        inspectionRate: "",
        notes: "",
      })
      
      onClientCreated(newClient)
      onOpenChange(false)
      toast({ title: "הלקוח נוצר בהצלחה!", variant: "success" })
    } catch (error: any) {
      console.error("Failed to create client:", error)
      toast({ title: "שגיאה ביצירת הלקוח: " + (error?.message || "שגיאה לא צפויה"), variant: "destructive" })
    }
    setIsSubmitting(false)
  }

  const handleCancel = () => {
    setFormData({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      paymentTerms: "1",
      hourlyRate: "",
      maintenanceRate: "",
      currentJobRate: "800",
      inspectionRate: "",
      notes: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getModalClasses("xl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <UserIcon className="h-5 w-5 text-vazana-teal" />
            הוסף לקוח חדש
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <Tabs defaultValue="basic" dir="rtl">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="font-hebrew">פרטי לקוח</TabsTrigger>
              <TabsTrigger value="rates" className="font-hebrew">תעריפים</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="paymentTerms" className="text-right block font-hebrew">אופן תשלום</Label>
                <Select value={formData.paymentTerms} onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })} dir="rtl">
                  <SelectTrigger className="text-right font-hebrew"><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="1">מיידי</SelectItem>
                    <SelectItem value="2">שוטף +15</SelectItem>
                    <SelectItem value="3">שוטף +30</SelectItem>
                    <SelectItem value="4">שוטף +60</SelectItem>
                    <SelectItem value="5">שוטף +90</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes" className="text-right block font-hebrew">הערות</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="הערות..." className="min-h-[60px] text-right" />
              </div>
            </div>
            </TabsContent>

            <TabsContent value="rates" className="space-y-4 mt-4">
              <p className="text-sm text-gray-500 font-hebrew text-right">הגדר תעריף לכל סוג עבודה. חובה להגדיר לפחות תעריף אחד.</p>
              <div className="space-y-3">
                {clientRates.map((rate, i) => (
                  <div key={i} className="flex items-center gap-3" dir="rtl">
                    <Select value={rate.work_type_id} onValueChange={(v) => {
                      updateClientRate(i, 'work_type_id', v)
                      // Auto-fill default rate from work type
                      const wt = workTypes.find(w => w.id === v)
                      if (wt && !rate.rate) updateClientRate(i, 'rate', String(wt.default_rate || 800))
                    }} dir="rtl">
                      <SelectTrigger className="w-40 font-hebrew text-right text-sm h-9">
                        <SelectValue placeholder="סוג עבודה" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {workTypes.map(wt => (
                          <SelectItem key={wt.id} value={wt.id}>{wt.name_he}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={rate.rate}
                      onChange={(e) => updateClientRate(i, 'rate', e.target.value)}
                      placeholder="₪"
                      className="w-28 text-right h-9 text-sm"
                    />
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500" onClick={() => removeClientRate(i)}>✕</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addClientRate} className="font-hebrew text-sm">
                  + הוסף תעריף
                </Button>
                {clientRates.length === 0 && (
                  <p className="text-xs text-red-500 font-hebrew text-right">חובה להגדיר לפחות תעריף אחד</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

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