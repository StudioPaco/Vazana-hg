"use client"

import { useState } from "react"
import JobsPage from "@/components/jobs/jobs-page"
import PageLayout from "@/components/layout/page-layout"
import type { StatsItem } from "@/components/layout/page-layout"
import { Briefcase, DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react"

export default function Jobs() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingJobs: 0,
    urgentJobs: 0,
    completedJobs: 0,
  })

  const statsData: StatsItem[] = [
    { title: "הכנסות חודשי", value: `₪${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "green" },
    { title: "עבודות ממתינות", value: stats.pendingJobs, icon: Clock, color: "yellow" },
    { title: "עבודות דחופות", value: stats.urgentJobs, icon: AlertTriangle, color: "red" },
    { title: "עבודות שהושלמו", value: stats.completedJobs, icon: CheckCircle, color: "blue" },
  ]

  return (
    <PageLayout
      title="עבודות"
      subtitle="נהל את כל העבודות והשירותים והפרויקטים שלך"
      titleIcon={Briefcase}
      backHref="/"
      variant="list"
      showStats={true}
      statsData={statsData}
    >
      <JobsPage showHeader={false} onStatsCalculated={setStats} />
    </PageLayout>
  )
}
