"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import PageLayout from "@/components/layout/page-layout"
import { Truck } from "lucide-react"
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
    <PageLayout
      title="כלי רכב"
      subtitle="ניהול צי הרכבים"
      titleIcon={Truck}
      backHref="/settings/resources"
      variant="list"
    >
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
    </PageLayout>
  )
}
