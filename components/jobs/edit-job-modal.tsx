"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, ClipboardIcon, SettingsIcon, UsersIcon, DollarSign } from "lucide-react"
import DatabaseDropdown from "@/components/ui/database-dropdown"
import { useClients, useWorkTypes, useWorkers, useVehicles, useCarts } from "@/hooks/use-job-form-data"

interface Job {
  id: string
  job_number: string
  client_name: string
  job_date: string
  work_type: string
  shift_type: string
  site: string
  city: string
  worker_name: string
  vehicle_name: string
  cart_name: string
  total_amount: number
  payment_status: string
  job_status: string
  notes: string
  client_id?: string
  worker_id?: string
  vehicle_id?: string
  cart_id?: string
  service_description?: string
  add_to_calendar?: boolean
  job_specific_shift_rate?: number
  receipt_id?: string
}

interface EditJobModalProps {
  job: Job | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobUpdated: (updatedJob: Job) => void
}

// Standardized shift types
const SHIFT_TYPES = [
  { value: "יום", label: "יום" },
  { value: "לילה", label: "לילה" },
  { value: "כפול", label: "כפול" }
]

const getJobStatus = (jobDate: string): string => {
  const now = new Date()
  const jobDateTime = new Date(jobDate)
  const timeDiff = jobDateTime.getTime() - now.getTime()
  const hoursDiff = timeDiff / (1000 * 3600)
  
  if (hoursDiff < -24) {
    return "הושלם" // Past job
  } else if (hoursDiff <= 24) {
    return "בתהליך" // Within 24 hours
  } else {
    return "פעיל" // Future job
  }
}

const getPaymentStatus = (jobStatus: string): string => {
  if (jobStatus === "הושלם") {
    return "ממתין לחשבונית"
  }
  return "לא רלוונטי" // Grayed out until job is finished
}

const getInvoiceStatus = (jobStatus: string): string => {
  if (jobStatus === "הושלם") {
    return "ממתין להפקה"
  }
  return "טרם הופקה חשבונית"
}

