"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Briefcase, FileText, Settings, Archive, Calculator, Plus, LogOut } from "lucide-react"
import Image from "next/image"

const navigationItems = [
  { name: "ניווט", href: "/", icon: Home },
  { name: "עבודות", href: "/jobs", icon: Briefcase },
  { name: "לקוחות", href: "/clients", icon: Users },
  { name: "עבודה חדשה", href: "/jobs/new", icon: Plus },
  { name: "הפקת חשבוניות", href: "/invoices", icon: Calculator },
  { name: "ארכיון חשבוניות", href: "/invoices/archive", icon: Archive },
  { name: "ארכיון מסמכים", href: "/documents", icon: FileText },
  { name: "הגדרות", href: "/settings", icon: Settings },
]

export default function SidebarNavigation() {
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem("vazana_logged_in")
    localStorage.removeItem("vazana_user")
    window.location.href = "/auth/login"
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 h-screen fixed right-0 top-0 z-40 shadow-lg">
      {/* Header with Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col items-center justify-center space-y-3">
          <Image src="/images/vazana-logo.png" alt="Vazana Logo" width={120} height={60} className="object-contain" />
          <div className="text-center">
            <p className="text-sm text-gray-600 font-hebrew">ניהול לקוחות ועבודות</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-end gap-3 px-4 py-3 rounded-lg transition-colors font-hebrew ${
                isActive ? "bg-vazana-yellow text-vazana-dark font-semibold" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{item.name}</span>
              <item.icon className="w-5 h-5" />
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="text-right mb-3">
          <p className="text-sm font-semibold text-vazana-dark font-hebrew">שלום, root</p>
          <p className="text-xs text-gray-600 font-hebrew">מנהל מערכת</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-hebrew"
        >
          <span>התנתק</span>
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
