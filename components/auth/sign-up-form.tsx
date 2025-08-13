"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import Link from "next/link"

export default function SignUpForm() {
  return (
    <Card className="w-full max-w-md shadow-xl border-gray-200">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 bg-[#FFCC00] rounded-lg flex items-center justify-center">
          <Lock className="h-6 w-6 text-[#1A1A1A]" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-[#1A1A1A]">הרשמה מוגבלת</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            משתמשים חדשים נוצרים רק על ידי מנהל המערכת
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-right">
          <p className="text-sm">כדי לקבל גישה למערכת, פנה למנהל המערכת ליצירת חשבון משתמש עבורך.</p>
        </div>

        <Link href="/auth/login" className="block">
          <Button className="w-full bg-[#FFCC00] hover:bg-[#E6B800] text-[#1A1A1A] py-6 text-lg font-medium rounded-lg h-[60px]">
            חזור להתחברות
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
