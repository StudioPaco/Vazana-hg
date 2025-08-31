"use client"

import { WorkType } from "@/entities/all"
import ManageGenericList from "@/components/manage-generic-list"

const workTypeFields = [
  {
    name: "name_he",
    labelHe: "שם בעברית",
    labelEn: "Name (Hebrew)",
    placeholderHe: "הכנס שם בעברית",
    placeholderEn: "Enter Hebrew name",
    required: true,
    type: "text",
  },
  {
    name: "name_en",
    labelHe: "שם באנגלית",
    labelEn: "Name (English)",
    placeholderHe: "הכנס שם באנגלית",
    placeholderEn: "Enter English name",
    required: true,
    type: "text",
  },
]

export default function WorkTypesPage() {
  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-gray-900">סוגי עבודה</h1>
        <p className="text-gray-600">ניהול סוגי העבודות הזמינות במערכת</p>
      </div>

      <ManageGenericList
        Entity={WorkType}
        entityName="סוג עבודה"
        entityNamePlural="סוגי עבודה"
        fields={workTypeFields}
        displayField="name_he"
        language="he"
      />
    </div>
  )
}
