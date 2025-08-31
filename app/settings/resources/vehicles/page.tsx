import { Suspense } from "react"
import VehiclesPage from "@/components/vehicles/vehicles-page"

export default function VehiclesResourcePage() {
  return (
    <Suspense fallback={<div className="p-6">טוען...</div>}>
      <VehiclesPage />
    </Suspense>
  )
}
