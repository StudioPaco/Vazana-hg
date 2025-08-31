"use client"

import InvoicesPage from "@/components/invoices/invoices-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function Invoices() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <InvoicesPage />
        </div>
      </MainContent>

      {/* Sidebar Navigation */}
      <SidebarNavigation />
    </div>
  )
}
