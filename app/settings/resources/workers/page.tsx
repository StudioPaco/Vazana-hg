"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import { Worker } from "@/entities/all"

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
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <div className="text-right mb-6">
            <h1 className="text-3xl font-bold text-gray-900">עובדים</h1>
            <p className="text-gray-600">ניהול כוח האדם שלך</p>
          </div>

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
        </div>
      </MainContent>

      <SidebarNavigation />
    </div>
  )
}
