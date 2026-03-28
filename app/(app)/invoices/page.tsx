"use client"

import InvoicesPage from "@/components/invoices/invoices-page"
import PageLayout from "@/components/layout/page-layout"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Invoices() {
  return (
    <PageLayout
      title="ארכיון חשבוניות"
      subtitle="עקב אחר חשבוניות שהונפקו וסטטוס התשלומים"
      titleIcon={FileText}
      backHref="/"
      variant="list"
      showStats={false}
      actions={
        <Button className="bg-vazana-teal hover:bg-vazana-teal/90 text-white" asChild>
          <Link href="/invoices/new">
            <Plus className="ml-2 h-4 w-4" />
            חשבונית חדשה
          </Link>
        </Button>
      }
    >
      <InvoicesPage showHeader={false} />
    </PageLayout>
  )
}
