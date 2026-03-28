"use client"

import MainDashboard from "@/components/dashboard/main-dashboard"
import PageLayout from "@/components/layout/page-layout"
import { BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <PageLayout
      title="לוח בקרה"
      subtitle="ברוכים השבים למערכת ניהול"
      titleIcon={BarChart3}
      variant="list"
      showStats={false}
    >
      <MainDashboard showHeader={false} />
    </PageLayout>
  )
}
