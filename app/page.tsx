"use client"

import MainDashboard from "@/components/dashboard/main-dashboard"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <MainDashboard />
        </div>
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
