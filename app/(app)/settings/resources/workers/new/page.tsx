"use client"

import { toast } from "@/hooks/use-toast"
import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import PageLayout from "@/components/layout/page-layout"
import { Plus } from "lucide-react"

export default function NewWorkerPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
    shift_rate: "",
    availability: {} as Record<string, boolean>,
    payment_terms_days: "30",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.phone_number.trim()) {
      toast({ title: "שם העובד ומספר הטלפון הם שדות חובה", variant: "destructive" })
      return
    }

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
        toast({ title: `שגיאה ביצירת העובד: ${error.message}`, variant: "destructive" })
        return
      }

      toast({ title: "העובד נוצר בהצלחה!", variant: "success" })
      router.push("/settings/resources/workers")
    } catch (error) {
      console.error("Failed to create worker:", error)
      toast({ title: "שגיאת ביצוע הבקשה", variant: "destructive" })
    }
  }

  return (
    <PageLayout
      title="עובד חדש"
      subtitle="הוספת עובד למערכת"
      titleIcon={Plus}
      backHref="/settings/resources/workers"
      variant="form"
    >
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
              <Label className="text-right block">זמינות שבועית</Label>
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
                          const avail = typeof formData.availability === 'object' && formData.availability !== null ? formData.availability : {}
                          const isOn = avail[key] !== false && avail[key] !== undefined ? avail[key] : true
                          return (
                            <td key={dayIdx} className="px-1 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = typeof formData.availability === 'object' && formData.availability !== null ? { ...formData.availability } : {}
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
    </PageLayout>
  )
}
