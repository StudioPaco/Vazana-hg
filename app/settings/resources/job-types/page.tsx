import { Suspense } from "react"
import WorkTypesPage from "@/components/work-types/work-types-page"

export default function JobTypesResourcePage() {
  return (
    <Suspense fallback={<div className="p-6">טוען...</div>}>
      <WorkTypesPage />
    </Suspense>
  )
}
