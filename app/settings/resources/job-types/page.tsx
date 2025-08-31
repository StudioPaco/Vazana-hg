"use client"

import { Suspense } from "react"
import WorkTypesPage from "@/components/work-types/work-types-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function JobTypesResourcePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <Suspense fallback={<div className="p-6">טוען...</div>}>
            <WorkTypesPage />
          </Suspense>
        </div>
      </MainContent>

      {/* Sidebar Navigation */}
      <SidebarNavigation />
    </div>
  )
}
