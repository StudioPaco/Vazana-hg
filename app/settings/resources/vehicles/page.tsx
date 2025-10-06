"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import { Vehicle } from "@/lib/api-entities"

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
              Entity={Vehicle}
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
