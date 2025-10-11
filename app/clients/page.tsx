"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import PageLayout from "@/components/layout/page-layout"
import ClientsPage from "@/components/clients/clients-page"
import { Users, Plus, Trophy, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function Clients() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState({
    averageSecurityRate: 0,
    activeClientsCount: 0,
    mostActiveClient: { name: "אין נתונים", count: 0 }
  })
  const router = useRouter()

  useEffect(() => {
    const loggedIn = localStorage.getItem("vazana_logged_in")
    if (loggedIn === "true") {
      setIsAuthenticated(true)
    } else {
      router.push("/auth/login")
    }
  }, [router])

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  const handleStatsCalculated = (newStats: typeof stats) => {
    setStats(newStats)
  }

  const statsData = [
    {
      title: "תעריף אבטחה ממוצע",
      value: `₪${stats.averageSecurityRate}`,
      icon: Users,
      color: "blue"
    },
    {
      title: "לקוחות פעילים",
      value: stats.activeClientsCount,
      icon: Users,
      color: "green"
    },
    {
      title: "לקוח מוביל החודש",
      value: stats.mostActiveClient.name,
      icon: Trophy,
      color: "yellow"
    }
  ]

  const filters = (
    <div className="relative flex-1 max-w-md">
      <Input
        placeholder="חפש לקוחות (שם, איש קשר, עיר)..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pr-10 text-right"
        dir="rtl"
      />
      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
    </div>
  )

  const actions = (
    <Button asChild className="bg-teal-500 hover:bg-teal-600 text-white">
      <Link href="/clients/new">
        <Plus className="ml-2 h-4 w-4" />
        לקוח חדש
      </Link>
    </Button>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <MainContent>
        <PageLayout
          title="ניהול לקוחות"
          subtitle="נהל פרטי לקוחות, תעריפים ופרטי חיוב"
          titleIcon={Users}
          backHref="/"
          showStats={true}
          statsData={statsData}
          filters={filters}
          actions={actions}
          maxWidth="full"
        >
          <ClientsPage 
            showHeader={false} 
            searchTerm={searchTerm} 
            onStatsCalculated={handleStatsCalculated} 
          />
        </PageLayout>
      </MainContent>
      <SidebarNavigation />
    </div>
  )
}
