"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  const [jobCount, setJobCount] = useState(0)
  const [clientType, setClientType] = useState<"new" | "existing">("new")
  const [formData, setFormData] = useState({
    jobType: "",
    date: "",
    location: "",
    shiftType: "",
    city: "",
    // Client fields
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientAddress: "",
    existingClientId: "",
    // Job resources
    employee: "",
    vehicle: "",
    cart: "",
    description: "",
    calendarSync: false,
  })

  useEffect(() => {
    const jobs = JSON.parse(localStorage.getItem("vazana_jobs") || "[]")
    setJobCount(jobs.length + 1)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const jobs = JSON.parse(localStorage.getItem("vazana_jobs") || "[]")
    const newJob = { ...formData, id: jobCount, createdAt: new Date().toISOString() }
    jobs.push(newJob)
    localStorage.setItem("vazana_jobs", JSON.stringify(jobs))
    console.log("Creating job:", newJob)
    router.push("/jobs")
  }

  const handleCancel = () => {
    router.push("/jobs")
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">עבודה חדשה</h1>
        <div className="text-sm text-gray-500">
          מספר עבודה: <span className="text-vazana-teal font-semibold">{jobCount.toString().padStart(4, "0")}</span>
        </div>
      </div>
      <p className="text-gray-600 mb-8 text-right">יצירת כרטיס עבודה חדש</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>פרטי העבודה</span>
              <ClipboardIcon className="h-5 w-5 text-vazana-teal" />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>פרטי הקצאה *</span>
              <SettingsIcon className="h-5 w-5 text-vazana-teal" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Button
                type="button"
                variant={clientType === "existing" ? "default" : "outline"}
                onClick={() => setClientType("existing")}
                className={`${clientType === "existing" ? "bg-vazana-teal text-white" : "bg-gray-100 text-gray-700"}`}
              >
                לקוח קיים
              </Button>
              <Button
                type="button"
                variant={clientType === "new" ? "default" : "outline"}
                onClick={() => setClientType("new")}
                className={`${clientType === "new" ? "bg-vazana-teal text-white" : "bg-gray-100 text-gray-700"}`}
              >
                לקוח חדש
              </Button>
            </div>

            {clientType === "existing" ? (
              <div className="space-y-2">
                <Label htmlFor="existingClient" className="text-right block">
                  בחר לקוח *
                </Label>
                <Select onValueChange={(value) => setFormData({ ...formData, existingClientId: value })}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="עובד 1" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client1">אדהם עבודות פיתוח</SelectItem>
                    <SelectItem value="client2">אלקיים סימון כבישים</SelectItem>
                    <SelectItem value="client3">דרכים זוהרים</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-right block">
                    שם החברה *
                  </Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="text-right"
                    required={clientType === "new"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone" className="text-right block">
                    איש קשר *
                  </Label>
                  <Input
                    id="clientPhone"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="דוגמה: משרד ראשי, בניין א'"
                    className="text-right"
                    required={clientType === "new"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-right block">
                    דוא"ל *
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="text-right"
                    required={clientType === "new"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress" className="text-right block">
                    כתובת *
                  </Label>
                  <Input
                    id="clientAddress"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className="text-right"
                    required={clientType === "new"}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>משאבי עבודה</span>
              <SettingsIcon className="h-5 w-5 text-vazana-teal" />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee" className="text-right block">
                עובד *
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, employee: value })}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר הערך ומשמרת הקלה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee1">עובד 1</SelectItem>
                  <SelectItem value="employee2">עובד 2</SelectItem>
                  <SelectItem value="employee3">עובד 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="text-right block">
                רכב *
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, vehicle: value })}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר רכב" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle1">רכב 1</SelectItem>
                  <SelectItem value="vehicle2">רכב 2</SelectItem>
                  <SelectItem value="vehicle3">רכב 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cart" className="text-right block">
                עגלה/מנדף *
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, cart: value })}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר עגלה/מנדף" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cart1">עגלה 1</SelectItem>
                  <SelectItem value="cart2">עגלה 2</SelectItem>
                  <SelectItem value="cart3">מנדף 1</SelectItem>
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

        <div className="flex gap-4 justify-start">
          <Button type="submit" className="bg-vazana-teal hover:bg-vazana-teal/90 text-white px-8">
            יצר עבודה
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel} className="px-8 bg-transparent">
            ביטול
          </Button>
        </div>
      </form>
    </div>
  )
}
