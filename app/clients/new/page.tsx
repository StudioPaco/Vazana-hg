"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// This page is deprecated - redirect to main clients page where modal will be used
export default function NewClientPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/clients")
  }, [router])
  
  return <div>Redirecting...</div>
}
