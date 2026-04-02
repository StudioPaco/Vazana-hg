"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit2, Trash2, Save, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface WorkTypesPageProps {
  showHeader?: boolean
}

export default function WorkTypesPage({ showHeader = true }: WorkTypesPageProps) {
  const [workTypes, setWorkTypes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState({
    name_he: "",
    name_en: "",
    default_rate: "",
  })

  useEffect(() => {
    loadWorkTypes()
  }, [])

  const loadWorkTypes = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("work_types").select("*").order("created_date", { ascending: false })

      if (error) {
        console.error("Error loading work types:", error)
        toast({ title: `שגיאה בטעינת סוגי עבודה: ${error.message}`, variant: "destructive" })
        setWorkTypes([])
      } else {
        setWorkTypes(data || [])
      }
    } catch (error) {
      console.error("Failed to load work types:", error)
      toast({ title: "שגיאת חיבור - בדוק את החיבור לאינטרנט", variant: "destructive" })
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

    if (!formData.name_he.trim()) {
      toast({ title: "שם בעברית הוא שדה חובה", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = createClient()

      const payload = {
        name_he: formData.name_he,
        name_en: formData.name_en || null,
        default_rate: formData.default_rate ? Number(formData.default_rate) : null,
      }

      if (editingItem) {
        const { error } = await supabase.from("work_types").update(payload).eq("id", editingItem.id)

        if (error) {
          console.error("Error updating work type:", error)
          throw error
        }
      } else {
        const { error } = await supabase.from("work_types").insert([payload])

        if (error) {
          console.error("Error creating work type:", error)
          throw error
        }
      }

      setShowForm(false)
      setEditingItem(null)
      setFormData({ name_he: "", name_en: "", default_rate: "" })
      loadWorkTypes()
    } catch (error) {
      console.error("Error saving work type:", error)
      toast({ title: "שגיאה בשמירת סוג העבודה", variant: "destructive" })
    }
    setIsSubmitting(false)
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormData({
      name_he: item.name_he || "",
      name_en: item.name_en || "",
      default_rate: item.default_rate?.toString() || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (itemId: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק סוג עבודה זה? פעולה זו אינה ניתנת לביטול.")) {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("work_types").delete().eq("id", itemId)

        if (error) {
          console.error("Error deleting work type:", error)
          throw error
        }

        loadWorkTypes()
        if (editingItem && editingItem.id === itemId) {
          setShowForm(false)
          setEditingItem(null)
        }
      } catch (error) {
        console.error("Error deleting work type:", error)
        toast({ title: "שגיאה במחיקת סוג העבודה", variant: "destructive" })
      }
    }
  }

  const openNewForm = () => {
    setEditingItem(null)
    setFormData({ name_he: "", name_en: "", default_rate: "" })
    setShowForm(true)
  }

  return (
    <div className={`${showHeader ? 'p-6' : ''} space-y-4`} dir="rtl">
      {showHeader && (
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900">סוגי עבודה</h1>
          <p className="text-gray-600">ניהול סוגי העבודות הזמינות במערכת</p>
        </div>
      )}

      {showHeader && !showForm && (
        <Button onClick={openNewForm} size="sm" className="flex items-center gap-2 bg-[#FFCC00] hover:bg-[#E6B800] text-[#1A1A1A] font-hebrew">
          <Plus className="w-4 h-4" /> הוסף סוג עבודה
        </Button>
      )}

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
                  שם באנגלית
                </label>
                <Input
                  type="text"
                  name="name_en"
                  id="name_en"
                  value={formData.name_en}
                  onChange={handleInputChange}
                  placeholder="Enter English name"
                  className="w-full border-gray-300 focus:border-[#00DAC0]"
                />
              </div>
              <div>
                <label htmlFor="default_rate" className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  תעריף ברירת מחדל (₪)
                </label>
                <Input
                  type="number"
                  name="default_rate"
                  id="default_rate"
                  value={formData.default_rate}
                  onChange={handleInputChange}
                  placeholder="לדוגמה: 800"
                  step="10"
                  min="0"
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
            <p>לא נמצאו סוגי עבודה. לחץ על &apos;הוסף חדש&apos; כדי להתחיל.</p>
          </CardContent>
        </Card>
      ) : null}

      {workTypes.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="text-start p-3 font-medium font-hebrew">שם</th>
                <th className="text-start p-3 font-medium font-hebrew">תעריף ברירת מחדל</th>
                <th className="text-start p-3 font-medium font-hebrew w-24">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {workTypes.map((workType, index) => (
                <tr
                  key={workType.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                >
                  <td className="p-3 font-medium text-[#1A1A1A] font-hebrew">{workType.name_he}</td>
                  <td className="p-3 text-gray-600">{workType.default_rate ? `₪${workType.default_rate}` : "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(workType)}>
                        <Edit2 className="w-4 h-4 text-gray-600 hover:text-[#1A1A1A]" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(workType.id)}>
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
