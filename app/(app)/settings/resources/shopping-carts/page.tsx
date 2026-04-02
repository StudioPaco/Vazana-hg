"use client"

import PageLayout from "@/components/layout/page-layout"
import { ShoppingCart } from "lucide-react"
import CartsPage from "@/components/carts/carts-page"

export default function CartsResourcePage() {
  return (
    <PageLayout
      title="עגלות"
      subtitle="ניהול העגלות"
      titleIcon={ShoppingCart}
      backHref="/settings/resources"
      variant="list"
    >
      <CartsPage showHeader={false} />
    </PageLayout>
  )
}
