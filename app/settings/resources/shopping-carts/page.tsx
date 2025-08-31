import { Suspense } from "react"
import CartsPage from "@/components/carts/carts-page"

export default function CartsResourcePage() {
  return (
    <Suspense fallback={<div className="p-6">טוען...</div>}>
      <CartsPage />
    </Suspense>
  )
}
