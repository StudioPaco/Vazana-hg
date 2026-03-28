"use client"

import WorkersPage from "@/components/workers/workers-page"
import PageLayout from "@/components/layout/page-layout"
import { Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Workers() {
  return (
    <PageLayout
      title="עובדים"
      subtitle="ניהול כוח האדם שלך"
      titleIcon={Users}
      backHref="/"
      variant="list"
      showStats={false}
      actions={
        <Button className="bg-vazana-teal hover:bg-vazana-teal/90 text-white" asChild>
          <Link href="/settings/resources/workers/new">
            <Plus className="ml-2 h-4 w-4" />
            הוסף עובד
          </Link>
        </Button>
      }
    >
      <WorkersPage showHeader={false} />
    </PageLayout>
  )
}
