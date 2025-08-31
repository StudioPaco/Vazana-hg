import { Suspense } from "react"
import WorkersPage from "@/components/workers/workers-page"

export default function WorkersResourcePage() {
  return (
    <Suspense fallback={<div className="p-6">טוען...</div>}>
      <WorkersPage />
    </Suspense>
  )
}
