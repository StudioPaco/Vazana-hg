"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit2, Trash2, Save, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"

export default function WorkTypesPage() {
  const [workTypes, setWorkTypes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState({
    name_he: "",
    name_en: "",
  })

  useEffect(() => {
    loadWorkTypes()
  }, [])

  const loadWorkTypes = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Loading work types...")
      const supabase = createClient()
      const { data, error } = await supabase.from("work_types").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading work types:", error)
        setWorkTypes([])
      } else {
        console.log("[v0] Successfully loaded work types:", data)
        setWorkTypes(data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load work types:", error)
      setWorkTypes([])
    }
    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name_he.trim() || !formData.name_en.trim()) {
      alert("שם בעברית ובאנגלית הם שדות חובה")
      return
    }

    setIsSubmitting(true)
    try {
      console.log("[v0] Submitting work type:", formData)
      const supabase = createClient()

      if (editingItem) {
        console.log("[v0] Updating work type:", editingItem.id)
        const { error } = await supabase.from("work_types").update(formData).eq("id", editingItem.id)

        if (error) {
          console.error("[v0] Error updating work type:", error)
          throw error
        }
        console.log("[v0] Work type updated successfully")
      } else {
        console.log("[v0] Creating new work type")
        const { error } = await supabase.from("work_types").insert([formData])

        if (error) {
          console.error("[v0] Error creating work type:", error)
          throw error
        }
        console.log("[v0] Work type created successfully")
      }

      setShowForm(false)
      setEditingItem(null)
      setFormData({ name_he: "", name_en: "" })
      loadWorkTypes()
    } catch (error) {
      console.error("[v0] Error saving work type:", error)
      alert("שגיאה בשמירת סוג העבודה")
    }
    setIsSubmitting(false)
  }

  const handleEdit = (item: any) => {
    console.log("[v0] Editing work type:", item)
    setEditingItem(item)
    setFormData({
      name_he: item.name_he || "",
      name_en: item.name_en || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (itemId: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק סוג עבודה זה? פעולה זו אינה ניתנת לביטול.")) {
      try {
        console.log("[v0] Deleting work type:", itemId)
        const supabase = createClient()
        const { error } = await supabase.from("work_types").delete().eq("id", itemId)

        if (error) {
          console.error("[v0] Error deleting work type:", error)
          throw error
        }

        console.log("[v0] Work type deleted successfully")
        loadWorkTypes()
        if (editingItem && editingItem.id === itemId) {
          setShowForm(false)
          setEditingItem(null)
        }
      } catch (error) {
        console.error("[v0] Error deleting work type:", error)
        alert("שגיאה במחיקת סוג העבודה")
      }
    }
  }

  const openNewForm = () => {
    console.log("[v0] Opening new work type form")
    setEditingItem(null)
    setFormData({ name_he: "", name_en: "" })
    setShowForm(true)
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-gray-900">סוגי עבודה</h1>
        <p className="text-gray-600">ניהול סוגי העבודות הזמינות במערכת</p>
      </div>

      <Button onClick={openNewForm} className="flex items-center gap-2 bg-[#FFCC00] hover:bg-[#E6B800] text-[#1A1A1A]">
        <Plus className="w-4 h-4" /> הוסף סוג עבודה חדש
      </Button>

      {showForm && (
        <Card className="shadow-md border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg text-[#1A1A1A]">
              {editingItem ? "ערוך סוג עבודה" : "הוסף סוג עבודה חדש"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name_he" className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  שם בעברית <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name_he"
                  id="name_he"
                  value={formData.name_he}
                  onChange={handleInputChange}
                  placeholder="הכנס שם בעברית"
                  required
                  className="w-full border-gray-300 focus:border-[#00DAC0]"
                />
              </div>
              <div>
                <label htmlFor="name_en" className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  שם באנגלית <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name_en"
                  id="name_en"
                  value={formData.name_en}
                  onChange={handleInputChange}
                  placeholder="Enter English name"
                  required
                  className="w-full border-gray-300 focus:border-[#00DAC0]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 border-gray-300 text-[#1A1A1A] hover:bg-gray-100"
                >
                  <X className="w-4 h-4" /> ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#00DAC0] hover:bg-[#00C4B4] text-white flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  שמור
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && workTypes.length === 0 && !showForm ? (
        <div className="space-y-3 mt-4">
          <p className="text-sm text-gray-500 text-center">טוען סוגי עבודה...</p>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 shadow-sm border-gray-200">
              <Skeleton className="h-5 w-3/4 bg-gray-200" />
            </Card>
          ))}
        </div>
      ) : null}

      {!isLoading && workTypes.length === 0 && !showForm ? (
        <Card className="mt-4 border-dashed border-gray-300">
          <CardContent className="p-6 text-center text-gray-500">
            <p>לא נמצאו סוגי עבודה. לחץ על 'הוסף חדש' כדי להתחיל.</p>
          </CardContent>
        </Card>
      ) : null}

      {workTypes.length > 0 && (
        <div className="space-y-3 mt-4">
          {workTypes.map((workType) => (
            <Card
              key={workType.id}
              className="p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow border-gray-200"
            >
              <div>
                <p className="font-medium text-[#1A1A1A]">{workType.name_he}</p>
                <p className="text-xs text-gray-500">שם באנגלית: {workType.name_en}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(workType)}>
                  <Edit2 className="w-4 h-4 text-gray-600 hover:text-[#1A1A1A]" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(workType.id)}>
                  <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
