"use client"

import InvoicesPage from "@/components/invoices/invoices-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import { BackButton } from "@/components/ui/back-button"

export default function InvoiceArchivePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <MainContent>
        <div className="p-6">
          {/* Header with Back Button */}
          <div className="flex items-start justify-between mb-6">
            <BackButton href="/invoices" />
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">ארכיון חשבוניות</h1>
              <p className="text-gray-600">צפה בחשבוניות שנשלחו ושילמו</p>
            </div>
          </div>
          <InvoicesPage />
        </div>
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
