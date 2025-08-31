"use client"

import { Suspense } from "react"
import WorkersPage from "@/components/workers/workers-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function WorkersResourcePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <Suspense fallback={<div className="p-6">טוען...</div>}>
            <WorkersPage />
          </Suspense>
        </div>
      </MainContent>

      {/* Sidebar Navigation */}
      <SidebarNavigation />
    </div>
  )
}
