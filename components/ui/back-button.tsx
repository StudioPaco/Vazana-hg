import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface BackButtonProps {
  href?: string
  children?: React.ReactNode
  className?: string
}

export function BackButton({ href, children = "חזרה", className = "" }: BackButtonProps) {
  const router = useRouter()
  
  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`flex items-center gap-2 font-hebrew text-gray-600 hover:text-vazana-teal px-2 py-1 h-auto ${className}`}
      dir="rtl"
    >
      <ArrowRight className="w-4 h-4" />
      {children}
    </Button>
  )
}