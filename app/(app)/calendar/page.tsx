"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import PageLayout from "@/components/layout/page-layout"

export default function CalendarPage() {
  return (
    <PageLayout
      title="יומן"
      subtitle="נהל לוח זמנים ופגישות"
      titleIcon={Calendar}
      variant="form"
      maxWidth="4xl"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-hebrew">
            <Calendar className="w-5 h-5" />
            יומן עבודות
          </CardTitle>
          <CardDescription className="font-hebrew">תכונת היומן תהיה זמינה בקרוב</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500 font-hebrew">
            <Calendar className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium mb-2">יומן בפיתוח</p>
            <p className="text-sm">תכונת ניהול היומן והפגישות תהיה זמינה בעדכון הבא</p>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
