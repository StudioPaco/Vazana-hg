"use client"

import CartsPage from "@/components/carts/carts-page"
import PageLayout from "@/components/layout/page-layout"
import { ShoppingCart, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Carts() {
  return (
    <PageLayout
      title="עגלות"
      subtitle="ניהול עגלות הציוד שלך"
      titleIcon={ShoppingCart}
      backHref="/"
      variant="list"
      showStats={false}
      actions={
        <Button className="bg-vazana-teal hover:bg-vazana-teal/90 text-white" asChild>
          <Link href="/settings/resources/shopping-carts/new">
            <Plus className="ml-2 h-4 w-4" />
            הוסף עגלה
          </Link>
        </Button>
      }
    >
      <CartsPage showHeader={false} />
    </PageLayout>
  )
}
