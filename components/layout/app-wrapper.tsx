"use client"

import { usePathname } from "next/navigation"
import AppNavigation from "./app-navigation"
import { useUrlMasking } from "@/hooks/useUrlMasking"

interface AppWrapperProps {
  children: React.ReactNode
}

export default function AppWrapper({ children }: AppWrapperProps) {
  // Apply URL masking globally for all child routes
  useUrlMasking({ 
    maskChildRoutes: true,
    maskedUrl: "/" 
  })
  
  return <>{children}</>
}
