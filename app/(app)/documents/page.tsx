"use client"

import { DocumentsPage } from "@/components/documents/documents-page"
import PageLayout from "@/components/layout/page-layout"
import { FileText } from "lucide-react"

export default function Documents() {
  return (
    <PageLayout
      title="ניהול מסמכים"
      subtitle="נהל ושמור מסמכים של המערכת"
      titleIcon={FileText}
      backHref="/"
      variant="list"
      showStats={false}
    >
      <DocumentsPage showHeader={false} />
    </PageLayout>
  )
}
