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
import { CalendarIcon, ClipboardIcon, SettingsIcon, UsersIcon, DollarSign, AlertTriangle } from "lucide-react"
import DatabaseDropdown from "@/components/ui/database-dropdown"
import { useClients, useWorkTypes, useWorkers, useVehicles, useCarts } from "@/hooks/use-job-form-data"
import { useResourceAvailability } from "@/hooks/use-resource-availability"
import ConflictConfirmationDialog from "@/components/jobs/conflict-confirmation-dialog"
import { Badge } from "@/components/ui/badge"

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
  created_at: string
  client_id?: string
  worker_id?: string
  vehicle_id?: string
  cart_id?: string
  service_description?: string
  add_to_calendar?: boolean
  job_specific_shift_rate?: number
  receipt_id?: string
  is_deleted?: boolean
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
    return "ממתין" // Future job - changed from פעיל to ממתין
  }
}

const getPaymentStatus = (jobStatus: string): string => {
  if (jobStatus === "הושלם") {
    return "ממתין לתשלום"
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
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [additionalWorkers, setAdditionalWorkers] = useState<{ id: string; name: string }[]>([])
  const [additionalVehicles, setAdditionalVehicles] = useState<{ id: string; name: string }[]>([])
  const [additionalCarts, setAdditionalCarts] = useState<{ id: string; name: string }[]>([])
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictConfirmed, setConflictConfirmed] = useState(false)
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([])
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

  // Track the original client/workType to detect user-initiated changes
  const [initialClientId, setInitialClientId] = useState("")
  const [initialJobType, setInitialJobType] = useState("")

  // Fetch and auto-fill shift rate ONLY when user changes client or work type
  useEffect(() => {
    if (!open || !formData.clientId || !formData.jobType) return
    // Skip auto-fill if values haven't changed from what was loaded from the job
    if (formData.clientId === initialClientId && formData.jobType === initialJobType) return
    const fetchRate = async () => {
      try {
        const res = await fetch(`/api/clients/${formData.clientId}/rates`)
        if (res.ok) {
          const result = await res.json()
          const rates = result.data || []
          const match = rates.find((r: any) => r.work_type_id === formData.jobType)
          if (match) {
            setFormData(prev => ({ ...prev, jobSpecificShiftRate: match.rate.toString() }))
          }
        }
      } catch {
        // silent — rate auto-fill is convenience, not critical
      }
    }
    fetchRate()
  }, [open, formData.clientId, formData.jobType, initialClientId, initialJobType])

  // Reset form from job prop when modal opens or job changes
  useEffect(() => {
    if (job && open) {
      const workType = workTypes.find(wt => wt.name_he === job.work_type)
      const clientId = job.client_id || ""
      const jobTypeId = workType?.id || ""

      setInitialClientId(clientId)
      setInitialJobType(jobTypeId)
      setFormData({
        jobType: jobTypeId,
        date: job.job_date,
        location: job.site,
        shiftType: job.shift_type,
        city: job.city,
        clientId: clientId,
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
      setValidationErrors({})
      setEditError(null)
      setEditSuccess(null)

      // Fetch additional resources for this job
      const fetchResources = async () => {
        try {
          const res = await fetch(`/api/jobs/${job.id}/resources`)
          if (res.ok) {
            const result = await res.json()
            const resources = result.data || []
            setAdditionalWorkers(resources.filter((r: any) => r.resource_type === 'worker').map((r: any) => ({ id: r.resource_id, name: r.resource_name })))
            setAdditionalVehicles(resources.filter((r: any) => r.resource_type === 'vehicle').map((r: any) => ({ id: r.resource_id, name: r.resource_name })))
            setAdditionalCarts(resources.filter((r: any) => r.resource_type === 'cart').map((r: any) => ({ id: r.resource_id, name: r.resource_name })))
          }
        } catch {
          // silent — additional resources are non-critical
        }
      }
      fetchResources()
    } else {
      // Reset additional resources when modal closes
      setAdditionalWorkers([])
      setAdditionalVehicles([])
      setAdditionalCarts([])
      setConflictConfirmed(false)
      setConflictWarnings([])
    }
  }, [job, workTypes, open])

  // Centralized availability checking via hook
  const allSelectedWorkerIds = [formData.employee, ...additionalWorkers.map(w => w.id)].filter(Boolean)
  const allSelectedVehicleIds = [formData.vehicle, ...additionalVehicles.map(v => v.id)].filter(Boolean)
  const allSelectedCartIds = [formData.cart, ...additionalCarts.map(c => c.id)].filter(Boolean)
  const availability = useResourceAvailability(
    formData.date,
    formData.shiftType,
    employees,
    vehicles,
    allSelectedWorkerIds,
    allSelectedVehicleIds,
    allSelectedCartIds,
  )

  // Sync hook warnings to conflictWarnings state
  useEffect(() => {
    setConflictWarnings(availability.warnings)
  }, [availability.warnings])

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
      setEditError(`שדות חובה חסרים: ${fieldNames}`)
      setSaving(false)
      return
    }

    // Check for conflicts — show confirmation dialog if not yet confirmed
    if (conflictWarnings.length > 0 && !conflictConfirmed) {
      setShowConflictDialog(true)
      setSaving(false)
      return
    }
    setConflictConfirmed(false) // reset for next submit

    try {
      const selectedEmployee = employees.find((emp) => emp.id === formData.employee)
      const selectedVehicle = vehicles.find((veh) => veh.id === formData.vehicle)
      const selectedCart = carts.find((cart) => cart.id === formData.cart)
      const selectedClient = clients.find((c) => c.id === formData.clientId)
      const selectedWorkType = workTypes.find((wt) => wt.id === formData.jobType)

      // Let database trigger handle status calculations automatically
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
        service_description: formData.description || undefined,
        add_to_calendar: formData.calendarSync,
        total_amount: formData.totalAmount ? parseFloat(formData.totalAmount) : 0,
        job_specific_shift_rate: formData.jobSpecificShiftRate ? parseFloat(formData.jobSpecificShiftRate) : undefined,
        notes: formData.notes || '',
        receipt_id: formData.receiptId || undefined,
        // Remove manual status calculations - let database trigger handle it
      }

      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        setEditError(`שגיאה בעדכון העבודה: ${errData.error || response.statusText}`)
        return
      }

      const result = await response.json()

      // Save additional resources
      const allAdditional = [
        ...additionalWorkers.map(w => ({ resource_type: 'worker', resource_id: w.id, resource_name: w.name })),
        ...additionalVehicles.map(v => ({ resource_type: 'vehicle', resource_id: v.id, resource_name: v.name })),
        ...additionalCarts.map(c => ({ resource_type: 'cart', resource_id: c.id, resource_name: c.name })),
      ]
      await fetch(`/api/jobs/${job.id}/resources`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resources: allAdditional }),
      })

      // Calculate refreshed status based on new date
      const refreshedJobStatus = getJobStatus(formData.date)
      
      // Update the job object with new data and refreshed status
      const updatedJob = { 
        ...job, 
        ...updateData, 
        job_status: refreshedJobStatus,
        payment_status: getPaymentStatus(refreshedJobStatus)
      }
      onJobUpdated(updatedJob)
      setEditSuccess("העבודה עודכנה בהצלחה!")
      setTimeout(() => onOpenChange(false), 1500)

    } catch (error) {
      console.error("Failed to update job:", error)
      setEditError("שגיאה בעדכון העבודה")
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
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden bg-white border-0 shadow-2xl">
        <DialogHeader className="text-right pb-4">
          <DialogTitle className="text-xl font-bold text-vazana-dark font-hebrew">
            עריכת עבודה #{job.job_number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto px-1 max-h-[calc(75vh-120px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {editError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-right font-hebrew text-sm mb-4">
              {editError}
            </div>
          )}
          {editSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-right font-hebrew text-sm mb-4">
              {editSuccess}
            </div>
          )}
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
                <div className="text-right space-y-2">
                  <Label htmlFor="employee" className="font-hebrew">
                    עובד <span className="text-red-500">*</span>
                  </Label>
                  <DatabaseDropdown
                    placeholder="בחר עובד"
                    data={employees.filter((e: any) => !additionalWorkers.some(w => w.id === e.id))}
                    displayField="name"
                    valueField="id"
                    value={formData.employee}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, employee: value }))}
                    loading={workersLoading}
                    warningItems={availability.unavailableWorkerIds}
                    className={`${validationErrors.employee ? "border-red-500" : ""} ${formData.employee && availability.unavailableWorkerIds.has(formData.employee) ? "border-red-500" : ""}`}
                  />
                  {additionalWorkers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {additionalWorkers.map(w => (
                        <Badge key={w.id} variant="secondary" className={`text-xs gap-1 font-hebrew ${availability.unavailableWorkerIds.has(w.id) ? 'bg-red-100 text-red-700 border-red-300' : ''}`}>
                          {w.name}
                          <button type="button" onClick={() => setAdditionalWorkers(prev => prev.filter(x => x.id !== w.id))} className="text-gray-500 hover:text-red-500 ml-0.5">&times;</button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {formData.employee && (
                    <button type="button" className="text-xs text-teal-600 hover:text-teal-700 font-hebrew" onClick={() => {
                      const selected = employees.find((e: any) => e.id === formData.employee)
                      if (!selected || additionalWorkers.some(w => w.id === selected.id)) return
                      setAdditionalWorkers(prev => [...prev, { id: selected.id, name: selected.name }])
                      setFormData(prev => ({ ...prev, employee: '' }))
                    }}>+ הוסף עובד נוסף</button>
                  )}
                  {validationErrors.employee && (
                    <p className="text-red-500 text-sm mt-1 font-hebrew">{validationErrors.employee}</p>
                  )}
                </div>

                <div className="text-right space-y-2">
                  <Label htmlFor="vehicle" className="font-hebrew">
                    רכב <span className="text-red-500">*</span>
                  </Label>
                  <DatabaseDropdown
                    placeholder="בחר רכב"
                    data={vehicles.filter((v: any) => !additionalVehicles.some(x => x.id === v.id))}
                    displayField={(vehicle) => `${vehicle.license_plate} - ${vehicle.name}`}
                    valueField="id"
                    value={formData.vehicle}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle: value }))}
                    loading={vehiclesLoading}
                    warningItems={availability.unavailableVehicleIds}
                    className={`${validationErrors.vehicle ? "border-red-500" : ""} ${formData.vehicle && availability.unavailableVehicleIds.has(formData.vehicle) ? "border-red-500" : ""}`}
                  />
                  {additionalVehicles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {additionalVehicles.map(v => (
                        <Badge key={v.id} variant="secondary" className={`text-xs gap-1 font-hebrew ${availability.unavailableVehicleIds.has(v.id) ? 'bg-red-100 text-red-700 border-red-300' : ''}`}>
                          {v.name}
                          <button type="button" onClick={() => setAdditionalVehicles(prev => prev.filter(x => x.id !== v.id))} className="text-gray-500 hover:text-red-500 ml-0.5">&times;</button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {formData.vehicle && (
                    <button type="button" className="text-xs text-teal-600 hover:text-teal-700 font-hebrew" onClick={() => {
                      const selected = vehicles.find((v: any) => v.id === formData.vehicle)
                      if (!selected || additionalVehicles.some(x => x.id === selected.id)) return
                      setAdditionalVehicles(prev => [...prev, { id: selected.id, name: `${selected.license_plate} - ${selected.name}` }])
                      setFormData(prev => ({ ...prev, vehicle: '' }))
                    }}>+ הוסף רכב נוסף</button>
                  )}
                  {validationErrors.vehicle && (
                    <p className="text-red-500 text-sm mt-1 font-hebrew">{validationErrors.vehicle}</p>
                  )}
                </div>

                <div className="text-right space-y-2">
                  <Label htmlFor="cart" className="font-hebrew">עגלה</Label>
                  <DatabaseDropdown
                    placeholder="בחר עגלה (אופציונלי)"
                    data={carts.filter((c: any) => !additionalCarts.some(x => x.id === c.id))}
                    displayField="name"
                    valueField="id"
                    value={formData.cart}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cart: value }))}
                    loading={cartsLoading}
                    allowEmpty
                    warningItems={availability.unavailableCartIds}
                    className={`${formData.cart && availability.unavailableCartIds.has(formData.cart) ? "border-red-500" : ""}`}
                  />
                  {additionalCarts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {additionalCarts.map(c => (
                        <Badge key={c.id} variant="secondary" className={`text-xs gap-1 font-hebrew ${availability.unavailableCartIds.has(c.id) ? 'bg-red-100 text-red-700 border-red-300' : ''}`}>
                          {c.name}
                          <button type="button" onClick={() => setAdditionalCarts(prev => prev.filter(x => x.id !== c.id))} className="text-gray-500 hover:text-red-500 ml-0.5">&times;</button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {formData.cart && (
                    <button type="button" className="text-xs text-teal-600 hover:text-teal-700 font-hebrew" onClick={() => {
                      const selected = carts.find((c: any) => c.id === formData.cart)
                      if (!selected || additionalCarts.some(x => x.id === selected.id)) return
                      setAdditionalCarts(prev => [...prev, { id: selected.id, name: selected.name }])
                      setFormData(prev => ({ ...prev, cart: '' }))
                    }}>+ הוסף עגלה נוספת</button>
                  )}
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
                הוסף ליומן המכשיר
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
        
        {/* Conflict warnings banner */}
        {conflictWarnings.length > 0 && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 space-y-2 mx-1" dir="rtl">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="text-base font-bold text-red-700 font-hebrew">התנגשויות זמינות</h4>
            </div>
            {conflictWarnings.map((w, i) => (
              <p key={i} className="text-sm text-red-700 font-hebrew font-medium">{w}</p>
            ))}
            <p className="text-xs text-red-500 font-hebrew">ניתן להמשיך, אך תתבקש לאשר בשמירה</p>
          </div>
        )}

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-4 justify-end border-t pt-4 mt-4 bg-white sticky bottom-0 z-20">
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

    <ConflictConfirmationDialog
      open={showConflictDialog}
      onOpenChange={setShowConflictDialog}
      warnings={conflictWarnings}
      onConfirm={() => {
        setConflictConfirmed(true)
        // Re-trigger submit via form
        setTimeout(() => {
          const form = document.getElementById('edit-job-form') as HTMLFormElement
          if (form) form.requestSubmit()
        }, 50)
      }}
    />
    </>
  )
}