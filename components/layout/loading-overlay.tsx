"use client"

import type React from "react"

import { useEffect, useState, createContext, useContext } from "react"
import { usePathname } from "next/navigation"

const LoadingContext = createContext<{
  setLoading: (loading: boolean) => void
}>({
  setLoading: () => {},
})

export const useLoading = () => useContext(LoadingContext)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  useEffect(() => {
    setIsLoading(false)
  }, [pathname])

  return (
    <LoadingContext.Provider value={{ setLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            {/* Spinning loader */}
            <div className="relative">
              <div
                className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin"
                style={{ borderTopColor: "#FFCC00" }}
              ></div>
              <div
                className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-pulse"
                style={{ borderTopColor: "#FFCC00", animationDelay: "0.5s" }}
              ></div>
            </div>

            {/* Loading text */}
            <div className="text-center">
              <p className="text-gray-600 font-hebrew text-sm">טוען...</p>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export default function LoadingOverlay() {
  return null // Component logic moved to LoadingProvider
}
