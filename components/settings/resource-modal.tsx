"use client"

import { useState, useEffect, Suspense } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ManageGenericList from "@/components/manage-generic-list"
import { Worker, Vehicle, Cart, WorkType } from "@/lib/api-entities"
import { Users, Car, ShoppingCart, Briefcase } from "lucide-react"
import { getModalClasses } from "@/lib/modal-utils"

interface ResourceModalProps {
  type: "workers" | "vehicles" | "carts" | "job-types"
  open: boolean
  onOpenChange: (open: boolean) => void
}

const resourceConfigs = {
  workers: {
    Entity: Worker,
    title: "עובדים",
    entityName: "עובד",
    entityNamePlural: "עובדים",
    icon: Users,
    displayField: "name",
    fields: [
      {
        name: "name",
        labelHe: "שם העובד",
        labelEn: "Worker Name",
        placeholderHe: "הכנס שם העובד...",
        placeholderEn: "Enter worker name...",
        type: "text",
        required: true,
      },
      {
        name: "phone_number",
        labelHe: "מספר טלפון",
        labelEn: "Phone Number",
        placeholderHe: "הכנס מספר טלפון...",
        placeholderEn: "Enter phone number...",
        type: "tel",
        required: true,
      },
      {
        name: "address",
        labelHe: "כתובת",
        labelEn: "Address",
        placeholderHe: "הכנס כתובת...",
        placeholderEn: "Enter address...",
        type: "text",
        required: false,
      },
      {
        name: "shift_rate",
        labelHe: "תעריף משמרת (₪)",
        labelEn: "Shift Rate (₪)",
        placeholderHe: "הכנס תעריף משמרת...",
        placeholderEn: "Enter shift rate...",
        type: "number",
        required: true,
      },
      {
        name: "payment_terms_days",
        labelHe: "תנאי תשלום (ימים)",
        labelEn: "Payment Terms (Days)",
        placeholderHe: "הכנס מספר ימים...",
        placeholderEn: "Enter number of days...",
        type: "number",
        required: false,
        defaultValue: "30",
      },
      {
        name: "notes",
        labelHe: "הערות",
        labelEn: "Notes",
        placeholderHe: "הכנס הערות...",
        placeholderEn: "Enter notes...",
        type: "textarea",
        required: false,
      },
    ]
  },
  vehicles: {
    Entity: Vehicle,
    title: "כלי רכב",
    entityName: "רכב",
    entityNamePlural: "רכבים",
    icon: Car,
    displayField: "license_plate",
    fields: [
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
  },
  carts: {
    Entity: Cart,
    title: "עגלות/נגררים",
    entityName: "עגלה/נגרר",
    entityNamePlural: "עגלות/נגררים",
    icon: ShoppingCart,
    displayField: "name",
    fields: [
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
  },
  "job-types": {
    Entity: WorkType,
    title: "סוגי עבודה",
    entityName: "סוג עבודה",
    entityNamePlural: "סוגי עבודה",
    icon: Briefcase,
    displayField: "name_he",
    fields: [
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
  }
}

export default function ResourceModal({ type, open, onOpenChange }: ResourceModalProps) {
  const config = resourceConfigs[type]
  
  if (!config) return null
  
  const Icon = config.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getModalClasses('xl', true)}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between font-hebrew">
            <Icon className="w-6 h-6 text-vazana-teal" />
            <span>{config.title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="scroll-content p-1">
          <div className="py-4">
            <Suspense fallback={<div className="p-6 text-center font-hebrew">טוען...</div>}>
              <ManageGenericList
                Entity={config.Entity}
                entityName={config.entityName}
                entityNamePlural={config.entityNamePlural}
                fields={config.fields}
                displayField={config.displayField}
                language="he"
                rtl={true}
                workerLayout={type === "workers"}
              />
            </Suspense>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}