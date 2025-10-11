"use client"

import { useState } from "react"
import InvoicesPage from "@/components/invoices/invoices-page"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import PageLayout from "@/components/layout/page-layout"
import { Archive, DollarSign, Clock, Calendar, CheckCircle, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function InvoiceArchivePage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalInvoicesThisMonth: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const handleStatsCalculated = (newStats: typeof stats) => {
    setStats(newStats)
  }

  const statsData = [
    {
      title: "הכנסות חודשיות",
      value: `₪${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "green"
    },
    {
      title: "חשבוניות ממתינות",
      value: stats.pendingInvoices,
      icon: Clock,
      color: "yellow"
    },
    {
      title: "חשבוניות באיחור",
      value: stats.overdueInvoices,
      icon: Calendar,
      color: "red"
    },
    {
      title: "סה״כ חשבוניות חודש",
      value: stats.totalInvoicesThisMonth,
      icon: CheckCircle,
      color: "blue"
    }
  ]

  const actions = (
    <Button asChild className="bg-teal-500 hover:bg-teal-600 text-white">
      <Link href="/invoices/new">
        <Plus className="ml-2 h-4 w-4" />
        חשבונית חדשה
      </Link>
    </Button>
  )

  const filters = (
    <>
      <div className="relative flex-1 max-w-sm">
        <Input
          placeholder="חפש חשבוניות (מספר, לקוח)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 text-right"
          dir="rtl"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      </div>
      
      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)} dir="rtl">
        <SelectTrigger className="w-48 text-right">
          <SelectValue placeholder="סנן לפי סטטוס" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל הסטטוסים</SelectItem>
          <SelectItem value="draft">טיוטה</SelectItem>
          <SelectItem value="sent">נשלח</SelectItem>
          <SelectItem value="paid">שולם</SelectItem>
          <SelectItem value="overdue">באיחור</SelectItem>
        </SelectContent>
      </Select>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <MainContent>
        <PageLayout
          title="ארכיון חשבוניות"
          subtitle="עקב אחר חשבוניות שהונפקו וסטטוס התשלומים"
          titleIcon={Archive}
          backHref="/invoices"
          showStats={true}
          statsData={statsData}
          actions={actions}
          filters={filters}
          maxWidth="full"
        >
          <InvoicesPage 
            showHeader={false}
            showFilters={false}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onStatsCalculated={handleStatsCalculated}
          />
        </PageLayout>
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
