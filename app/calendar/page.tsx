"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import SidebarNavigation from "@/components/layout/sidebar-navigation"

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNavigation />
      <div className="mr-64 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-right">
            <h1 className="text-3xl font-bold text-vazana-dark font-hebrew">יומן</h1>
            <p className="text-gray-600 font-hebrew">נהל לוח זמנים ופגישות</p>
          </div>

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
        </div>
      </div>
    </div>
  )
}
