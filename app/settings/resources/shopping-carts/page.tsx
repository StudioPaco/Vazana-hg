"use client"

import { Suspense } from "react"
import CartsPage from "@/components/carts/carts-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function CartsResourcePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <Suspense fallback={<div className="p-6">טוען...</div>}>
            <CartsPage />
          </Suspense>
        </div>
      </MainContent>

      {/* Sidebar Navigation */}
      <SidebarNavigation />
    </div>
  )
}
