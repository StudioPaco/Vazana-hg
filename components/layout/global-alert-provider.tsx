"use client"

import { useEffect } from 'react'
import { enableGlobalAlertOverride } from '@/lib/global-alert-override'

export default function GlobalAlertProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Enable custom alert override when component mounts
    enableGlobalAlertOverride()
  }, [])

  return <>{children}</>
}