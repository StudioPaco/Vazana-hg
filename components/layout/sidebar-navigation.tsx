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
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Image from "next/image"
import { useState, createContext, useContext, useEffect } from "react"
import { useLoading } from "./loading-overlay"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"

const SidebarContext = createContext<{
  isMinimized: boolean
  setIsMinimized: (value: boolean) => void
}>({
  isMinimized: false,
  setIsMinimized: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

const navigationItems = [
  { name: "ראשי", href: "/", icon: Home },
  { name: "עבודות", href: "/jobs", icon: Briefcase },
  { name: "לקוחות", href: "/clients", icon: Users },
  { name: "חשבוניות", href: "/invoices", icon: FileText },
  { name: "מסמכים", href: "/documents", icon: Archive },
  { name: "יומן", href: "/calendar", icon: Calendar },
]

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
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
  const { profile } = useAuth()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  const handleNavigation = (href: string) => {
    router.prefetch(href)
    router.push(href)
  }

  const isSettingsActive = pathname?.startsWith("/settings") || pathname === "/maintenance"

  return (
    <div
      className={`${
        isMinimized ? "w-20" : "w-64"
      } bg-white border-l border-gray-200 h-screen fixed right-0 top-0 z-40 shadow-lg transition-all duration-300 overflow-x-hidden`}
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
            <Image
              src="/VazanaLogo-02.png"
              alt="Vazana Logo"
              width={140}
              height={70}
              className="object-contain"
              priority
            />
            <div className="text-center">
              <p className="text-sm text-gray-600 font-hebrew">ניהול לקוחות ועבודות</p>
            </div>
          </div>
        )}

        {isMinimized && (
          <div className="h-6 mt-6" />
        )}
      </div>

      {/* Navigation */}
      <nav className={`${isMinimized ? "p-2" : "p-4"} space-y-1 overflow-y-auto overflow-x-hidden`} style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`group relative flex items-center w-full ${
                isMinimized ? "justify-center p-3" : "px-4 py-2.5"
              } rounded-lg transition-colors font-hebrew ${
                isActive ? "bg-vazana-yellow text-vazana-dark font-semibold" : "text-gray-700 hover:bg-gray-100"
              }`}
              dir="rtl"
              title={isMinimized ? item.name : undefined}
            >
              <item.icon className="w-6 h-6 flex-shrink-0 mx-3" />
              {!isMinimized && <span className="flex-1">{item.name}</span>}

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

      {/* Bottom section: Settings + User + Logout */}
      <div className={`absolute bottom-0 left-0 right-0 ${isMinimized ? "p-2" : "p-4"} border-t border-gray-200 overflow-hidden`}>
        {/* Logo when collapsed */}
        {isMinimized && (
          <div className="flex justify-center mb-6 pt-4">
            <Image
              src="/VazanaLogo-02.png"
              alt="Vazana"
              width={100}
              height={100}
              className="object-contain"
              style={{ transform: 'rotate(-90deg)' }}
            />
          </div>
        )}

        {/* Settings button — always visible */}
        <button
          onClick={() => handleNavigation("/settings")}
          className={`group relative flex items-center w-full ${
            isMinimized ? "justify-center p-3" : "px-4 py-2.5"
          } rounded-lg transition-colors font-hebrew mb-4 ${
            isSettingsActive ? "bg-vazana-yellow text-vazana-dark font-semibold" : "text-gray-700 hover:bg-gray-100"
          }`}
          dir="rtl"
          title={isMinimized ? "הגדרות" : undefined}
        >
          <Settings className="w-6 h-6 flex-shrink-0" />

          {isMinimized && (
            <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
              הגדרות
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
            </div>
          )}
        </button>

        {/* User greeting */}
        {!isMinimized && (
          <div className="text-right px-2 mb-2">
            <p className="text-sm font-semibold text-vazana-dark font-hebrew">
              שלום, {profile?.full_name || profile?.username || 'משתמש'}
            </p>
            <p className="text-xs text-gray-600 font-hebrew">
              {profile?.role === 'owner' ? 'מנהל מערכת ראשי' : profile?.role === 'admin' ? 'מנהל' : 'משתמש'}
            </p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`group relative flex items-center ${
            isMinimized ? "justify-center p-3" : "justify-center gap-2 px-4 py-2"
          } w-full bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-hebrew`}
          title={isMinimized ? "התנתק" : undefined}
        >
          {!isMinimized && <span className="text-sm">התנתק</span>}
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
      className="transition-all duration-300 h-screen overflow-y-auto overflow-x-hidden"
      style={{
        marginRight: isMinimized ? "80px" : "256px",
        width: `calc(100vw - ${isMinimized ? "80px" : "256px"})`,
      }}
    >
      <div className="min-h-full">
        {children}
      </div>
    </div>
  )
}
