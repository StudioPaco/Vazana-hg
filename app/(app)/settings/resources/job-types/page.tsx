"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import PageLayout from "@/components/layout/page-layout"
import { Briefcase } from "lucide-react"
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
    <PageLayout
      title="סוגי עבודות"
      subtitle="ניהול סוגי העבודות"
      titleIcon={Briefcase}
      backHref="/settings/resources"
      variant="list"
    >
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
    </PageLayout>
  )
}
