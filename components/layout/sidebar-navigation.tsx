"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useState, createContext, useContext } from "react"
import { useLoading } from "./loading-overlay"

const SidebarContext = createContext<{
  isMinimized: boolean
  setIsMinimized: (value: boolean) => void
}>({
  isMinimized: false,
  setIsMinimized: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

const navigationItems = [
  { name: "ניווט", href: "/", icon: "🏠" },
  { name: "עבודות", href: "/jobs", icon: "💼" },
  { name: "לקוחות", href: "/clients", icon: "👥" },
  { name: "עבודה חדשה", href: "/jobs/new", icon: "➕" },
  { name: "הפקת חשבוניות", href: "/invoices", icon: "🧮" },
  { name: "ארכיון חשבוניות", href: "/invoices/archive", icon: "📦" },
  { name: "ארכיון מסמכים", href: "/documents", icon: "📄" },
  { name: "הגדרות", href: "/settings", icon: "⚙️" },
  { name: "בדיקת מסד נתונים", href: "/debug", icon: "🔧" },
]

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(false)

  return <SidebarContext.Provider value={{ isMinimized, setIsMinimized }}>{children}</SidebarContext.Provider>
}

export default function SidebarNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { isMinimized, setIsMinimized } = useSidebar()
  const { setLoading } = useLoading()

  const handleLogout = () => {
    localStorage.removeItem("vazana_logged_in")
    localStorage.removeItem("vazana_user")
    window.location.href = "/auth/login"
  }

  const handleNavigation = (href: string) => {
    setLoading(true)
    router.prefetch(href)
    router.push(href)
  }

  return (
    <div
      className={`${
        isMinimized ? "w-24" : "w-64"
      } bg-white border-l border-gray-200 h-screen fixed right-0 top-0 z-40 shadow-lg transition-all duration-300`}
    >
      {/* Header with Logo */}
      <div className={`${isMinimized ? "p-3" : "p-6"} border-b border-gray-200 relative`}>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="absolute left-2 top-2 p-1 rounded-md hover:bg-gray-100 transition-colors z-10"
        >
          {isMinimized ? "◀" : "▶"}
        </button>

        {!isMinimized && (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-24 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-lg">Vazana</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">ניהול לקוחות ועבודות</p>
            </div>
          </div>
        )}

        {isMinimized && (
          <div className="flex justify-center mt-8">
            <div className="w-8 h-8 bg-yellow-400 rounded-md flex items-center justify-center">
              <span className="text-gray-900 font-bold text-sm">V</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`${isMinimized ? "p-3" : "p-4"} space-y-2`}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`group relative flex items-center w-full ${
                isMinimized ? "justify-center p-4" : "justify-end gap-3 px-4 py-3"
              } rounded-lg transition-colors ${
                isActive ? "bg-yellow-400 text-gray-900 font-semibold" : "text-gray-700 hover:bg-gray-100"
              }`}
              title={isMinimized ? item.name : undefined}
            >
              {!isMinimized && <span>{item.name}</span>}
              <span className="text-xl flex-shrink-0">{item.icon}</span>

              {isMinimized && (
                <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {item.name}
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className={`absolute bottom-0 left-0 right-0 ${isMinimized ? "p-2" : "p-4"} border-t border-gray-200`}>
        {!isMinimized && (
          <div className="text-right mb-3">
            <p className="text-sm font-semibold text-gray-900">שלום, root</p>
            <p className="text-xs text-gray-600">מנהל מערכת</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`group relative flex items-center ${
            isMinimized ? "justify-center p-3" : "justify-center gap-2 px-4 py-2"
          } w-full bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors`}
          title={isMinimized ? "התנתק" : undefined}
        >
          {!isMinimized && <span>התנתק</span>}
          <span className="text-lg flex-shrink-0">🚪</span>

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

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isMinimized } = useSidebar()

  return (
    <div
      className={`transition-all duration-300 w-full`}
      style={{
        marginRight: isMinimized ? "96px" : "256px",
        minHeight: "100vh",
        width: `calc(100vw - ${isMinimized ? "96px" : "256px"})`,
      }}
    >
      {children}
    </div>
  )
}
