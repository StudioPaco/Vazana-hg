"use client"

import WorkersPage from "@/components/workers/workers-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function Workers() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <WorkersPage />
        </div>
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
