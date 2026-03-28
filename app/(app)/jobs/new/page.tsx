"use client"

import NewJobForm from "@/components/jobs/new-job-form"
import PageLayout from "@/components/layout/page-layout"
import { Plus } from "lucide-react"

export default function NewJobPage() {
  return (
    <PageLayout
      title="עבודה חדשה"
      titleIcon={Plus}
      backHref="/jobs"
      variant="form"
    >
      <NewJobForm showHeader={false} />
    </PageLayout>
  )
}
