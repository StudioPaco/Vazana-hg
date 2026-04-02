"use client"

import PageLayout from "@/components/layout/page-layout"
import { Truck } from "lucide-react"
import VehiclesPage from "@/components/vehicles/vehicles-page"

export default function VehiclesResourcePage() {
  return (
    <PageLayout
      title="כלי רכב"
      subtitle="ניהול צי הרכבים"
      titleIcon={Truck}
      backHref="/settings/resources"
      variant="list"
    >
      <VehiclesPage showHeader={false} />
    </PageLayout>
  )
}
