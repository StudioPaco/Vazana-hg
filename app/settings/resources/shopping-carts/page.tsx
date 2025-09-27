"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import { Cart } from "@/entities/all"

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
              Entity={Cart}
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
