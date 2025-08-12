"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit2, Trash2, Save, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ManageGenericList({
  Entity,
  entityName,
  entityNamePlural,
  fields,
  displayField = "name_en",
  language = "he",
  textOverrides = {},
}) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const initialFormState = useMemo(() => {
    return fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || "" }), {})
  }, [fields])

  const [formData, setFormData] = useState(initialFormState)

  const isHebrew = language === "he"

  const defaultTexts = {
    en: {
      addNew: `Add New ${entityName}`,
      edit: `Edit ${entityName}`,
      save: "Save",
      cancel: "Cancel",
      deleteConfirm: `Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`,
      loading: `Loading ${entityNamePlural.toLowerCase()}...`,
      noItems: `No ${entityNamePlural.toLowerCase()} found. Click 'Add New' to get started.`,
      actions: "Actions",
      fieldRequired: "This field is required.",
    },
    he: {
      addNew: `הוסף ${entityName} חדש`,
      edit: `ערוך ${entityName}`,
      save: "שמור",
      cancel: "ביטול",
      deleteConfirm: `האם אתה בטוח שברצונך למחוק ${entityName.toLowerCase()} זה? פעולה זו אינה ניתנת לביטול.`,
      loading: `טוען ${entityNamePlural.toLowerCase()}...`,
      noItems: `לא נמצאו ${entityNamePlural.toLowerCase()}. לחץ על 'הוסף חדש' כדי להתחיל.`,
      actions: "פעולות",
      fieldRequired: "שדה חובה.",
    },
  }
  const t = {
    ...defaultTexts[language],
    ...textOverrides,
  }

  useEffect(() => {
    loadItems()
  }, [Entity])

  useEffect(() => {
    if (editingItem) {
      const currentItemData = fields.reduce(
        (acc, field) => ({ ...acc, [field.name]: editingItem[field.name] || "" }),
        {},
      )
      setFormData(currentItemData)
    } else {
      const freshInitialState = fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || "" }), {})
      setFormData(freshInitialState)
    }
  }, [editingItem, fields])

  const loadItems = async () => {
    setIsLoading(true)
    try {
      const data = await Entity.list()
      setItems(data)
    } catch (error) {
      console.error(`Error loading ${entityNamePlural}:`, error)
    }
    setIsLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    for (const field of fields) {
      if (field.required && !formData[field.name]?.trim()) {
        alert(`${isHebrew ? field.labelHe : field.labelEn} ${t.fieldRequired}`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      if (editingItem) {
        await Entity.update(editingItem.id, formData)
      } else {
        await Entity.create(formData)
      }
      setShowForm(false)
      setEditingItem(null)
      loadItems()
    } catch (error) {
      console.error(`Error saving ${entityName}:`, error)
    }
    setIsSubmitting(false)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleDelete = async (itemId) => {
    if (window.confirm(t.deleteConfirm)) {
      setIsLoading(true)
      try {
        await Entity.delete(itemId)
        loadItems()
        if (editingItem && editingItem.id === itemId) {
          setShowForm(false)
          setEditingItem(null)
        }
      } catch (error) {
        console.error(`Error deleting ${entityName}:`, error)
      }
      setIsLoading(false)
    }
  }

  const openNewForm = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <Button onClick={openNewForm} className="flex items-center gap-2 bg-[#FFCC00] hover:bg-[#E6B800] text-[#1A1A1A]">
        <Plus className="w-4 h-4" /> {t.addNew}
      </Button>

      {showForm && (
        <Card className="shadow-md border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg text-[#1A1A1A]">{editingItem ? t.edit : t.addNew}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-[#1A1A1A] mb-1">
                    {isHebrew ? field.labelHe : field.labelEn}{" "}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea
                      name={field.name}
                      id={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      placeholder={isHebrew ? field.placeholderHe : field.placeholderEn}
                      required={field.required}
                      className="w-full min-h-[80px] border-gray-300 focus:border-[#00DAC0]"
                      rows={3}
                    />
                  ) : (
                    <Input
                      type={field.type || "text"}
                      name={field.name}
                      id={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      placeholder={isHebrew ? field.placeholderHe : field.placeholderEn}
                      required={field.required}
                      className="w-full border-gray-300 focus:border-[#00DAC0]"
                    />
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 border-gray-300 text-[#1A1A1A] hover:bg-gray-100"
                >
                  <X className="w-4 h-4" /> {t.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="bg-[#00DAC0] hover:bg-[#00C4B4] text-white flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div
                      className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      role="status"
                    >
                      <span className="sr-only">Loading...</span>
                    </div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {t.save}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && items.length === 0 && !showForm ? (
        <div className="space-y-3 mt-4">
          <p className="text-sm text-gray-500 text-center">{t.loading}</p>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 shadow-sm border-gray-200">
              <Skeleton className="h-5 w-3/4 bg-gray-200" />
            </Card>
          ))}
        </div>
      ) : null}

      {!isLoading && items.length === 0 && !showForm ? (
        <Card className="mt-4 border-dashed border-gray-300">
          <CardContent className="p-6 text-center text-gray-500">
            <p>{t.noItems}</p>
          </CardContent>
        </Card>
      ) : null}

      {items.length > 0 && (
        <div className="space-y-3 mt-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow border-gray-200"
            >
              <div>
                <p className="font-medium text-[#1A1A1A]">{item[displayField] || item.name || item.name_en || "N/A"}</p>
                {entityName === (isHebrew ? "סוג עבודה" : "Work Type") &&
                  item.name_he &&
                  displayField !== "name_he" && (
                    <p className="text-xs text-gray-500">
                      {isHebrew ? "שם בעברית" : "Name (HE)"}: {item.name_he}
                    </p>
                  )}
                {fields
                  .filter(
                    (f) =>
                      f.name !== displayField &&
                      f.name !== "details" &&
                      f.name !== "name_en" &&
                      f.name !== "name_he" &&
                      item[f.name],
                  )
                  .map((f) => (
                    <p key={f.name} className="text-xs text-gray-500">
                      {isHebrew ? f.labelHe : f.labelEn}: {item[f.name]}
                    </p>
                  ))}
                {item.details && <p className="text-sm text-gray-600 mt-1">{item.details}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} aria-label={t.edit}>
                  <Edit2 className="w-4 h-4 text-gray-600 hover:text-[#1A1A1A]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  aria-label={isHebrew ? "מחק" : "Delete"}
                >
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
