"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Truck, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getModalClasses } from "@/lib/modal-utils"
import { toast } from "@/hooks/use-toast"

interface Vehicle {
  id: string
  name: string
  license_plate: string
  details: string
}

interface VehicleEditModalProps {
  vehicle: Vehicle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onVehicleUpdated: (vehicle: Vehicle) => void
}

export default function VehicleEditModal({ vehicle, open, onOpenChange, onVehicleUpdated }: VehicleEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    license_plate: "",
    details: "",
  })

  useEffect(() => {
    if (vehicle && open) {
      setFormData({
        name: vehicle.name || "",
        license_plate: vehicle.license_plate || "",
        details: vehicle.details || "",
      })
    }
  }, [vehicle, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicle) return

    if (!formData.name.trim() || !formData.license_plate.trim()) {
      toast({ title: "שם הרכב ומספר הרכב הם שדות חובה", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()

      const { data: updatedVehicle, error } = await supabase
        .from("vehicles")
        .update(formData)
        .eq("id", vehicle.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating vehicle:", error)
        toast({ title: `שגיאה בעדכון הרכב: ${error.message}`, variant: "destructive" })
        return
      }

      onVehicleUpdated(updatedVehicle)
      onOpenChange(false)
      toast({ title: "הרכב עודכן בהצלחה!", variant: "success" })
    } catch (error) {
      console.error("Failed to update vehicle:", error)
      toast({ title: "שגיאה בעדכון הרכב", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!vehicle) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getModalClasses("md", true)}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between font-hebrew">
            <Truck className="w-5 h-5 text-vazana-teal" />
            <span>עריכת רכב - {vehicle.name}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right block font-hebrew">
              שם הרכב *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-right font-hebrew"
              dir="rtl"
              placeholder="טנדר - טויוטה קמרי לבן"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_plate" className="text-right block font-hebrew">
              מספר רכב *
            </Label>
            <Input
              id="license_plate"
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
              className="text-right font-hebrew"
              dir="rtl"
              placeholder="123-45-678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-right block font-hebrew">
              פרטים נוספים
            </Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="text-right font-hebrew"
              dir="rtl"
              placeholder="רכב עבודה ראשי, מתאים להובלת ציוד"
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