export default function EditJobModal({ job, open, onOpenChange, onJobUpdated }: EditJobModalProps) {
  const { clients, loading: clientsLoading } = useClients()
  const { workTypes, loading: workTypesLoading } = useWorkTypes()
  const { workers: employees, loading: workersLoading } = useWorkers()
  const { vehicles, loading: vehiclesLoading } = useVehicles()
  const { carts, loading: cartsLoading } = useCarts()
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    jobType: "",
    date: "",
    location: "",
    shiftType: "",
    city: "",
    clientId: "",
    employee: "",
    vehicle: "",
    cart: "",
    description: "",
    calendarSync: false,
    totalAmount: "",
    jobSpecificShiftRate: "",
    notes: "",
    receiptId: "",
  })

  useEffect(() => {
    if (job) {
      // Find the work type ID from the name
      const workType = workTypes.find(wt => wt.name_he === job.work_type)
      
      setFormData({
        jobType: workType?.id || "",
        date: job.job_date,
        location: job.site,
        shiftType: job.shift_type,
        city: job.city,
        clientId: job.client_id || "",
        employee: job.worker_id || "",
        vehicle: job.vehicle_id || "",
        cart: job.cart_id || "",
        description: job.service_description || "",
        calendarSync: job.add_to_calendar || false,
        totalAmount: job.total_amount?.toString() || "",
        jobSpecificShiftRate: job.job_specific_shift_rate?.toString() || "",
        notes: job.notes || "",
        receiptId: job.receipt_id || "",
      })
    }
  }, [job, workTypes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return

    setValidationErrors({})
    setSaving(true)

    const requiredFields = [
      { field: formData.jobType, name: "סוג עבודה", key: "jobType", message: "בחר סוג עבודה מהרשימה" },
      { field: formData.date, name: "תאריך", key: "date", message: "בחר תאריך לעבודה" },
      { field: formData.location, name: "אתר", key: "location", message: "הכנס שם האתר או המיקום" },
      { field: formData.shiftType, name: "סוג משמרת", key: "shiftType", message: "בחר סוג משמרת" },
      { field: formData.city, name: "עיר", key: "city", message: "הכנס שם העיר" },
      { field: formData.employee, name: "עובד", key: "employee", message: "בחר עובד לעבודה" },
      { field: formData.vehicle, name: "רכב", key: "vehicle", message: "בחר רכב לעבודה" },
    ]

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
      setSaving(false)
      return
    }

    try {
      const selectedEmployee = employees.find((emp) => emp.id === formData.employee)
      const selectedVehicle = vehicles.find((veh) => veh.id === formData.vehicle)
      const selectedCart = carts.find((cart) => cart.id === formData.cart)
      const selectedClient = clients.find((c) => c.id === formData.clientId)
      const selectedWorkType = workTypes.find((wt) => wt.id === formData.jobType)

      // Calculate automatic statuses
      const autoJobStatus = getJobStatus(formData.date)
      const autoPaymentStatus = getPaymentStatus(autoJobStatus)

      const updateData = {
        work_type: selectedWorkType ? selectedWorkType.name_he : "",
        job_date: formData.date,
        site: formData.location,
        shift_type: formData.shiftType,
        city: formData.city,
        client_name: selectedClient?.company_name || job.client_name,
        client_id: selectedClient ? selectedClient.id : null,
        worker_name: selectedEmployee?.name || "",
        worker_id: selectedEmployee ? selectedEmployee.id : null,
        vehicle_name: selectedVehicle ? `${selectedVehicle.license_plate} - ${selectedVehicle.name}` : "",
        vehicle_id: selectedVehicle ? selectedVehicle.id : null,
        cart_name: selectedCart?.name || null,
        cart_id: selectedCart ? selectedCart.id : null,
        service_description: formData.description || null,
        add_to_calendar: formData.calendarSync,
        total_amount: formData.totalAmount ? parseFloat(formData.totalAmount) : null,
        job_specific_shift_rate: formData.jobSpecificShiftRate ? parseFloat(formData.jobSpecificShiftRate) : null,
        notes: formData.notes || null,
        receipt_id: formData.receiptId || null,
        job_status: autoJobStatus,
        payment_status: autoPaymentStatus,
      }

      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error('Failed to update job')
      }

      const result = await response.json()
      
      // Update the job object with new data
      const updatedJob = { ...job, ...updateData }
      onJobUpdated(updatedJob)
      onOpenChange(false)
      alert("העבודה עודכנה בהצלחה!")

    } catch (error) {
      console.error("Failed to update job:", error)
      alert("שגיאה בעדכון העבודה")
    } finally {
      setSaving(false)
    }
  }

  if (!job) return null

  // Calculate current statuses for display
  const currentJobStatus = getJobStatus(formData.date || job.job_date)
  const currentPaymentStatus = getPaymentStatus(currentJobStatus)
  const currentInvoiceStatus = getInvoiceStatus(currentJobStatus)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden bg-white border-0 shadow-2xl">
        <DialogHeader className="text-right pb-4">
          <DialogTitle className="text-xl font-bold text-vazana-dark font-hebrew">
            עריכת עבודה #{job.job_number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto px-1 max-h-[calc(85vh-120px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <form id="edit-job-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Job Info Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardIcon className="w-5 h-5 text-vazana-teal" />
                <h3 className="text-lg font-semibold text-vazana-dark font-hebrew">פרטי העבודה</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <Label htmlFor="jobType" className="font-hebrew">
                    סוג עבודה <span className="text-red-500">*</span>
                  </Label>
                  <DatabaseDropdown
                    placeholder="בחר סוג עבודה"
                    data={workTypes}
                    displayField="name_he"
                    valueField="id"
                    value={formData.jobType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, jobType: value }))}
                    loading={workTypesLoading}
                    className={validationErrors.jobType ? "border-red-500" : ""}
                  />
                  {validationErrors.jobType && (
                    <p className="text-red-500 text-sm mt-1 font-hebrew">{validationErrors.jobType}</p>
                  )}
                </div>

                <div className="text-right">
                  <Label htmlFor="date" className="font-hebrew">
                    תאריך העבודה <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className={`text-right font-hebrew ${validationErrors.date ? "border-red-500" : ""}`}
                  />
                  {validationErrors.date && (
                    <p className="text-red-500 text-sm mt-1 font-hebrew">{validationErrors.date}</p>
                  )}
                </div>

                <div className="text-right">
                  <Label htmlFor="location" className="font-hebrew">
                    אתר/מיקום <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="הכנס שם האתר או המיקום"
                    className={`text-right font-hebrew ${validationErrors.location ? "border-red-500" : ""}`}
                  />
                  {validationErrors.location && (
                    <p className="text-red-500 text-sm mt-1 font-hebrew">{validationErrors.location}</p>
                  )}
                </div>

                <div className="text-right">
                  <Label htmlFor="city" className="font-hebrew">
                    עיר <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="הכנס שם העיר"
                    className={`text-right font-hebrew ${validationErrors.city ? "border-red-500" : ""}`}
                  />
                  {validationErrors.city && (
                    <p className="text-red-500 text-sm mt-1 font-hebrew">{validationErrors.city}</p>
                  )}
                </div>

                <div className="text-right">
                  <Label htmlFor="shiftType" className="font-hebrew">
                    סוג משמרת <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.shiftType} onValueChange={(value) => setFormData(prev => ({ ...prev, shiftType: value }))}>
                    <SelectTrigger className={`text-right font-hebrew ${validationErrors.shiftType ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="בחר סוג משמרת" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TYPES.map((shift) => (
                        <SelectItem key={shift.value} value={shift.value}>
                          {shift.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.shiftType && (
                    <p className="text-red-500 text-sm mt-1 font-hebrew">{validationErrors.shiftType}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Resources Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <UsersIcon className="w-5 h-5 text-vazana-teal" />
                <h3 className="text-lg font-semibold text-vazana-dark font-hebrew">משאבים</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-right">
                  <Label htmlFor="employee" className="font-hebrew">
                    עובד <span className="text-red-500">*</span>
                  </Label>
                  <DatabaseDropdown
                    placeholder="בחר עובד"
                    data={employees}
                    displayField="name"
                    valueField="id"
                    value={formData.employee}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, employee: value }))}
                    loading={workersLoading}
                    className={validationErrors.employee ? "border-red-500" : ""}
                  />
                  {validationErrors.employee && (
                    <p className="text-red-500 text-sm mt-1 font-hebrew">{validationErrors.employee}</p>
                  )}
                </div>

                <div className="text-right">
                  <Label htmlFor="vehicle" className="font-hebrew">
                    רכב <span className="text-red-500">*</span>
                  </Label>
                  <DatabaseDropdown
                    placeholder="בחר רכב"
                    data={vehicles}
                    displayField={(vehicle) => `${vehicle.license_plate} - ${vehicle.name}`}
                    valueField="id"
                    value={formData.vehicle}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle: value }))}
                    loading={vehiclesLoading}
                    className={validationErrors.vehicle ? "border-red-500" : ""}
                  />
                  {validationErrors.vehicle && (
                    <p className="text-red-500 text-sm mt-1 font-hebrew">{validationErrors.vehicle}</p>
                  )}
                </div>

                <div className="text-right">
                  <Label htmlFor="cart" className="font-hebrew">עגלה</Label>
                  <DatabaseDropdown
                    placeholder="בחר עגלה (אופציונלי)"
                    data={carts}
                    displayField="name"
                    valueField="id"
                    value={formData.cart}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cart: value }))}
                    loading={cartsLoading}
                    allowEmpty
                  />
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <SettingsIcon className="w-5 h-5 text-vazana-teal" />
                <h3 className="text-lg font-semibold text-vazana-dark font-hebrew">סטטוס העבודה</h3>
              </div>
              
              <div className="text-right">
                <Label className="font-hebrew">סטטוס העבודה (אוטומטי)</Label>
                <Input
                  value={currentJobStatus}
                  disabled
                  className="text-right font-hebrew bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1 font-hebrew">
                  הסטטוס מחושב אוטומטית לפי תאריך העבודה
                </p>
              </div>
            </div>
            
            {/* Payment Section */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-vazana-teal" />
                <h3 className="text-lg font-semibold text-vazana-dark font-hebrew">תשלום וחשבונית</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <Label className="font-hebrew">סטטוס תשלום (אוטומטי)</Label>
                  <Input
                    value={currentPaymentStatus}
                    disabled
                    className={`text-right font-hebrew ${currentPaymentStatus === "לא רלוונטי" ? "bg-gray-200 text-gray-500" : "bg-gray-100"}`}
                  />
                  <p className="text-xs text-gray-500 mt-1 font-hebrew">
                    זמין רק לאחר השלמת העבודה
                  </p>
                </div>

                <div className="text-right">
                  <Label className="font-hebrew">מספר חשבונית (אוטומטי)</Label>
                  <Input
                    value={currentInvoiceStatus}
                    disabled
                    className="text-right font-hebrew bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-hebrew">
                    יעודכן אוטומטית לאחר הפקת החשבונית
                  </p>
                </div>

                <div className="text-right">
                  <Label htmlFor="totalAmount" className="font-hebrew">סכום כולל</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                    placeholder="0.00"
                    className="text-right font-hebrew"
                  />
                </div>
                
                <div className="text-right">
                  <Label htmlFor="jobSpecificShiftRate" className="font-hebrew">תעריף משמרת</Label>
                  <Input
                    id="jobSpecificShiftRate"
                    type="number"
                    step="0.01"
                    value={formData.jobSpecificShiftRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobSpecificShiftRate: e.target.value }))}
                    placeholder="0.00"
                    className="text-right font-hebrew"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <div className="text-right">
                <Label htmlFor="description" className="font-hebrew">תיאור העבודה</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תאר את העבודה בפירוט..."
                  className="text-right font-hebrew min-h-[100px]"
                />
              </div>

              <div className="flex items-center gap-3 text-right justify-end">
                <Label htmlFor="calendarSync" className="font-hebrew">
                  הוסף ללוח השנה
                </Label>
                <Switch
                  id="calendarSync"
                  checked={formData.calendarSync}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, calendarSync: checked }))}
                />
                <CalendarIcon className="w-4 h-4 text-vazana-teal" />
              </div>
            </div>
          </form>
        </div>
        
        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-4 justify-end border-t pt-4 mt-4 bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-hebrew"
          >
            ביטול
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
            form="edit-job-form"
          >
            {saving ? "שומר..." : "שמור שינויים"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}