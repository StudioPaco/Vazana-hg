"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getModalClasses } from "@/lib/modal-utils"
import { toast } from "@/hooks/use-toast"

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

interface WorkerEditModalProps {
  worker: Worker | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onWorkerUpdated: (worker: Worker) => void
}

export default function WorkerEditModal({ worker, open, onOpenChange, onWorkerUpdated }: WorkerEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
    shift_rate: "",
    availability: {} as any,
    payment_terms_days: "30",
    notes: "",
  })

  useEffect(() => {
    if (worker && open) {
      setFormData({
        name: worker.name || "",
        phone_number: worker.phone_number || "",
        address: worker.address || "",
        shift_rate: worker.shift_rate?.toString() || "",
        availability: typeof worker.availability === "object" && worker.availability ? worker.availability : {},
        payment_terms_days: worker.payment_terms_days?.toString() || "30",
        notes: worker.notes || "",
      })
    }
  }, [worker, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!worker) return

    if (!formData.name.trim() || !formData.phone_number.trim()) {
      toast({ title: "שם העובד ומספר הטלפון הם שדות חובה", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()

      const updateData = {
        name: formData.name,
        phone_number: formData.phone_number,
        address: formData.address,
        shift_rate: formData.shift_rate ? Number.parseFloat(formData.shift_rate) : null,
        payment_terms_days: Number.parseInt(formData.payment_terms_days),
        notes: formData.notes,
      }

      const { data: updatedWorker, error } = await supabase
        .from("workers")
        .update(updateData)
        .eq("id", worker.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating worker:", error)
        toast({ title: `שגיאה בעדכון העובד: ${error.message}`, variant: "destructive" })
        return
      }

      onWorkerUpdated(updatedWorker)
      onOpenChange(false)
      toast({ title: "העובד עודכן בהצלחה!", variant: "success" })
    } catch (error) {
      console.error("Failed to update worker:", error)
      toast({ title: "שגיאה בעדכון העובד", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!worker) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getModalClasses("lg", true)}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between font-hebrew">
            <User className="w-5 h-5 text-vazana-teal" />
            <span>עריכת עובד - {worker.name}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right block font-hebrew">
              שם העובד *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-right font-hebrew"
              dir="rtl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number" className="text-right block font-hebrew">
              מספר טלפון *
            </Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="text-right font-hebrew"
              dir="rtl"
              placeholder="050-1234567"
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
            <Label htmlFor="shift_rate" className="text-right block font-hebrew">
              תעריף משמרת (₪)
            </Label>
            <Input
              id="shift_rate"
              type="number"
              step="0.01"
              value={formData.shift_rate}
              onChange={(e) => setFormData({ ...formData, shift_rate: e.target.value })}
              className="text-right font-hebrew"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-right block font-hebrew">זמינות שבועית</Label>
            <div className="border rounded-lg overflow-hidden" dir="rtl">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-1.5 text-right font-hebrew font-medium text-gray-600">משמרת</th>
                    {['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'].map(day => (
                      <th key={day} className="px-1 py-1.5 text-center font-hebrew font-medium text-gray-600">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['יום', 'לילה'].map(shift => (
                    <tr key={shift} className="border-t">
                      <td className="px-2 py-1 text-right font-hebrew font-medium text-gray-700">{shift}</td>
                      {[0,1,2,3,4,5,6].map(dayIdx => {
                        const key = `${shift}_${dayIdx}`
                        const weekAvail = typeof formData.availability === 'object' && formData.availability !== null ? formData.availability : {}
                        const isOn = (weekAvail as any)[key] !== false
                        return (
                          <td key={dayIdx} className="px-1 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const current = typeof formData.availability === 'object' && formData.availability !== null ? { ...formData.availability as any } : {}
                                current[key] = !isOn
                                setFormData({ ...formData, availability: current })
                              }}
                              className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                                isOn
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                              }`}
                            >
                              {isOn ? '✓' : '✗'}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-400 font-hebrew text-right">לחץ לשינוי זמינות. ירוק = זמין, אפור = לא זמין</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms_days" className="text-right block font-hebrew">
              תנאי תשלום (ימים)
            </Label>
            <Input
              id="payment_terms_days"
              type="number"
              value={formData.payment_terms_days}
              onChange={(e) => setFormData({ ...formData, payment_terms_days: e.target.value })}
              className="text-right font-hebrew"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-right block font-hebrew">
              הערות
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="text-right font-hebrew"
              dir="rtl"
            />
          </div>

          <div className="flex gap-4 justify-start pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-hebrew"
            >
              <Save className="ml-2 h-4 w-4" />
              {isSubmitting ? "שומר..." : "שמור שינויים"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-hebrew"
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
