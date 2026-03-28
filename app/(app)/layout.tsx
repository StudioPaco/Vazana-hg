"use client"

import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainContent>
        <div className="p-6">
          {children}
        </div>
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
