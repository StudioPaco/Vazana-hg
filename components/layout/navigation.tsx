"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface NavigationProps {
  user?: {
    email?: string
    username?: string
    id?: string
  }
}

const navigationItems = [
  { name: "Dashboard", href: "/", icon: "🏠", nameHe: "לוח בקרה" },
  { name: "Clients", href: "/clients", icon: "👥", nameHe: "לקוחות" },
  { name: "Jobs", href: "/jobs", icon: "💼", nameHe: "עבודות" },
  { name: "Workers", href: "/workers", icon: "👷", nameHe: "עובדים" },
  { name: "Vehicles", href: "/vehicles", icon: "🚛", nameHe: "כלי רכב" },
  { name: "Carts", href: "/carts", icon: "🛒", nameHe: "עגלות" },
  { name: "Invoices", href: "/invoices", icon: "📄", nameHe: "חשבוניות" },
  { name: "Documents", href: "/documents", icon: "📁", nameHe: "מסמכים" },
  { name: "Users", href: "/users", icon: "⚙️", nameHe: "משתמשים" },
  { name: "Calendar", href: "/calendar", icon: "📅", nameHe: "יומן" },
]

export default function Navigation({ user: propUser }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("vazana_user")
      if (userData) {
        setUser(JSON.parse(userData))
      }
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem("vazana_logged_in")
    localStorage.removeItem("vazana_user")
    router.push("/auth/login")
  }

  const currentUser = propUser || user

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-white shadow-md">
          {isOpen ? <span>✕</span> : <span>☰</span>}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header - Updated with Vazana colors */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 bg-vazana-yellow">
            <div className="flex items-center space-x-2">
              <span className="text-2xl text-vazana-dark">🏢</span>
              <div className="text-center">
                <h1 className="text-lg font-bold text-vazana-dark">Vazana Studio</h1>
                <p className="text-xs text-vazana-dark opacity-80">וזאנה אבטחת כבישים</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-vazana-teal bg-opacity-20 text-vazana-dark border border-vazana-teal"
                      : "text-gray-600 hover:bg-vazana-yellow hover:bg-opacity-20 hover:text-vazana-dark",
                  )}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-400">{item.nameHe}</div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar>
                <AvatarFallback className="bg-vazana-teal text-white">
                  {currentUser?.username?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || "R"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-vazana-dark truncate">
                  {currentUser?.username || currentUser?.email || "root"}
                </p>
                <p className="text-xs text-gray-500">Business Owner</p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="w-full bg-transparent border-vazana-dark text-vazana-dark hover:bg-vazana-dark hover:text-white"
            >
              <span className="mr-2">🚪</span>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
