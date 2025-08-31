"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import SidebarNavigation from "@/components/layout/sidebar-navigation"
import { MainContent } from "@/components/layout/main-content"

export default function NewJobTypePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name_he: "",
    name_en: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("work_types").insert([formData]).select()

      if (error) {
        console.error("Error creating work type:", error)
        alert("שגיאה ביצירת סוג העבודה")
        return
      }

      alert("סוג העבודה נוצר בהצלחה!")
      router.push("/settings/resources/job-types")
    } catch (error) {
      console.error("Failed to create work type:", error)
      alert("שגיאה ביצירת סוג העבודה")
    }
  }

  return (
    <>
      <SidebarNavigation />
      <MainContent>
        <div className="p-6 max-w-2xl mx-auto" dir="rtl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">סוג עבודה חדש</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>פרטי סוג העבודה</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name_he" className="text-right block">
                    שם בעברית *
                  </Label>
                  <Input
                    id="name_he"
                    value={formData.name_he}
                    onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                    className="text-right"
                    placeholder="אבטחה"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_en" className="text-right block">
                    שם באנגלית
                  </Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="text-right"
                    placeholder="Security"
                  />
                </div>

                <div className="flex gap-4 justify-start">
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                    צור סוג עבודה
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/settings/resources/job-types")}>
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
