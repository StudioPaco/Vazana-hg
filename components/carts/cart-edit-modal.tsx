"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ShoppingCart, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getModalClasses } from "@/lib/modal-utils"
import { toast } from "@/hooks/use-toast"

interface Cart {
  id: string
  name: string
  details: string
  license_plate?: string
}

interface CartEditModalProps {
  cart: Cart | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCartUpdated: (cart: Cart) => void
}

export default function CartEditModal({ cart, open, onOpenChange, onCartUpdated }: CartEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: "", details: "", license_plate: "" })

  useEffect(() => {
    if (cart) {
      setFormData({
        name: cart.name || "",
        details: cart.details || "",
        license_plate: cart.license_plate || "",
      })
    }
  }, [cart])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("carts")
        .update({
          name: formData.name,
          details: formData.details,
          license_plate: formData.license_plate || null,
          updated_date: new Date().toISOString(),
        })
        .eq("id", cart.id)
        .select()
        .single()

      if (error) throw error

      onCartUpdated(data)
      onOpenChange(false)
      toast({ title: "העגלה עודכנה בהצלחה" })
    } catch (error) {
      console.error("Failed to update cart:", error)
      toast({ title: "שגיאה בעדכון העגלה", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getModalClasses("md")} dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-hebrew" dir="rtl">
            <ShoppingCart className="w-5 h-5 text-vazana-teal" />
            <span>עריכת עגלה</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div className="space-y-2">
            <Label className="font-hebrew text-right block">שם העגלה *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="text-right font-hebrew"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-hebrew text-right block">מספר רישוי</Label>
            <Input
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
              placeholder="000-00-000"
              className="text-right font-hebrew"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-hebrew text-right block">פרטים נוספים</Label>
            <Textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="text-right font-hebrew min-h-[60px]"
              dir="rtl"
            />
          </div>
          <div className="flex gap-3 justify-start">
            <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white font-hebrew">
              <Save className="w-4 h-4 ml-1" />
              {isSubmitting ? "שומר..." : "שמור"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-hebrew">
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
