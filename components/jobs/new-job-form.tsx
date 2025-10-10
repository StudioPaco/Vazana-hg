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
import { CalendarIcon, ClipboardIcon, SettingsIcon, UsersIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import DatabaseDropdown from "@/components/ui/database-dropdown"
import { useClients, useWorkTypes, useWorkers, useVehicles, useCarts } from "@/hooks/use-job-form-data"
import { useUserPreferences } from "@/hooks/useUserPreferences"

// Standardized shift types - single source of truth
const SHIFT_TYPES = [
  { value: "יום", label: "יום" },
  { value: "לילה", label: "לילה" },
  { value: "כפול", label: "כפול" }
]

export default function NewJobForm() {
  const router = useRouter()
  const [jobNumber, setJobNumber] = useState("")
  const { preferences } = useUserPreferences()
  const { clients, loading: clientsLoading, error: clientsError } = useClients()
  const { workTypes, loading: workTypesLoading, error: workTypesError } = useWorkTypes()
  const { workers: employees, loading: workersLoading, error: workersError } = useWorkers()
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useVehicles()
  const { carts, loading: cartsLoading, error: cartsError } = useCarts()
  const [clientType, setClientType] = useState<"new" | "existing">("existing")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
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
    calendarSync: preferences?.add_to_calendar_default ?? false,
    totalAmount: null,
    jobSpecificShiftRate: null,
    notes: null,
    receiptId: null,
    isSample: false,
  })

  useEffect(() => {
    if (preferences && formData.calendarSync !== preferences.add_to_calendar_default) {
      setFormData(prev => ({
        ...prev,
        calendarSync: preferences.add_to_calendar_default
      }))
    }
  }, [preferences])

  useEffect(() => {
    const fetchJobNumber = async () => {
      try {
        // Use API endpoint instead of direct Supabase query to avoid RLS issues
        const response = await fetch('/api/jobs')
        
        if (!response.ok) {
          console.error("[v0] API error fetching jobs for numbering:", response.status)
          setJobNumber("0001")
          return
        }
        
        const result = await response.json()
        const allJobs = result.data || []

        if (allJobs.length === 0) {
          setJobNumber("0001")
          return
        }

        // Filter out deleted jobs - only consider active jobs for numbering
        const activeJobs = allJobs.filter(job => !job.is_deleted)
        
        if (activeJobs.length === 0) {
          setJobNumber("0001")
          return
        }

        // Get the highest job number among ACTIVE jobs only
        const highestActiveJobNumber = Math.max(
          ...activeJobs.map(job => Number.parseInt(job.job_number) || 0)
        )

        // Always increment from the highest ACTIVE job number
        const nextNumber = highestActiveJobNumber + 1
        const formattedNumber = nextNumber.toString().padStart(4, "0")
        console.log("[v0] Generated job number:", formattedNumber, "from highest:", highestActiveJobNumber)
        setJobNumber(formattedNumber)

      } catch (error) {
        console.error("[v0] Failed to fetch job number:", error)
        setJobNumber("0001")
      }
    }

    fetchJobNumber()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setValidationErrors({})

    const requiredFields = [
      { field: formData.jobType, name: "סוג עבודה", key: "jobType", message: "בחר סוג עבודה מהרשימה" },
      { field: formData.date, name: "תאריך", key: "date", message: "בחר תאריך לעבודה" },
      { field: formData.location, name: "אתר", key: "location", message: "הכנס שם האתר או המיקום" },
      { field: formData.shiftType, name: "סוג משמרת", key: "shiftType", message: "בחר סוג משמרת" },
      { field: formData.city, name: "עיר", key: "city", message: "הכנס שם העיר" },
      { field: formData.employee, name: "עובד", key: "employee", message: "בחר עובד לעבודה" },
      { field: formData.vehicle, name: "רכב", key: "vehicle", message: "בחר רכב לעבודה" },
    ]

    if (clientType === "existing" && !formData.existingClientId) {
      requiredFields.push({
        field: formData.existingClientId,
        name: "לקוח קיים",
        key: "existingClientId",
        message: "בחר לקוח מהרשימה",
      })
    }
    if (clientType === "new") {
      requiredFields.push(
        { field: formData.clientName, name: "שם החברה", key: "clientName", message: "הכנס שם החברה" },
        { field: formData.clientPhone, name: "איש קשר", key: "clientPhone", message: "הכנס שם איש הקשר" },
        { field: formData.clientEmail, name: 'דוא"ל', key: "clientEmail", message: 'הכנס כתובת דוא"ל תקינה' },
        { field: formData.clientAddress, name: "כתובת", key: "clientAddress", message: "הכנס כתובת החברה" },
      )
    }

    const errors: Record<string, string> = {}
    const missingFields = requiredFields.filter(({ field, key, message }) => {
      if (!field || field.trim() === "") {
        errors[key] = message
        return true
      }
      return false
    })

    if (missingFields.length > 0) {
      setValidationErrors(errors)
      const fieldNames = missingFields.map(({ name }) => name).join(", ")
      alert(`שדות חובה חסרים: ${fieldNames}`)
      return
    }

    try {
      const supabase = createClient()

      const selectedEmployee = employees.find((emp) => emp.id === formData.employee)
      const selectedVehicle = vehicles.find((veh) => veh.id === formData.vehicle)
      const selectedCart = carts.find((cart) => cart.id === formData.cart)
      const selectedClient = clients.find((c) => c.id === formData.existingClientId)
      const selectedWorkType = workTypes.find((wt) => wt.id === formData.jobType)

      const sampleUserId = "00000000-0000-0000-0000-000000000001" // Must match the API route UUID

      const jobData = {
        job_number: jobNumber,
        work_type: selectedWorkType ? selectedWorkType.name_he : "",
        job_date: formData.date,
        site: formData.location,
        shift_type: formData.shiftType,
        city: formData.city,
        client_name: clientType === "new" ? formData.clientName : (selectedClient?.company_name || ""),
        client_id: clientType === "existing" && selectedClient ? selectedClient.id : null,
        worker_name: selectedEmployee?.name || "",
        worker_id: selectedEmployee ? selectedEmployee.id : null,
        vehicle_name: selectedVehicle ? `${selectedVehicle.license_plate} - ${selectedVehicle.name}` : "",
        vehicle_id: selectedVehicle ? selectedVehicle.id : null,
        cart_name: selectedCart?.name || null,
        cart_id: selectedCart ? selectedCart.id : null, // Use proper UUID instead of string
        service_description: formData.description || null,
        add_to_calendar: formData.calendarSync,
        payment_status: "pending", // Use English values for database
        created_by: "root",
        // created_by_id: sampleUserId, // Temporarily removed to avoid foreign key constraint
        // Let database handle created_date/updated_date with DEFAULT NOW()
        total_amount: formData.totalAmount,
        job_specific_shift_rate: formData.jobSpecificShiftRate,
        notes: formData.notes,
        receipt_id: formData.receiptId,
        is_sample: false,
        // Add new required fields
        job_time: null, // Will be filled later or left null
        job_location: formData.location, // Use the location as job_location
        status: 'scheduled', // Default status
      }

      console.log("[v0] Submitting job data:", jobData)

      const { data, error } = await supabase.from("jobs").insert([jobData]).select()

      if (error) {
        console.error("[v0] Error creating job:", error)
        alert(`שגיאה ביצירת העבודה: ${error.message}`)
        return
      }

      console.log("[v0] Job created successfully:", data)
      alert("העבודה נוצרה בהצלחה!")
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
        <div className="text-sm text-gray-500">
          <span className="text-teal-600 font-semibold">{jobNumber}</span> :מספר עבודה
        </div>
        <h1 className="text-2xl font-bold text-gray-900">עבודה חדשה</h1>
      </div>
      <p className="text-gray-600 mb-8 text-right">יצירת כרטיס עבודה חדש</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <ClipboardIcon className="h-5 w-5 text-teal-600" />
              <span>פרטי העבודה</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobType" className="text-right block">
                סוג עבודה *
              </Label>
              <DatabaseDropdown
                data={workTypes}
                displayField="name_he"
                valueField="id"
                value={formData.jobType}
                onValueChange={(value) => setFormData({ ...formData, jobType: value })}
                placeholder="בחר סוג עבודה"
                loading={workTypesLoading}
                className={`w-full ${validationErrors.jobType ? "border-red-500" : ""}`}
              />
              {validationErrors.jobType && (
                <p className="text-red-500 text-sm text-right">{validationErrors.jobType}</p>
              )}
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
                className={`text-right ${validationErrors.date ? "border-red-500" : ""}`}
                dir="rtl"
              />
              {validationErrors.date && <p className="text-red-500 text-sm text-right">{validationErrors.date}</p>}
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
                className={`text-right ${validationErrors.location ? "border-red-500" : ""}`}
                dir="rtl"
              />
              {validationErrors.location && (
                <p className="text-red-500 text-sm text-right">{validationErrors.location}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiftType" className="text-right block">
                סוג משמרת *
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, shiftType: value })} dir="rtl">
                <SelectTrigger className={`text-right ${validationErrors.shiftType ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="בחר סוג משמרת" className="text-right" />
                </SelectTrigger>
                <SelectContent className="text-right">
                  {SHIFT_TYPES.map((shift) => (
                    <SelectItem key={shift.value} value={shift.value} className="text-right">
                      {shift.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.shiftType && (
                <p className="text-red-500 text-sm text-right">{validationErrors.shiftType}</p>
              )}
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
                className={`text-right ${validationErrors.city ? "border-red-500" : ""}`}
                dir="rtl"
              />
              {validationErrors.city && <p className="text-red-500 text-sm text-right">{validationErrors.city}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <SettingsIcon className="h-5 w-5 text-teal-600" />
              <span>פרטי הקצאה *</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Button
                type="button"
                variant={clientType === "existing" ? "default" : "outline"}
                onClick={() => setClientType("existing")}
                className={`${clientType === "existing" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                לקוח קיים
              </Button>
              <Button
                type="button"
                variant={clientType === "new" ? "default" : "outline"}
                onClick={() => setClientType("new")}
                className={`${clientType === "new" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                לקוח חדש
              </Button>
            </div>

            {clientType === "existing" ? (
              <div className="space-y-2">
                <Label htmlFor="existingClientId" className="text-right block">
                  בחר לקוח קיים *
                </Label>
                <DatabaseDropdown
                  data={clients}
                  displayField="company_name"
                  valueField="id"
                  value={formData.existingClientId}
                  onValueChange={(value) => setFormData({ ...formData, existingClientId: value })}
                  placeholder="בחר לקוח קיים"
                  loading={clientsLoading}
                  className={`w-full ${validationErrors.existingClientId ? "border-red-500" : ""}`}
                />
                {validationErrors.existingClientId && (
                  <p className="text-red-500 text-sm text-right">{validationErrors.existingClientId}</p>
                )}
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
                    className={`text-right ${validationErrors.clientName ? "border-red-500" : ""}`}
                    dir="rtl"
                  />
                  {validationErrors.clientName && (
                    <p className="text-red-500 text-sm text-right">{validationErrors.clientName}</p>
                  )}
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
                    className={`text-right ${validationErrors.clientPhone ? "border-red-500" : ""}`}
                    dir="rtl"
                  />
                  {validationErrors.clientPhone && (
                    <p className="text-red-500 text-sm text-right">{validationErrors.clientPhone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-right block">
                    דוא\"ל *
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className={`text-right ${validationErrors.clientEmail ? "border-red-500" : ""}`}
                    dir="rtl"
                  />
                  {validationErrors.clientEmail && (
                    <p className="text-red-500 text-sm text-right">{validationErrors.clientEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress" className="text-right block">
                    כתובת *
                  </Label>
                  <Input
                    id="clientAddress"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className={`text-right ${validationErrors.clientAddress ? "border-red-500" : ""}`}
                    dir="rtl"
                  />
                  {validationErrors.clientAddress && (
                    <p className="text-red-500 text-sm text-right">{validationErrors.clientAddress}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>משאבי עבודה</span>
              <UsersIcon className="h-5 w-5 text-teal-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee" className="text-right block">
                עובד *
              </Label>
              <DatabaseDropdown
                data={employees}
                displayField="name"
                valueField="id"
                value={formData.employee}
                onValueChange={(value) => setFormData({ ...formData, employee: value })}
                placeholder="בחר עובד"
                loading={workersLoading}
                className={`w-full ${validationErrors.employee ? "border-red-500" : ""}`}
              />
              {validationErrors.employee && (
                <p className="text-red-500 text-sm text-right">{validationErrors.employee}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="text-right block">
                רכב *
              </Label>
              <DatabaseDropdown
                data={vehicles}
                displayField={(vehicle) => `${vehicle.license_plate} - ${vehicle.name}`}
                valueField="id"
                value={formData.vehicle}
                onValueChange={(value) => setFormData({ ...formData, vehicle: value })}
                placeholder="בחר רכב"
                loading={vehiclesLoading}
                className={`w-full ${validationErrors.vehicle ? "border-red-500" : ""}`}
              />
              {validationErrors.vehicle && (
                <p className="text-red-500 text-sm text-right">{validationErrors.vehicle}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cart" className="text-right block">
                עגלה
              </Label>
              <DatabaseDropdown
                data={carts}
                displayField="name"
                valueField="id"
                value={formData.cart}
                onValueChange={(value) => setFormData({ ...formData, cart: value })}
                placeholder="בחר עגלה (אופציונלי)"
                loading={cartsLoading}
                allowEmpty
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <ClipboardIcon className="h-5 w-5 text-teal-600" />
              <span>תיאור העבודה והערות</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="הכנס את העבודה לביצוע וכל פרט חשוב אחר... (אופציונלי)"
              className="min-h-[100px] text-right"
              dir="rtl"
            />
            <p className="text-gray-500 text-sm text-right mt-2">שדה זה אינו חובה</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <CalendarIcon className="h-5 w-5 text-teal-600" />
              <span>סכרון ליומן</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">צור אירוע ביומן עבור עבודה זו (אופציונלי)</span>
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
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-8">
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
