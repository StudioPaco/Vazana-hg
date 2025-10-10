"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  DollarSign, 
  Calendar, 
  Building2,
  Plus,
  Trash2,
  Save,
  X
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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
  payment_terms?: string
  security_rate?: number
  installation_rate?: number
  notes?: string
  status?: string
  created_at?: string
  updated_at?: string
}

interface WorkTypeRate {
  id: string
  work_type_id: string
  work_type_name: string
  rate: number
}

interface PaymentLog {
  id: string
  month: string
  invoice_sent: boolean
  invoice_sent_date?: string
  payment_received: boolean
  payment_received_date?: string
  amount?: number
  notes?: string
}

interface ClientEditModalProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientUpdated: (client: Client) => void
}

export default function ClientEditModal({ client, open, onOpenChange, onClientUpdated }: ClientEditModalProps) {
  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    po_box: "",
    payment_terms: "immediate",
    notes: "",
  })
  
  const [workTypeRates, setWorkTypeRates] = useState<WorkTypeRate[]>([])
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([])
  const [availableWorkTypes, setAvailableWorkTypes] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  useEffect(() => {
    if (client && open) {
      setFormData({
        company_name: client.company_name || "",
        contact_person: client.contact_person || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        city: client.city || "",
        po_box: client.po_box || "",
        payment_terms: client.payment_terms || "immediate",
        notes: client.notes || "",
      })
      
      loadClientData(client.id)
    }
  }, [client, open])

  useEffect(() => {
    if (open) {
      loadWorkTypes()
    }
  }, [open])

  const loadWorkTypes = async () => {
    try {
      const response = await fetch("/api/work-types")
      const result = await response.json()
      if (result.data) {
        setAvailableWorkTypes(result.data)
      }
    } catch (error) {
      console.error("Error loading work types:", error)
    }
  }

  const loadClientData = async (clientId: string) => {
    try {
      // Load work type rates
      const ratesResponse = await fetch(`/api/clients/${clientId}/rates`)
      if (ratesResponse.ok) {
        const ratesResult = await ratesResponse.json()
        setWorkTypeRates(ratesResult.data || [])
      }

      // Load payment logs  
      const logsResponse = await fetch(`/api/clients/${clientId}/payment-logs`)
      if (logsResponse.ok) {
        const logsResult = await logsResponse.json()
        setPaymentLogs(logsResult.data || [])
      }
    } catch (error) {
      console.error("Error loading client data:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      
      // Update basic client info
      const { data: updatedClient, error } = await supabase
        .from("clients")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", client.id)
        .select()
        .single()

      if (error) throw error

      // Update work type rates
      for (const rate of workTypeRates) {
        if (rate.id.startsWith('new-')) {
          // Create new rate
          await supabase
            .from("client_work_type_rates")
            .insert({
              client_id: client.id,
              work_type_id: rate.work_type_id,
              rate: rate.rate,
            })
        } else {
          // Update existing rate
          await supabase
            .from("client_work_type_rates")
            .update({ rate: rate.rate })
            .eq("id", rate.id)
        }
      }

      onClientUpdated(updatedClient)
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating client:", error)
      alert("שגיאה בעדכון הלקוח")
    }
    setIsSubmitting(false)
  }

  const addWorkTypeRate = () => {
    const newId = `new-${Date.now()}`
    setWorkTypeRates([...workTypeRates, {
      id: newId,
      work_type_id: "",
      work_type_name: "",
      rate: 0
    }])
  }

  const updateWorkTypeRate = (id: string, field: string, value: any) => {
    setWorkTypeRates(rates => 
      rates.map(rate => 
        rate.id === id ? { ...rate, [field]: value } : rate
      )
    )
  }

  const removeWorkTypeRate = (id: string) => {
    setWorkTypeRates(rates => rates.filter(rate => rate.id !== id))
  }

  const addPaymentLog = () => {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const newLog: PaymentLog = {
      id: `new-${Date.now()}`,
      month: currentMonth,
      invoice_sent: false,
      payment_received: false
    }
    setPaymentLogs([...paymentLogs, newLog])
  }

  const updatePaymentLog = (id: string, field: string, value: any) => {
    setPaymentLogs(logs => 
      logs.map(log => 
        log.id === id ? { ...log, [field]: value } : log
      )
    )
  }

  const removePaymentLog = (id: string) => {
    setPaymentLogs(logs => logs.filter(log => log.id !== id))
  }

  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getModalClasses('xl', true)}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between font-hebrew">
            <Building2 className="w-6 h-6 text-vazana-teal" />
            <span>עריכת לקוח - {client.company_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="scroll-content p-1">
          <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basic" className="font-hebrew">פרטי יסוד</TabsTrigger>
              <TabsTrigger value="rates" className="font-hebrew">תעריפים</TabsTrigger>
              <TabsTrigger value="payments" className="font-hebrew">יומן תשלומים</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <User className="w-5 h-5 text-vazana-teal" />
                    <span>פרטי הלקוח</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name" className="text-right block font-hebrew">
                      שם החברה *
                    </Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="text-right font-hebrew"
                      dir="rtl"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_person" className="text-right block font-hebrew">
                      איש קשר *
                    </Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="text-right font-hebrew"
                      dir="rtl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-right block font-hebrew">
                      טלפון *
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="text-right font-hebrew"
                      dir="rtl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-right block font-hebrew">
                      אימייל *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="text-left"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-right block font-hebrew">
                      כתובת
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="text-right font-hebrew"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-right block font-hebrew">
                      עיר
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="text-right font-hebrew"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_terms" className="text-right block font-hebrew">
                      אופן תשלום
                    </Label>
                    <Select
                      value={formData.payment_terms}
                      onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                      dir="rtl"
                    >
                      <SelectTrigger className="text-right font-hebrew">
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
                    <Label htmlFor="po_box" className="text-right block font-hebrew">
                      תיבת דואר
                    </Label>
                    <Input
                      id="po_box"
                      value={formData.po_box}
                      onChange={(e) => setFormData({ ...formData, po_box: e.target.value })}
                      className="text-right font-hebrew"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes" className="text-right block font-hebrew">
                      הערות
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="text-right font-hebrew"
                      dir="rtl"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={addWorkTypeRate}
                        className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        הוסף תעריף
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-vazana-teal" />
                      <span>תעריפים לפי סוג עבודה</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workTypeRates.map((rate) => (
                    <div key={rate.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWorkTypeRate(rate.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-right block font-hebrew text-sm">סוג עבודה</Label>
                          <select
                            value={rate.work_type_id}
                            onChange={(e) => {
                              const workType = availableWorkTypes.find(wt => wt.id === e.target.value)
                              updateWorkTypeRate(rate.id, 'work_type_id', e.target.value)
                              updateWorkTypeRate(rate.id, 'work_type_name', workType?.name_he || '')
                            }}
                            className="w-full p-2 border rounded text-right font-hebrew"
                            dir="rtl"
                            required
                          >
                            <option value="">בחר סוג עבודה</option>
                            {availableWorkTypes.map((workType) => (
                              <option key={workType.id} value={workType.id}>
                                {workType.name_he}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label className="text-right block font-hebrew text-sm">תעריף (₪)</Label>
                          <Input
                            type="number"
                            value={rate.rate}
                            onChange={(e) => updateWorkTypeRate(rate.id, 'rate', parseFloat(e.target.value) || 0)}
                            className="text-right font-hebrew"
                            dir="rtl"
                            placeholder="0"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {workTypeRates.length === 0 && (
                    <div className="text-center py-8 text-gray-500 font-hebrew">
                      לא הוגדרו תעריפים. לחץ "הוסף תעריף" להתחלה.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-hebrew">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={addPaymentLog}
                        className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        הוסף רשומה
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-vazana-teal" />
                      <span>יומן תשלומים חודשי</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentLogs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePaymentLog(log.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        <div>
                          <Label className="text-right block font-hebrew text-sm">חודש</Label>
                          <Input
                            type="month"
                            value={log.month}
                            onChange={(e) => updatePaymentLog(log.id, 'month', e.target.value)}
                            className="text-right font-hebrew"
                            dir="rtl"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={log.invoice_sent}
                              onChange={(e) => updatePaymentLog(log.id, 'invoice_sent', e.target.checked)}
                              className="ml-2"
                            />
                            <Label className="font-hebrew text-sm">חשבונית נשלחה</Label>
                          </div>
                          {log.invoice_sent && (
                            <Input
                              type="date"
                              value={log.invoice_sent_date || ''}
                              onChange={(e) => updatePaymentLog(log.id, 'invoice_sent_date', e.target.value)}
                              className="text-right font-hebrew"
                              style={{ textAlign: 'right' }}
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={log.payment_received}
                              onChange={(e) => updatePaymentLog(log.id, 'payment_received', e.target.checked)}
                              className="ml-2"
                            />
                            <Label className="font-hebrew text-sm">תשלום התקבל</Label>
                          </div>
                          {log.payment_received && (
                            <Input
                              type="date"
                              value={log.payment_received_date || ''}
                              onChange={(e) => updatePaymentLog(log.id, 'payment_received_date', e.target.value)}
                              className="text-right font-hebrew"
                              style={{ textAlign: 'right' }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-right block font-hebrew text-sm">סכום (₪)</Label>
                          <Input
                            type="number"
                            value={log.amount || ''}
                            onChange={(e) => updatePaymentLog(log.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="text-right font-hebrew"
                            dir="rtl"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <Label className="text-right block font-hebrew text-sm">הערות</Label>
                          <Input
                            value={log.notes || ''}
                            onChange={(e) => updatePaymentLog(log.id, 'notes', e.target.value)}
                            className="text-right font-hebrew"
                            dir="rtl"
                            placeholder="הערות..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {paymentLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500 font-hebrew">
                      אין רשומות תשלום. לחץ "הוסף רשומה" להתחלה.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-start gap-4 pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
            >
              {isSubmitting ? (
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full ml-2" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              שמור שינויים
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="font-hebrew"
            >
              <X className="w-4 h-4 ml-2" />
              ביטול
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}