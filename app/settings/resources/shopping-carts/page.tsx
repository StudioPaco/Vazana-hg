"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import { createClient } from "@/lib/supabase/client"

// Cart entity for database operations
const CartEntity = {
  async list() {
    const supabase = createClient()
    const { data, error } = await supabase.from("carts").select("*").order("name", { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(cartData: any) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("carts")
      .insert([
        {
          name: cartData.name,
          details: cartData.details,
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

  async update(id: string, cartData: any) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("carts")
      .update({
        name: cartData.name,
        details: cartData.details,
        updated_date: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) throw error
    return data[0]
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("carts").delete().eq("id", id)

    if (error) throw error
  },
}

const cartFields = [
  {
    name: "name",
    labelHe: "שם העגלה/נגרר",
    labelEn: "Cart/Trailer Name",
    placeholderHe: "הכנס שם העגלה או הנגרר...",
    placeholderEn: "Enter cart or trailer name...",
    type: "text",
    required: true,
  },
  {
    name: "details",
    labelHe: "פרטים נוספים",
    labelEn: "Additional Details",
    placeholderHe: "הכנס פרטים נוספים...",
    placeholderEn: "Enter additional details...",
    type: "textarea",
    required: false,
  },
]

export default function CartsResourcePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <div className="text-right mb-6">
            <h1 className="text-3xl font-bold text-gray-900">עגלות ונגררים</h1>
            <p className="text-gray-600">ניהול עגלות ונגררים</p>
          </div>

          <Suspense fallback={<div className="p-6">טוען...</div>}>
            <ManageGenericList
              Entity={CartEntity}
              entityName="עגלה/נגרר"
              entityNamePlural="עגלות/נגררים"
              fields={cartFields}
              displayField="name"
              language="he"
            />
          </Suspense>
        </div>
      </MainContent>

      <SidebarNavigation />
    </div>
  )
}
