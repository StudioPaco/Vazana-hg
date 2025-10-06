"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Home } from "lucide-react"

interface NavigationItem {
  path: string
  label: string
  icon?: React.ReactNode
}

const navigationMap: Record<string, NavigationItem[]> = {
  "/jobs": [
    { path: "/", label: "בית", icon: <Home className="w-4 h-4" /> }
  ],
  "/jobs/new": [
    { path: "/", label: "בית", icon: <Home className="w-4 h-4" /> },
    { path: "/jobs", label: "עבודות" }
  ],
  "/maintenance": [
    { path: "/", label: "בית", icon: <Home className="w-4 h-4" /> }
  ],
  "/reports": [
    { path: "/", label: "בית", icon: <Home className="w-4 h-4" /> }
  ],
  "/clients": [
    { path: "/", label: "בית", icon: <Home className="w-4 h-4" /> }
  ]
}

export default function AppNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  
  const breadcrumbs = navigationMap[pathname] || []
  
  // Don't show navigation on the home page
  if (pathname === "/") {
    return null
  }
  
  const handleBack = () => {
    if (breadcrumbs.length > 0) {
      const previousPage = breadcrumbs[breadcrumbs.length - 1]
      router.push(previousPage.path)
    } else {
      router.back()
    }
  }
  
  return (
    <div className="mb-6">
      {/* Minimalistic back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="flex items-center gap-2 font-hebrew text-gray-600 hover:text-vazana-teal px-2 py-1 h-auto"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה
      </Button>
    </div>
  )
}