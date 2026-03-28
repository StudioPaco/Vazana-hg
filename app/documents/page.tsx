"use client"

import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import AppNavigation from "@/components/layout/app-navigation"
import { DocumentsPage } from "@/components/documents/documents-page"

export default function Documents() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          <AppNavigation />
          <DocumentsPage />
        </div>
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
