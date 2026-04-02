"use client"

import PageLayout from "@/components/layout/page-layout"
import { Users } from "lucide-react"
import WorkersPage from "@/components/workers/workers-page"

export default function WorkersResourcePage() {
  return (
    <PageLayout
      title="עובדים"
      subtitle="ניהול כוח האדם שלך"
      titleIcon={Users}
      backHref="/settings/resources"
      variant="list"
    >
      <WorkersPage showHeader={false} />
    </PageLayout>
  )
}
