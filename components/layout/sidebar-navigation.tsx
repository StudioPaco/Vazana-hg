"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
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
  Activity,
} from "lucide-react"
// import Image from "next/image"
import { useState, createContext, useContext, useEffect } from "react"
import { useLoading } from "./loading-overlay"
import { clientAuth } from "@/lib/client-auth"

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
  { name: "עבודה חדשה", href: "/jobs/new", icon: Plus },
  { name: "לקוחות", href: "/clients", icon: Users },
  { name: "הפקת חשבוניות", href: "/invoices/new", icon: Calculator },
  { name: "ארכיון חשבוניות", href: "/invoices/archive", icon: Archive },
  { name: "ארכיון מסמכים", href: "/documents", icon: FileText },
  { name: "מרכז תחזוקה", href: "/maintenance", icon: Activity },
  { name: "הגדרות", href: "/settings", icon: Settings },
]

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    // Load sidebar minimized setting from theme preferences
    const savedSettings = localStorage.getItem("vazana_theme_settings")
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        if (settings.sidebarMinimizedByDefault) {
          setIsMinimized(true)
        }
      } catch (error) {
        console.warn('Failed to load sidebar settings:', error)
      }
    }
  }, [])

  return <SidebarContext.Provider value={{ isMinimized, setIsMinimized }}>{children}</SidebarContext.Provider>
}

export default function SidebarNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { isMinimized, setIsMinimized } = useSidebar()
  const { setLoading } = useLoading()
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  useEffect(() => {
    const user = clientAuth.getCurrentUser()
    setCurrentUser(user)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("vazana_logged_in")
    localStorage.removeItem("vazana_user")
    window.location.href = "/auth/login"
  }

  const handleNavigation = (href: string) => {
    // Temporarily disabled loading overlay for better performance
    // setLoading(true)
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
          {isMinimized ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {!isMinimized && (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-[120px] h-[60px] bg-vazana-yellow rounded-md flex items-center justify-center">
              <span className="text-vazana-dark font-bold text-lg font-hebrew">Vazana</span>
            </div>
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
      <nav className={`${isMinimized ? "p-3" : "p-4"} space-y-2`}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`group relative flex items-center w-full ${
                isMinimized ? "justify-center p-4" : "justify-end gap-3 px-4 py-3"
              } rounded-lg transition-colors font-hebrew ${
                isActive ? "bg-vazana-yellow text-vazana-dark font-semibold" : "text-gray-700 hover:bg-gray-100"
              }`}
              title={isMinimized ? item.name : undefined}
            >
              {!isMinimized && <span>{item.name}</span>}
              <item.icon className="w-6 h-6 flex-shrink-0" />

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
            <p className="text-sm font-semibold text-vazana-dark font-hebrew">
              שלום, {currentUser?.full_name || currentUser?.username || 'משתמש'}
            </p>
            <p className="text-xs text-gray-600 font-hebrew">
              {currentUser?.username === 'root' ? 'מנהל מערכת ראשי' : 'משתמש'}
            </p>
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
