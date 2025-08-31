"use client"

import type React from "react"

import { useSidebar } from "@/components/layout/sidebar-navigation"

interface MainContentProps {
  children: React.ReactNode
}

export function MainContent({ children }: MainContentProps) {
  const { isMinimized } = useSidebar()

  return (
    <main
      className={`transition-all duration-300 ${
        isMinimized
          ? "mr-24" // When sidebar is minimized (96px = 24 * 4px)
          : "mr-64" // When sidebar is expanded (256px = 64 * 4px)
      }`}
      style={{
        width: isMinimized ? "calc(100vw - 96px)" : "calc(100vw - 256px)",
      }}
    >
      {children}
    </main>
  )
}
