"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import { createClient } from "@/lib/supabase/client"

// Work Type entity for database operations
const WorkTypeEntity = {
  async list() {
    const supabase = createClient()
    const { data, error } = await supabase.from("work_types").select("*").order("name_he", { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(workTypeData: any) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("work_types")
      .insert([
        {
          name_he: workTypeData.name_he,
          name_en: workTypeData.name_en,
          created_by: "root",
          created_by_id: "550e8400-e29b-41d4-a716-446655440000",
          created_date: new Date().toISOString(),
          is_sample: false,
        },
      ])
      .select()

    if (error) throw error
    return data[0]
  },

  async update(id: string, workTypeData: any) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("work_types")
      .update({
        name_he: workTypeData.name_he,
        name_en: workTypeData.name_en,
        updated_date: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) throw error
    return data[0]
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("work_types").delete().eq("id", id)

    if (error) throw error
  },
}

const workTypeFields = [
  {
    name: "name_he",
    labelHe: "שם בעברית",
    labelEn: "Hebrew Name",
    placeholderHe: "הכנס שם סוג העבודה בעברית...",
    placeholderEn: "Enter work type name in Hebrew...",
    type: "text",
    required: true,
  },
  {
    name: "name_en",
    labelHe: "שם באנגלית",
    labelEn: "English Name",
    placeholderHe: "הכנס שם סוג העבודה באנגלית...",
    placeholderEn: "Enter work type name in English...",
    type: "text",
    required: true,
  },
]

export default function JobTypesResourcePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <div className="text-right mb-6">
            <h1 className="text-3xl font-bold text-gray-900">סוגי עבודה</h1>
            <p className="text-gray-600">ניהול סוגי העבודות במערכת</p>
          </div>

          <Suspense fallback={<div className="p-6">טוען...</div>}>
            <ManageGenericList
              Entity={WorkTypeEntity}
              entityName="סוג עבודה"
              entityNamePlural="סוגי עבודה"
              fields={workTypeFields}
              displayField="name_he"
              language="he"
            />
          </Suspense>
        </div>
      </MainContent>

      <SidebarNavigation />
    </div>
  )
}
