"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Briefcase,
  FileText,
  Settings,
  Archive,
  Calculator,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Image from "next/image"
import { useState, createContext, useContext } from "react"

const SidebarContext = createContext<{
  isMinimized: boolean
  setIsMinimized: (value: boolean) => void
}>({
  isMinimized: false,
  setIsMinimized: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

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

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(false)

  return <SidebarContext.Provider value={{ isMinimized, setIsMinimized }}>{children}</SidebarContext.Provider>
}

export default function SidebarNavigation() {
  const pathname = usePathname()
  const { isMinimized, setIsMinimized } = useSidebar()

  const handleLogout = () => {
    localStorage.removeItem("vazana_logged_in")
    localStorage.removeItem("vazana_user")
    window.location.href = "/auth/login"
  }

  return (
    <div
      className={`${
        isMinimized ? "w-20" : "w-64"
      } bg-white border-l border-gray-200 h-screen fixed right-0 top-0 z-40 shadow-lg transition-all duration-300`}
    >
      {/* Header with Logo */}
      <div className={`${isMinimized ? "p-2" : "p-6"} border-b border-gray-200 relative`}>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="absolute left-2 top-2 p-1 rounded-md hover:bg-gray-100 transition-colors z-10"
        >
          {isMinimized ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {!isMinimized && (
          <div className="flex flex-col items-center justify-center space-y-3">
            <Image src="/images/vazana-logo.png" alt="Vazana Logo" width={120} height={60} className="object-contain" />
            <div className="text-center">
              <p className="text-sm text-gray-600 font-hebrew">ניהול לקוחות ועבודות</p>
            </div>
          </div>
        )}

        {isMinimized && (
          <div className="flex justify-center mt-8">
            <div className="w-8 h-8 bg-vazana-yellow rounded-md flex items-center justify-center">
              <span className="text-vazana-dark font-bold text-sm">V</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`${isMinimized ? "p-2" : "p-4"} space-y-2`}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center ${
                isMinimized ? "justify-center p-3" : "justify-end gap-3 px-4 py-3"
              } rounded-lg transition-colors font-hebrew ${
                isActive ? "bg-vazana-yellow text-vazana-dark font-semibold" : "text-gray-700 hover:bg-gray-100"
              }`}
              title={isMinimized ? item.name : undefined}
            >
              {!isMinimized && <span>{item.name}</span>}
              <item.icon className="w-5 h-5 flex-shrink-0" />

              {isMinimized && (
                <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {item.name}
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className={`absolute bottom-0 left-0 right-0 ${isMinimized ? "p-2" : "p-4"} border-t border-gray-200`}>
        {!isMinimized && (
          <div className="text-right mb-3">
            <p className="text-sm font-semibold text-vazana-dark font-hebrew">שלום, root</p>
            <p className="text-xs text-gray-600 font-hebrew">מנהל מערכת</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`group relative flex items-center ${
            isMinimized ? "justify-center p-3" : "justify-center gap-2 px-4 py-2"
          } w-full bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-hebrew`}
          title={isMinimized ? "התנתק" : undefined}
        >
          {!isMinimized && <span>התנתק</span>}
          <LogOut className="w-4 h-4 flex-shrink-0" />

          {isMinimized && (
            <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
              התנתק
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
