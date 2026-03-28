"use client"

import { Suspense } from "react"
import ManageGenericList from "@/components/manage-generic-list"
import PageLayout from "@/components/layout/page-layout"
import { ShoppingCart } from "lucide-react"
import { Cart } from "@/lib/api-entities"

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
    <PageLayout
      title="עגלות"
      subtitle="ניהול העגלות"
      titleIcon={ShoppingCart}
      backHref="/settings/resources"
      variant="list"
    >
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
    </PageLayout>
  )
}
