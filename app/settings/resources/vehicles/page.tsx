"use client"

import { Suspense } from "react"
import VehiclesPage from "@/components/vehicles/vehicles-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function VehiclesResourcePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <Suspense fallback={<div className="p-6">טוען...</div>}>
            <VehiclesPage />
          </Suspense>
        </div>
      </MainContent>

      {/* Sidebar Navigation */}
      <SidebarNavigation />
    </div>
  )
}
