"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import { createClient } from "@/lib/supabase/client"

// Vehicle entity for database operations
const VehicleEntity = {
  async list() {
    const supabase = createClient()
    const { data, error } = await supabase.from("vehicles").select("*").order("license_plate", { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(vehicleData: any) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("vehicles")
      .insert([
        {
          license_plate: vehicleData.license_plate,
          name: vehicleData.name,
          details: vehicleData.details,
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

  async update(id: string, vehicleData: any) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("vehicles")
      .update({
        license_plate: vehicleData.license_plate,
        name: vehicleData.name,
        details: vehicleData.details,
        updated_date: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) throw error
    return data[0]
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("vehicles").delete().eq("id", id)

    if (error) throw error
  },
}

const vehicleFields = [
  {
    name: "license_plate",
    labelHe: "מספר רישוי",
    labelEn: "License Plate",
    placeholderHe: "הכנס מספר רישוי...",
    placeholderEn: "Enter license plate...",
    type: "text",
    required: true,
  },
  {
    name: "name",
    labelHe: "שם הרכב",
    labelEn: "Vehicle Name",
    placeholderHe: "הכנס שם הרכב...",
    placeholderEn: "Enter vehicle name...",
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

export default function VehiclesResourcePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <div className="text-right mb-6">
            <h1 className="text-3xl font-bold text-gray-900">כלי רכב</h1>
            <p className="text-gray-600">ניהול צי הרכבים שלך</p>
          </div>

          <Suspense fallback={<div className="p-6">טוען...</div>}>
            <ManageGenericList
              Entity={VehicleEntity}
              entityName="רכב"
              entityNamePlural="רכבים"
              fields={vehicleFields}
              displayField="license_plate"
              language="he"
            />
          </Suspense>
        </div>
      </MainContent>

      <SidebarNavigation />
    </div>
  )
}
