"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export default function LoadingOverlay() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300) // Short delay to show loading state

    return () => clearTimeout(timer)
  }, [pathname])

  if (!isLoading) return null

  return (
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
  )
}
