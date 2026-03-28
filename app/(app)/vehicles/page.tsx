"use client"

import VehiclesPage from "@/components/vehicles/vehicles-page"
import PageLayout from "@/components/layout/page-layout"
import { Truck, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Vehicles() {
  return (
    <PageLayout
      title="כלי רכב"
      subtitle="ניהול צי הרכבים שלך"
      titleIcon={Truck}
      backHref="/"
      variant="list"
      showStats={false}
      actions={
        <Button className="bg-vazana-teal hover:bg-vazana-teal/90 text-white" asChild>
          <Link href="/settings/resources/vehicles/new">
            <Plus className="ml-2 h-4 w-4" />
            הוסף רכב
          </Link>
        </Button>
      }
    >
      <VehiclesPage showHeader={false} />
    </PageLayout>
  )
}
