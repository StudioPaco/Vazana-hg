"use client"

import VehiclesPage from "@/components/vehicles/vehicles-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function Vehicles() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <VehiclesPage />
        </div>
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
