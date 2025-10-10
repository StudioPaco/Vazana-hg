"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  type?: "job" | "payment"
  className?: string
  size?: "sm" | "default" | "lg"
}

// Job status color mappings
const getJobStatusColor = (status: string) => {
  switch (status) {
    case "הושלם":
    case "completed":
    case "paid":
      return "bg-green-100 text-green-800"
    case "פעיל":
    case "active":
    case "בתהליך":
    case "in-progress":
      return "bg-vazana-teal/20 text-vazana-teal"
    case "ממתין":
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "דחוף":
    case "urgent":
      return "bg-red-100 text-red-800"
    case "באיחור":
    case "overdue":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Payment status color mappings
const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "שולם":
    case "paid":
      return "bg-green-100 text-green-800"
    case "ממתין לתשלום":
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "מאוחר":
    case "overdue":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Size mappings
const getSizeClasses = (size: "sm" | "default" | "lg") => {
  switch (size) {
    case "sm":
      return "text-xs px-2 py-1"
    case "lg":
      return "text-base px-3 py-1"
    case "default":
    default:
      return "text-sm px-2.5 py-1"
  }
}

export default function StatusBadge({ status, type = "job", className, size = "default" }: StatusBadgeProps) {
  const colorClasses = type === "payment" ? getPaymentStatusColor(status) : getJobStatusColor(status)
  const sizeClasses = getSizeClasses(size)
  
  return (
    <Badge 
      className={cn(
        colorClasses,
        sizeClasses,
        "font-hebrew border-0",
        className
      )}
    >
      {status}
    </Badge>
  )
}