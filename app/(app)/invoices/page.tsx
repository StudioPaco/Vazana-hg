"use client"

import { useState } from "react"
import InvoicesPage from "@/components/invoices/invoices-page"
import PageLayout from "@/components/layout/page-layout"
import type { StatsItem } from "@/components/layout/page-layout"
import { FileText, Plus, DollarSign, Clock, Calendar, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Invoices() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalInvoicesThisMonth: 0,
  })

  const statsData: StatsItem[] = [
    { title: "הכנסות שולמו", value: `₪${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "green" },
    { title: "ממתינות לתשלום", value: stats.pendingInvoices, icon: Clock, color: "yellow" },
    { title: "באיחור", value: stats.overdueInvoices, icon: Calendar, color: "red" },
    { title: "חשבוניות החודש", value: stats.totalInvoicesThisMonth, icon: CheckCircle, color: "blue" },
  ]

  return (
    <PageLayout
      title="ארכיון חשבוניות"
      subtitle="עקב אחר חשבוניות שהונפקו וסטטוס התשלומים"
      titleIcon={FileText}
      backHref="/"
      variant="list"
      showStats={true}
      statsData={statsData}
      actions={
        <Button className="bg-vazana-teal hover:bg-vazana-teal/90 text-white" asChild>
          <Link href="/invoices/new">
            <Plus className="ml-2 h-4 w-4" />
            חשבונית חדשה
          </Link>
        </Button>
      }
    >
      <InvoicesPage showHeader={false} onStatsCalculated={setStats} />
    </PageLayout>
  )
}
