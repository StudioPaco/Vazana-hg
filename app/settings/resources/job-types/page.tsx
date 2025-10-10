"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import AppNavigation from "@/components/layout/app-navigation"
import { WorkType } from "@/lib/api-entities"

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
          <AppNavigation />
          <div className="text-right mb-6">
            <h1 className="text-3xl font-bold text-gray-900">סוגי עבודה</h1>
            <p className="text-gray-600">ניהול סוגי העבודות במערכת</p>
          </div>

          <Suspense fallback={<div className="p-6">טוען...</div>}>
            <ManageGenericList
              Entity={WorkType}
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
