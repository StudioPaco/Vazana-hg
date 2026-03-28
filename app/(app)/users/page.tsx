"use client"

import { UsersPage } from "@/components/users/users-page"
import PageLayout from "@/components/layout/page-layout"
import { Users } from "lucide-react"

export default function UsersPageWrapper() {
  return (
    <PageLayout
      title="ניהול משתמשים"
      subtitle="נהל משתמשים והרשאות במערכת"
      titleIcon={Users}
      backHref="/"
      variant="list"
      showStats={false}
    >
      <UsersPage showHeader={false} />
    </PageLayout>
  )
}
