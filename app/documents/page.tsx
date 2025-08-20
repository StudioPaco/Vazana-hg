import SidebarNavigation from "@/components/layout/sidebar-navigation"
import { DocumentsPage } from "@/components/documents/documents-page"

export default function Documents() {
  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <SidebarNavigation />
      <main className="flex-1 mr-64">
        <div className="p-6">
          <DocumentsPage />
        </div>
      </main>
    </div>
  )
}
