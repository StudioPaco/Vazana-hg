"use client"

import JobsPage from "@/components/jobs/jobs-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import AppNavigation from "@/components/layout/app-navigation"

export default function Jobs() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <AppNavigation />
          <JobsPage />
        </div>
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
