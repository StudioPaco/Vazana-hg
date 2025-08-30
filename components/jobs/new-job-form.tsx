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
import { createClient } from "@/lib/supabase/client"

export default function NewJobForm() {
  const router = useRouter()
  const [jobNumber, setJobNumber] = useState("0001")
  const [clients, setClients] = useState<any[]>([])
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
    const fetchJobNumber = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("jobs")
          .select("job_number")
          .order("created_date", { ascending: false })
          .limit(1)

        if (error) {
          console.error("[v0] Error fetching last job number:", error)
          setJobNumber("0001")
          return
        }

        if (data && data.length > 0) {
          const lastJobNumber = data[0].job_number
          const nextNumber = Number.parseInt(lastJobNumber) + 1
          setJobNumber(nextNumber.toString().padStart(4, "0"))
        } else {
          setJobNumber("0001")
        }
      } catch (error) {
        console.error("[v0] Failed to fetch job number:", error)
        setJobNumber("0001")
      }
    }

    const fetchClients = async () => {
      try {
        const sampleClients = [
          {
            id: "1",
            company_name: "אדהם עבודות פיתוח",
            contact_person: "אדהם כהן",
          },
          {
            id: "2",
            company_name: "אלקים סימון בבשים",
            contact_person: "משה לוי",
          },
          {
            id: "3",
            company_name: "דברים זוהרים",
            contact_person: "שרה כהן",
          },
        ]

        console.log("[v0] Using sample clients for dropdown:", sampleClients)
        setClients(sampleClients)
      } catch (error) {
        console.error("[v0] Failed to fetch clients:", error)
      }
    }

    fetchJobNumber()
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const supabase = createClient()
      const jobData = {
        job_number: jobNumber,
        work_type: formData.jobType,
        job_date: formData.date,
        site: formData.location,
        shift_type: formData.shiftType,
        city: formData.city,
        client_name:
          clientType === "new"
            ? formData.clientName
            : clients.find((c) => c.id === formData.existingClientId)?.company_name,
        client_id: clientType === "existing" ? formData.existingClientId : null,
        worker_name: formData.employee,
        vehicle_name: formData.vehicle,
        cart_name: formData.cart,
        service_description: formData.description,
        add_to_calendar: formData.calendarSync,
        payment_status: "pending",
        created_by: "root",
      }

      const { data, error } = await supabase.from("jobs").insert([jobData]).select()

      if (error) {
        console.error("[v0] Error creating job:", error)
        alert("שגיאה ביצירת העבודה")
        return
      }

      console.log("[v0] Job created successfully:", data)
      router.push("/jobs")
    } catch (error) {
      console.error("[v0] Failed to create job:", error)
      alert("שגיאה ביצירת העבודה")
    }
  }

  const handleCancel = () => {
    router.push("/jobs")
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">עבודה חדשה</h1>
        <div className="text-sm text-gray-500">
          מספר עבודה: <span className="text-vazana-teal font-semibold">{jobNumber}</span>
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
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name} - {client.contact_person}
                      </SelectItem>
                    ))}
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
          <Button type="submit" className="bg-vazana-teal hover:bg-vazana-teal/90 text-white px-8 btn-primary">
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
