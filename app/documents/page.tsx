import SidebarNavigation from "@/components/layout/sidebar-navigation"
import AppNavigation from "@/components/layout/app-navigation"
import { DocumentsPage } from "@/components/documents/documents-page"

export default function Documents() {
  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <SidebarNavigation />
      <div className="flex-1 mr-64 p-6">
        <AppNavigation />
        <DocumentsPage />
      </div>
    </div>
  )
}
