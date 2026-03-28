"use client"

import CartsPage from "@/components/carts/carts-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function Carts() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <CartsPage />
        </div>
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
