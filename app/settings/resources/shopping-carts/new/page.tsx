"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import SidebarNavigation from "@/components/layout/sidebar-navigation"
import { MainContent } from "@/components/layout/main-content"

export default function NewCartPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    details: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("carts").insert([formData]).select()

      if (error) {
        console.error("Error creating cart:", error)
        alert("שגיאה ביצירת העגלה")
        return
      }

      alert("העגלה נוצרה בהצלחה!")
      router.push("/settings/resources/shopping-carts")
    } catch (error) {
      console.error("Failed to create cart:", error)
      alert("שגיאה ביצירת העגלה")
    }
  }

  return (
    <>
      <SidebarNavigation />
      <MainContent>
        <div className="p-6 max-w-2xl mx-auto" dir="rtl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">עגלה/נגרר חדש</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>פרטי העגלה/נגרר</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right block">
                    שם העגלה/נגרר *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-right"
                    placeholder="עגלת ציוד 1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details" className="text-right block">
                    פרטים נוספים
                  </Label>
                  <Textarea
                    id="details"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    className="text-right"
                    placeholder="עגלה לכלי עבודה בסיסיים"
                  />
                </div>

                <div className="flex gap-4 justify-start">
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                    צור עגלה/נגרר
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/settings/resources/shopping-carts")}
                  >
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
