"use client"

import { useState } from "react"
import PageLayout from "@/components/layout/page-layout"
import ClientsPage from "@/components/clients/clients-page"
import { Users, Trophy } from "lucide-react"

export default function Clients() {
  const [stats, setStats] = useState({
    averageSecurityRate: 0,
    activeClientsCount: 0,
    mostActiveClient: { name: "אין נתונים", count: 0 }
  })

  const statsData = [
    { title: "תעריף אבטחה ממוצע", value: `₪${stats.averageSecurityRate}`, icon: Users, color: "blue" },
    { title: "לקוחות פעילים", value: stats.activeClientsCount, icon: Users, color: "green" },
    { title: "לקוח מוביל החודש", value: stats.mostActiveClient.name, icon: Trophy, color: "yellow" },
  ]

  return (
    <PageLayout
      title="ניהול לקוחות"
      subtitle="נהל פרטי לקוחות, תעריפים ופרטי חיוב"
      titleIcon={Users}
      backHref="/"
      showStats={true}
      statsData={statsData}
      maxWidth="full"
    >
      <ClientsPage
        showHeader={false}
        onStatsCalculated={setStats}
      />
    </PageLayout>
  )
}
