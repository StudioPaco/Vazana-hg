"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { CalendarIcon, ClipboardIcon, SettingsIcon } from "lucide-react"

export default function NewJobForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    jobType: "",
    date: "",
    location: "",
    shiftType: "",
    city: "",
    worker: "",
    vehicle: "",
    owner: "",
    description: "",
    calendarSync: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement job creation API call
    console.log("Creating job:", formData)
    router.push("/jobs")
  }

  const handleCancel = () => {
    router.push("/jobs")
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          מספר עבודה: <span className="text-vazana-teal font-semibold">0006</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">עבודה חדשה</h1>
      </div>
      <p className="text-gray-600 mb-8 text-right">יצירת כרטיס עבודה חדש</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <ClipboardIcon className="h-5 w-5 text-vazana-teal" />
              <span>פרטי העבודה</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-right block">
                תאריך *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="text-right"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobType" className="text-right block">
                סוג עבודה *
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, jobType: value })}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר סוג עבודה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security">אבטחה</SelectItem>
                  <SelectItem value="patrol">סיור</SelectItem>
                  <SelectItem value="event">אירוע</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiftType" className="text-right block">
                סוג משמרת *
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, shiftType: value })}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר סוג משמרת" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">יום</SelectItem>
                  <SelectItem value="night">לילה</SelectItem>
                  <SelectItem value="full">מלא</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-right block">
                אתר *
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="דוגמה: משרד ראשי, בניין א'"
                className="text-right"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="city" className="text-right block">
                עיר *
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="דוגמה: תל אביב, לוהמן"
                className="text-right"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignment Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <SettingsIcon className="h-5 w-5 text-vazana-teal" />
              <span>פרטי הקצאה *</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-right block">לקוח קיים</Label>
                <div className="bg-gray-100 p-3 rounded text-center text-gray-500">לקוח חדש</div>
              </div>
              <div className="space-y-2">
                <Label className="text-right block">לקוח קיים</Label>
                <div className="bg-gray-100 p-3 rounded text-center text-gray-500">לקוח קיים</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="worker" className="text-right block">
                בחר לקוח *
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, worker: value })}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר לקוח" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker1">עובד 1</SelectItem>
                  <SelectItem value="worker2">עובד 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Job Salary Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <SettingsIcon className="h-5 w-5 text-vazana-teal" />
              <span>משכבי עבודה</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-right block">
                עבוד *
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="בחר הערך ומשמרת הקלה"
                className="text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Description Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <ClipboardIcon className="h-5 w-5 text-vazana-teal" />
              <span>תיאור העבודה והערות</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="הכנס את העבודה לביצוע וכל פרט חשוב אחר..."
              className="min-h-[100px] text-right"
            />
          </CardContent>
        </Card>

        {/* Calendar Sync Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <CalendarIcon className="h-5 w-5 text-vazana-teal" />
              <span>סכרון ליומן</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">צור אירוע ביומן עבור עבודה זו</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm">הוסף ליומן גוגל</span>
                <Switch
                  checked={formData.calendarSync}
                  onCheckedChange={(checked) => setFormData({ ...formData, calendarSync: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-start">
          <Button type="button" variant="outline" onClick={handleCancel} className="px-8 bg-transparent">
            ביטול
          </Button>
          <Button type="submit" className="bg-vazana-teal hover:bg-vazana-teal/90 text-white px-8">
            יצר עבודה
          </Button>
        </div>
      </form>
    </div>
  )
}
