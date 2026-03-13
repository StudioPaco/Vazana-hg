"use client"

import SidebarNavigation from "@/components/layout/sidebar-navigation"
import NewJobForm from "@/components/jobs/new-job-form"
import AppNavigation from "@/components/layout/app-navigation"

export default function NewJobPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <SidebarNavigation />
      <div className="flex-1 mr-64 p-6">
        <AppNavigation />
        <NewJobForm />
      </div>
    </div>
  )
}
