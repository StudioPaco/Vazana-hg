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

export default function NewJobForm() {
  const router = useRouter()
  const [jobNumber, setJobNumber] = useState("0001")
  const [clients, setClients] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [carts, setCarts] = useState<any[]>([])
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
    calendarSync: false,
    totalAmount: null,
    jobSpecificShiftRate: null,
    notes: null,
    receiptId: null,
    isSample: false,
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
      console.log("[v0] Starting to fetch clients...")
      try {
        const supabase = createClient()
        console.log("[v0] Supabase client created")

        const { data, error } = await supabase
          .from("clients")
          .select("id, company_name, contact_person")
          .order("company_name", { ascending: true })

        console.log("[v0] Supabase query completed. Error:", error, "Data:", data)

        if (error) {
          console.error("[v0] Error fetching clients:", error)
          const fallbackClients = [
            { id: "sample-1", company_name: "אדהם עבודות פיתוח", contact_person: "אדהם" },
            { id: "sample-2", company_name: "אלקים סימון בבשים", contact_person: "אלקים" },
            { id: "sample-3", company_name: "דברים זוהרים", contact_person: "דברים" },
          ]
          console.log("[v0] Using fallback clients:", fallbackClients)
          setClients(fallbackClients)
          return
        }

        if (data && data.length > 0) {
          console.log("[v0] Successfully fetched clients from database:", data)
          setClients(data)
        } else {
          console.log("[v0] No clients found in database, using fallback data")
          const fallbackClients = [
            { id: "sample-1", company_name: "אדהם עבודות פיתוח", contact_person: "אדהם" },
            { id: "sample-2", company_name: "אלקים סימון בבשים", contact_person: "אלקים" },
            { id: "sample-3", company_name: "דברים זוהרים", contact_person: "דברים" },
          ]
          setClients(fallbackClients)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch clients:", error)
        const fallbackClients = [
          { id: "sample-1", company_name: "אדהם עבודות פיתוח", contact_person: "אדהם" },
          { id: "sample-2", company_name: "אלקים סימון בבשים", contact_person: "אלקים" },
          { id: "sample-3", company_name: "דברים זוהרים", contact_person: "דברים" },
        ]
        console.log("[v0] Using fallback clients due to error:", fallbackClients)
        setClients(fallbackClients)
      }
    }

    const fetchEmployees = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("workers")
          .select("id, name, phone_number")
          .order("name", { ascending: true })

        if (error) {
          console.error("[v0] Error fetching employees:", error)
          const fallbackEmployees = [
            { id: "emp-1", name: "עובד 1", phone_number: "050-1234567" },
            { id: "emp-2", name: "עובד 2", phone_number: "050-2345678" },
            { id: "emp-3", name: "עובד 3", phone_number: "050-3456789" },
          ]
          setEmployees(fallbackEmployees)
          return
        }

        if (data && data.length > 0) {
          setEmployees(data)
        } else {
          const fallbackEmployees = [
            { id: "emp-1", name: "עובד 1", phone_number: "050-1234567" },
            { id: "emp-2", name: "עובד 2", phone_number: "050-2345678" },
            { id: "emp-3", name: "עובד 3", phone_number: "050-3456789" },
          ]
          setEmployees(fallbackEmployees)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch employees:", error)
        const fallbackEmployees = [
          { id: "emp-1", name: "עובד 1", phone_number: "050-1234567" },
          { id: "emp-2", name: "עובד 2", phone_number: "050-2345678" },
          { id: "emp-3", name: "עובד 3", phone_number: "050-3456789" },
        ]
        setEmployees(fallbackEmployees)
      }
    }

    const fetchVehicles = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, license_plate, name, details")
          .order("license_plate", { ascending: true })

        if (error) {
          console.error("[v0] Error fetching vehicles:", error)
          const fallbackVehicles = [
            { id: "veh-1", license_plate: "123-45-678", name: "טויוטה קורולה", details: "רכב" },
            { id: "veh-2", license_plate: "234-56-789", name: "הונדה סיוויק", details: "רכב" },
            { id: "veh-3", license_plate: "345-67-890", name: "מיצובישי לנסר", details: "רכב" },
          ]
          setVehicles(fallbackVehicles)
          return
        }

        if (data && data.length > 0) {
          setVehicles(data)
        } else {
          const fallbackVehicles = [
            { id: "veh-1", license_plate: "123-45-678", name: "טויוטה קורולה", details: "רכב" },
            { id: "veh-2", license_plate: "234-56-789", name: "הונדה סיוויק", details: "רכב" },
            { id: "veh-3", license_plate: "345-67-890", name: "מיצובישי לנסר", details: "רכב" },
          ]
          setVehicles(fallbackVehicles)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch vehicles:", error)
        const fallbackVehicles = [
          { id: "veh-1", license_plate: "123-45-678", name: "טויוטה קורולה", details: "רכב" },
          { id: "veh-2", license_plate: "234-56-789", name: "הונדה סיוויק", details: "רכב" },
          { id: "veh-3", license_plate: "345-67-890", name: "מיצובישי לנסר", details: "רכב" },
        ]
        setVehicles(fallbackVehicles)
      }
    }

    const fetchCarts = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("carts")
          .select("id, name, details")
          .order("name", { ascending: true })

        if (error) {
          console.error("[v0] Error fetching carts:", error)
          const fallbackCarts = [
            { id: "cart-1", name: "עגלה 1", details: "עגלת ציוד גדולה" },
            { id: "cart-2", name: "עגלה 2", details: "עגלת ציוד בינונית" },
            { id: "cart-3", name: "נגרר 1", details: "נגרר גדול" },
          ]
          setCarts(fallbackCarts)
          return
        }

        if (data && data.length > 0) {
          setCarts(data)
        } else {
          const fallbackCarts = [
            { id: "cart-1", name: "עגלה 1", details: "עגלת ציוד גדולה" },
            { id: "cart-2", name: "עגלה 2", details: "עגלת ציוד בינונית" },
            { id: "cart-3", name: "נגרר 1", details: "נגרר גדול" },
          ]
          setCarts(fallbackCarts)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch carts:", error)
        const fallbackCarts = [
          { id: "cart-1", name: "עגלה 1", details: "עגלת ציוד גדולה" },
          { id: "cart-2", name: "עגלה 2", details: "עגלת ציוד בינונית" },
          { id: "cart-3", name: "נגרר 1", details: "נגרר גדול" },
        ]
        setCarts(fallbackCarts)
      }
    }

    fetchJobNumber()
    fetchClients()
    fetchEmployees()
    fetchVehicles()
    fetchCarts()
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
        worker_name: selectedEmployee?.name || null,
        worker_id: formData.employee || null,
        vehicle_name: selectedVehicle ? `${selectedVehicle.license_plate} - ${selectedVehicle.name}` : null,
        vehicle_id: formData.vehicle || null,
        cart_name: selectedCart?.name || null,
        cart_id: formData.cart || null,
        service_description: formData.description || null, // Allow empty description
        add_to_calendar: formData.calendarSync,
        payment_status: "pending",
        created_by: "root",
        created_date: new Date().toISOString(),
        total_amount: formData.totalAmount,
        job_specific_shift_rate: formData.jobSpecificShiftRate,
        notes: formData.notes,
        receipt_id: formData.receiptId,
        is_sample: false,
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
        <h1 className="text-2xl font-bold text-gray-900">עבודה חדשה</h1>
        <div className="text-sm text-gray-500">
          מספר עבודה: <span className="text-teal-600 font-semibold">{jobNumber}</span>
        </div>
      </div>
      <p className="text-gray-600 mb-8 text-right">יצירת כרטיס עבודה חדש</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>פרטי העבודה</span>
              <ClipboardIcon className="h-5 w-5 text-teal-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobType" className="text-right block">
                סוג עבודה *
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, jobType: value })}>
                <SelectTrigger className={`text-right ${validationErrors.jobType ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="בחר סוג עבודה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security">אבטחה</SelectItem>
                  <SelectItem value="patrol">סיור</SelectItem>
                  <SelectItem value="event">אירוע</SelectItem>
                </SelectContent>
              </Select>
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
              />
              {validationErrors.location && (
                <p className="text-red-500 text-sm text-right">{validationErrors.location}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiftType" className="text-right block">
                סוג משמרת *
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, shiftType: value })}>
                <SelectTrigger className={`text-right ${validationErrors.shiftType ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="בחר סוג משמרת" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">יום</SelectItem>
                  <SelectItem value="night">לילה</SelectItem>
                  <SelectItem value="full">מלא</SelectItem>
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
              />
              {validationErrors.city && <p className="text-red-500 text-sm text-right">{validationErrors.city}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>פרטי הקצאה *</span>
              <SettingsIcon className="h-5 w-5 text-teal-600" />
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
                <Label htmlFor="existingClient" className="text-right block">
                  בחר לקוח *
                </Label>
                <Select onValueChange={(value) => setFormData({ ...formData, existingClientId: value })}>
                  <SelectTrigger className={`text-right ${validationErrors.existingClientId ? "border-red-500" : ""}`}>
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
              <Select onValueChange={(value) => setFormData({ ...formData, employee: value })}>
                <SelectTrigger className={`text-right ${validationErrors.employee ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="בחר עובד" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.employee && (
                <p className="text-red-500 text-sm text-right">{validationErrors.employee}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="text-right block">
                רכב *
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, vehicle: value })}>
                <SelectTrigger className={`text-right ${validationErrors.vehicle ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="בחר רכב" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.vehicle && (
                <p className="text-red-500 text-sm text-right">{validationErrors.vehicle}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cart" className="text-right block">
                עגלה/נגרר
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, cart: value })}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר עגלה/נגרר" />
                </SelectTrigger>
                <SelectContent>
                  {carts.map((cart) => (
                    <SelectItem key={cart.id} value={cart.id}>
                      {cart.name} - {cart.details}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
