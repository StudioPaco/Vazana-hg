"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import PageLayout from "@/components/layout/page-layout"
import { Users } from "lucide-react"
import { Worker } from "@/lib/api-entities"

const workerFields = [
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

export default function WorkersResourcePage() {
  return (
    <PageLayout
      title="עובדים"
      subtitle="ניהול כוח האדם שלך"
      titleIcon={Users}
      backHref="/settings/resources"
      variant="list"
    >
      <Suspense fallback={<div className="p-6">טוען...</div>}>
        <ManageGenericList
          Entity={Worker}
          entityName="עובד"
          entityNamePlural="עובדים"
          fields={workerFields}
          displayField="name"
          language="he"
        />
      </Suspense>
    </PageLayout>
  )
}
