"use client"

import { useState, useEffect } from "react"
import PageLayout from "@/components/layout/page-layout"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getModalClasses } from "@/lib/modal-utils"
import { toast } from "@/hooks/use-toast"
import {
  Save,
  Search,
  ArrowUp,
  ArrowDown,
  List,
  Table2,
  Pencil,
  Trash2,
  ShoppingCart,
  Truck,
  User,
  Wrench,
  Plus,
  FlaskConical,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"

// ===========================================================================
// Types
// ===========================================================================

type ResourceType = "workers" | "vehicles" | "carts" | "work_types"

interface FieldDef {
  name: string
  label: string
  type: "text" | "number" | "tel" | "email" | "textarea"
  required?: boolean
  placeholder?: string
}

interface StatusOption {
  id: string
  category: string
  value: string
  color: string
  is_default: boolean
  sort_order: number
}

interface WorkerRow {
  id: string
  name: string
  phone_number: string
  address: string
  shift_rate: number
  payment_terms_days: number
  notes: string
  availability: Record<string, boolean>
}

interface VehicleRow {
  id: string
  name: string
  license_plate: string
  details: string
}

interface CartRow {
  id: string
  name: string
  license_plate: string
  details: string
}

interface WorkTypeRow {
  id: string
  name_he: string
  name_en: string
  default_rate: number
}

interface MockJob {
  id: string
  job_number: string
  client_name: string
  work_type: string
  job_date: string
  shift_type: string
  site: string
  city: string
  worker_name: string
  vehicle_name: string
  total_amount: number
  job_status: string
  payment_status: string
  has_documents: boolean
}

// ===========================================================================
// Mock data — Resources
// ===========================================================================

const MOCK_WORKERS: WorkerRow[] = [
  {
    id: "w1",
    name: "יוסי כהן",
    phone_number: "050-1234567",
    address: "תל אביב, רחוב הרצל 12",
    shift_rate: 350,
    payment_terms_days: 30,
    notes: "עובד מנוסה, רישיון CE",
    availability: { "sun_day": true, "sun_night": false, "mon_day": true, "mon_night": true, "tue_day": true, "tue_night": false, "wed_day": true, "wed_night": false, "thu_day": true, "thu_night": true, "fri_day": false, "fri_night": false, "sat_day": false, "sat_night": false },
  },
  {
    id: "w2",
    name: "דוד לוי",
    phone_number: "052-9876543",
    address: "חיפה, שדרות הנשיא 45",
    shift_rate: 300,
    payment_terms_days: 15,
    notes: "",
    availability: { "sun_day": true, "sun_night": true, "mon_day": true, "mon_night": true, "tue_day": false, "tue_night": false, "wed_day": true, "wed_night": true, "thu_day": true, "thu_night": false, "fri_day": true, "fri_night": false, "sat_day": false, "sat_night": false },
  },
  {
    id: "w3",
    name: "משה אברהם",
    phone_number: "054-5551234",
    address: "באר שבע, רחוב רגר 8",
    shift_rate: 400,
    payment_terms_days: 45,
    notes: "מנהל צוות",
    availability: { "sun_day": true, "sun_night": true, "mon_day": true, "mon_night": true, "tue_day": true, "tue_night": true, "wed_day": true, "wed_night": true, "thu_day": true, "thu_night": true, "fri_day": false, "fri_night": false, "sat_day": false, "sat_night": false },
  },
]

const MOCK_VEHICLES: VehicleRow[] = [
  { id: "v1", name: "משאית מרצדס", license_plate: "12-345-67", details: "משאית 12 טון, שנת 2022" },
  { id: "v2", name: "טנדר פורד", license_plate: "98-765-43", details: "טנדר כבד, שנת 2021" },
  { id: "v3", name: "משאית וולוו", license_plate: "55-123-99", details: "משאית 18 טון, שנת 2023" },
]

const MOCK_CARTS: CartRow[] = [
  { id: "c1", name: "עגלה ראשית", license_plate: "77-888-00", details: "עגלת הובלה כבדה" },
  { id: "c2", name: "עגלה משנית", license_plate: "33-444-55", details: "עגלת שילוט" },
]

const MOCK_WORK_TYPES: WorkTypeRow[] = [
  { id: "wt1", name_he: "ליווי תנועה", name_en: "Traffic Escort", default_rate: 1200 },
  { id: "wt2", name_he: "הצבת תמרורים", name_en: "Sign Placement", default_rate: 800 },
  { id: "wt3", name_he: "אבטחת כביש", name_en: "Road Security", default_rate: 1500 },
]

// ===========================================================================
// Mock data — Jobs
// ===========================================================================

const MOCK_JOBS: MockJob[] = [
  {
    id: "j1",
    job_number: "1042",
    client_name: "חברת כבישי ישראל",
    work_type: "ליווי תנועה",
    job_date: "2026-04-01",
    shift_type: "יום",
    site: "צומת גהה",
    city: "פתח תקווה",
    worker_name: "יוסי כהן",
    vehicle_name: "משאית מרצדס",
    total_amount: 2400,
    job_status: "הושלם",
    payment_status: "שולם",
    has_documents: true,
  },
  {
    id: "j2",
    job_number: "1043",
    client_name: "עיריית תל אביב",
    work_type: "הצבת תמרורים",
    job_date: "2026-04-02",
    shift_type: "לילה",
    site: "רחוב אבן גבירול",
    city: "תל אביב",
    worker_name: "דוד לוי",
    vehicle_name: "טנדר פורד",
    total_amount: 1600,
    job_status: "בתהליך",
    payment_status: "לא רלוונטי",
    has_documents: false,
  },
  {
    id: "j3",
    job_number: "1044",
    client_name: "חברת כבישי ישראל",
    work_type: "אבטחת כביש",
    job_date: "2026-04-05",
    shift_type: "כפול",
    site: "כביש 6 צפון",
    city: "חדרה",
    worker_name: "משה אברהם",
    vehicle_name: "משאית וולוו",
    total_amount: 3000,
    job_status: "ממתין",
    payment_status: "לא רלוונטי",
    has_documents: true,
  },
  {
    id: "j4",
    job_number: "1045",
    client_name: "נתיבי איילון",
    work_type: "ליווי תנועה",
    job_date: "2026-04-06",
    shift_type: "יום",
    site: "מחלף השלום",
    city: "תל אביב",
    worker_name: "יוסי כהן",
    vehicle_name: "משאית מרצדס",
    total_amount: 2200,
    job_status: "ממתין",
    payment_status: "לא רלוונטי",
    has_documents: false,
  },
]

// ===========================================================================
// Field definitions per resource
// ===========================================================================

const WORKER_FIELDS: FieldDef[] = [
  { name: "name", label: "שם העובד", type: "text", required: true },
  { name: "phone_number", label: "מספר טלפון", type: "tel", required: true, placeholder: "050-1234567" },
  { name: "address", label: "כתובת", type: "text" },
  { name: "shift_rate", label: "תעריף משמרת (₪)", type: "number" },
  { name: "payment_terms_days", label: "תנאי תשלום (ימים)", type: "number", placeholder: "30" },
  { name: "notes", label: "הערות", type: "textarea" },
]

const VEHICLE_FIELDS: FieldDef[] = [
  { name: "name", label: "שם הרכב", type: "text", required: true },
  { name: "license_plate", label: "לוחית רישוי", type: "text", required: true, placeholder: "12-345-67" },
  { name: "details", label: "פרטים", type: "text" },
]

const CART_FIELDS: FieldDef[] = [
  { name: "name", label: "שם העגלה", type: "text", required: true },
  { name: "license_plate", label: "לוחית רישוי", type: "text", placeholder: "12-345-67" },
  { name: "details", label: "פרטים", type: "text" },
]

const WORK_TYPE_FIELDS: FieldDef[] = [
  { name: "name_he", label: "שם בעברית", type: "text", required: true },
  { name: "name_en", label: "שם באנגלית", type: "text", required: true },
  { name: "default_rate", label: "תעריף ברירת מחדל (₪)", type: "number" },
]

const RESOURCE_CONFIG: Record<ResourceType, {
  label: string
  icon: typeof User
  fields: FieldDef[]
  addTitle: string
  editTitle: string
}> = {
  workers: { label: "עובדים", icon: User, fields: WORKER_FIELDS, addTitle: "הוספת עובד", editTitle: "עריכת עובד" },
  vehicles: { label: "כלי רכב", icon: Truck, fields: VEHICLE_FIELDS, addTitle: "הוספת רכב", editTitle: "עריכת רכב" },
  carts: { label: "עגלות", icon: ShoppingCart, fields: CART_FIELDS, addTitle: "הוספת עגלה", editTitle: "עריכת עגלה" },
  work_types: { label: "סוגי עבודה", icon: Wrench, fields: WORK_TYPE_FIELDS, addTitle: "הוספת סוג עבודה", editTitle: "עריכת סוג עבודה" },
}

// ===========================================================================
// Availability Grid component (for worker modal)
// ===========================================================================

const DAY_LABELS = [
  { key: "sun", label: "ראשון" },
  { key: "mon", label: "שני" },
  { key: "tue", label: "שלישי" },
  { key: "wed", label: "רביעי" },
  { key: "thu", label: "חמישי" },
  { key: "fri", label: "שישי" },
  { key: "sat", label: "שבת" },
]

function AvailabilityGrid({
  availability,
  onChange,
}: {
  availability: Record<string, boolean>
  onChange: (newAvailability: Record<string, boolean>) => void
}) {
  const toggle = (key: string) => {
    onChange({ ...availability, [key]: !availability[key] })
  }

  return (
    <div className="space-y-2">
      <Label className="font-hebrew text-right block">זמינות</Label>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-xs" dir="rtl">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-2 font-hebrew font-medium text-gray-600 text-right">יום</th>
              <th className="p-2 font-hebrew font-medium text-gray-600 text-center">יום</th>
              <th className="p-2 font-hebrew font-medium text-gray-600 text-center">לילה</th>
            </tr>
          </thead>
          <tbody>
            {DAY_LABELS.map((day) => (
              <tr key={day.key} className="border-b last:border-0">
                <td className="p-2 font-hebrew font-medium text-gray-700">{day.label}</td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => toggle(`${day.key}_day`)}
                    className={`w-7 h-7 rounded-md border text-xs font-bold transition-colors ${
                      availability[`${day.key}_day`]
                        ? "bg-teal-500 text-white border-teal-600"
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {availability[`${day.key}_day`] ? "V" : ""}
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => toggle(`${day.key}_night`)}
                    className={`w-7 h-7 rounded-md border text-xs font-bold transition-colors ${
                      availability[`${day.key}_night`]
                        ? "bg-indigo-500 text-white border-indigo-600"
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {availability[`${day.key}_night`] ? "V" : ""}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ===========================================================================
// Resource Modal (add / edit)
// ===========================================================================

function ResourceModal({
  open,
  onOpenChange,
  resourceType,
  editData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceType: ResourceType
  editData: Record<string, any> | null
}) {
  const config = RESOURCE_CONFIG[resourceType]
  const isEdit = editData !== null
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const initial: Record<string, any> = {}
      for (const field of config.fields) {
        initial[field.name] = editData?.[field.name] ?? ""
      }
      setFormData(initial)
      if (resourceType === "workers") {
        setAvailability(editData?.availability ?? {})
      }
    }
  }, [open, editData, config.fields, resourceType])

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      onOpenChange(false)
      toast({
        title: isEdit ? "העדכון נשמר (דמו)" : "הרשומה נוספה (דמו)",
        description: "שינויים כאן לא משפיעים על המערכת",
      })
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getModalClasses("md", true)} dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-hebrew" dir="rtl">
            <config.icon className="w-5 h-5 text-vazana-teal" />
            <span>{isEdit ? config.editTitle : config.addTitle}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          {config.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label className="font-hebrew text-right block">
                {field.label}
                {field.required && <span className="text-red-500 mr-1">*</span>}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  placeholder={field.placeholder}
                  className="text-right font-hebrew min-h-[60px]"
                  dir="rtl"
                />
              ) : (
                <Input
                  type={field.type}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  placeholder={field.placeholder}
                  className="text-right font-hebrew"
                  dir="rtl"
                />
              )}
            </div>
          ))}

          {resourceType === "workers" && (
            <AvailabilityGrid
              availability={availability}
              onChange={setAvailability}
            />
          )}

          <div className="flex gap-3 justify-start pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-hebrew"
            >
              <Save className="w-4 h-4 ml-1" />
              {isSubmitting ? "שומר..." : "שמור"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-hebrew"
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ===========================================================================
// TAB 1: Resources Section
// ===========================================================================

function ResourcesSection() {
  const [selected, setSelected] = useState<ResourceType>("workers")
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<Record<string, any> | null>(null)

  const counts: Record<ResourceType, number> = {
    workers: MOCK_WORKERS.length,
    vehicles: MOCK_VEHICLES.length,
    carts: MOCK_CARTS.length,
    work_types: MOCK_WORK_TYPES.length,
  }

  const openAdd = () => {
    setEditData(null)
    setModalOpen(true)
  }

  const openEdit = (data: Record<string, any>) => {
    setEditData(data)
    setModalOpen(true)
  }

  const handleDelete = (name: string) => {
    toast({
      title: `"${name}" נמחק (דמו)`,
      description: "שינויים כאן לא משפיעים על המערכת",
    })
  }

  const resourceTypes: ResourceType[] = ["workers", "vehicles", "carts", "work_types"]

  return (
    <div className="space-y-6">
      {/* Resource selector — EXACT match of Settings > ניהול משאבים tab */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-hebrew" dir="rtl">
            <Wrench className="w-5 h-5 text-teal-600" />
            <span>ניהול משאבים</span>
          </CardTitle>
          <p className="text-sm text-gray-500 text-right font-hebrew">נהל עובדים, רכבים וציוד</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
          {resourceTypes.map((rt) => {
            const cfg = RESOURCE_CONFIG[rt]
            const Icon = cfg.icon
            const isActive = selected === rt
            const iconColors: Record<ResourceType, string> = {
              workers: "text-blue-600",
              vehicles: "text-green-600",
              carts: "text-purple-600",
              work_types: "text-orange-600",
            }
            return (
              <Button
                key={rt}
                variant="outline"
                className={`h-24 flex flex-col items-center gap-2 font-hebrew relative ${
                  isActive ? "border-teal-500 bg-teal-50 ring-1 ring-teal-300" : ""
                }`}
                onClick={() => setSelected(rt)}
              >
                <Icon className={`w-8 h-8 ${iconColors[rt]}`} />
                <span>{cfg.label}</span>
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 font-bold"
                >
                  {counts[rt]}
                </Badge>
              </Button>
            )
          })}
        </CardContent>
      </Card>

      {/* Add button */}
      <div className="flex justify-start" dir="rtl">
        <Button
          onClick={openAdd}
          className="bg-teal-600 hover:bg-teal-700 text-white font-hebrew gap-2"
        >
          <Plus className="w-4 h-4" />
          הוסף חדש
        </Button>
      </div>

      {/* Resource table */}
      <Card>
        <div className="overflow-x-auto">
          {selected === "workers" && (
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">שם</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">טלפון</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600 hidden md:table-cell">כתובת</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">תעריף</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600 hidden lg:table-cell">תנאי תשלום</th>
                  <th className="text-center p-3 font-hebrew font-medium text-gray-600">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_WORKERS.map((w) => (
                  <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-hebrew font-medium text-gray-900">{w.name}</td>
                    <td className="p-3 font-hebrew text-gray-600" dir="ltr">{w.phone_number}</td>
                    <td className="p-3 font-hebrew text-gray-500 hidden md:table-cell">{w.address}</td>
                    <td className="p-3 font-hebrew text-gray-700">{w.shift_rate} &#8362;</td>
                    <td className="p-3 font-hebrew text-gray-500 hidden lg:table-cell">{w.payment_terms_days} ימים</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(w)} className="text-vazana-teal hover:text-teal-700">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(w.name)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selected === "vehicles" && (
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">שם</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">לוחית רישוי</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">פרטים</th>
                  <th className="text-center p-3 font-hebrew font-medium text-gray-600">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_VEHICLES.map((v) => (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-hebrew font-medium text-gray-900">{v.name}</td>
                    <td className="p-3 font-hebrew text-gray-600" dir="ltr">{v.license_plate}</td>
                    <td className="p-3 font-hebrew text-gray-500">{v.details}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(v)} className="text-vazana-teal hover:text-teal-700">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(v.name)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selected === "carts" && (
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">שם</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">לוחית רישוי</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">פרטים</th>
                  <th className="text-center p-3 font-hebrew font-medium text-gray-600">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CARTS.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-hebrew font-medium text-gray-900">{c.name}</td>
                    <td className="p-3 font-hebrew text-gray-600" dir="ltr">{c.license_plate}</td>
                    <td className="p-3 font-hebrew text-gray-500">{c.details}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="text-vazana-teal hover:text-teal-700">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.name)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selected === "work_types" && (
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">שם בעברית</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">שם באנגלית</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">תעריף ברירת מחדל</th>
                  <th className="text-center p-3 font-hebrew font-medium text-gray-600">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_WORK_TYPES.map((wt) => (
                  <tr key={wt.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-hebrew font-medium text-gray-900">{wt.name_he}</td>
                    <td className="p-3 text-gray-600" dir="ltr">{wt.name_en}</td>
                    <td className="p-3 font-hebrew text-gray-700">{wt.default_rate} &#8362;</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(wt)} className="text-vazana-teal hover:text-teal-700">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(wt.name_he)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modal */}
      <ResourceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        resourceType={selected}
        editData={editData}
      />
    </div>
  )
}

// ===========================================================================
// TAB 2: Jobs List Prototype
// ===========================================================================

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "הושלם":
      return "bg-green-100 text-green-700 border-green-300"
    case "בתהליך":
      return "bg-yellow-100 text-yellow-700 border-yellow-300"
    case "ממתין":
      return "bg-blue-100 text-blue-700 border-blue-300"
    default:
      return "bg-gray-100 text-gray-600 border-gray-300"
  }
}

function getPaymentBadgeClasses(status: string): string {
  switch (status) {
    case "שולם":
      return "bg-green-100 text-green-700 border-green-300"
    case "ממתין לתשלום":
      return "bg-orange-100 text-orange-700 border-orange-300"
    case "מאוחר":
      return "bg-red-100 text-red-700 border-red-300"
    case "לא רלוונטי":
      return "bg-gray-100 text-gray-500 border-gray-200"
    default:
      return "bg-gray-100 text-gray-600 border-gray-300"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "הושלם":
      return <CheckCircle className="w-3.5 h-3.5" />
    case "בתהליך":
      return <Clock className="w-3.5 h-3.5" />
    case "ממתין":
      return <AlertTriangle className="w-3.5 h-3.5" />
    default:
      return null
  }
}

function JobsListSection() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [showDeleted, setShowDeleted] = useState(false)
  const [sortBy, setSortBy] = useState<"number" | "date" | "client">("number")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"list" | "table">("list")

  const filtered = MOCK_JOBS.filter((job) => {
    const matchesSearch =
      searchTerm === "" ||
      job.job_number.includes(searchTerm) ||
      job.client_name.includes(searchTerm) ||
      job.work_type.includes(searchTerm) ||
      job.worker_name.includes(searchTerm) ||
      job.city.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || job.job_status === statusFilter
    const matchesPayment = paymentFilter === "all" || job.payment_status === paymentFilter
    return matchesSearch && matchesStatus && matchesPayment
  }).sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    if (sortBy === "number") return (parseInt(a.job_number) - parseInt(b.job_number)) * dir
    if (sortBy === "date") return a.job_date.localeCompare(b.job_date) * dir
    return a.client_name.localeCompare(b.client_name, "he") * dir
  })

  const stats = {
    total: MOCK_JOBS.length,
    inProgress: MOCK_JOBS.filter((j) => j.job_status === "בתהליך").length,
    pending: MOCK_JOBS.filter((j) => j.job_status === "ממתין").length,
    completed: MOCK_JOBS.filter((j) => j.job_status === "הושלם").length,
  }

  const handleSortToggle = (field: "number" | "date" | "client") => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(field)
      setSortDir("desc")
    }
  }

  const showToast = (msg: string) => {
    toast({ title: msg, description: "שינויים כאן לא משפיעים על המערכת" })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 text-sm font-hebrew" dir="rtl">
        <span className="text-gray-600">
          סה&quot;כ עבודות: <strong className="text-gray-900">{stats.total}</strong>
        </span>
        <span className="text-yellow-600">
          בתהליך: <strong>{stats.inProgress}</strong>
        </span>
        <span className="text-blue-600">
          ממתין: <strong>{stats.pending}</strong>
        </span>
        <span className="text-green-600">
          הושלם: <strong>{stats.completed}</strong>
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2" dir="rtl">
        <Button
          onClick={() => showToast("יצירת עבודה חדשה (דמו)")}
          className="bg-teal-600 hover:bg-teal-700 text-white font-hebrew gap-1.5"
        >
          <Plus className="w-4 h-4" />
          עבודה חדשה
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => showToast("ייבוא (דמו)")}
          className="font-hebrew gap-1.5"
        >
          <Upload className="w-4 h-4" />
          ייבוא
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => showToast("ייצוא Excel (דמו)")}
          className="font-hebrew gap-1.5"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => showToast("ייצוא CSV (דמו)")}
          className="font-hebrew gap-1.5"
        >
          <Download className="w-4 h-4" />
          CSV
        </Button>

        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* Sort buttons */}
        {(["number", "date", "client"] as const).map((field) => {
          const labels = { number: "מספר", date: "תאריך", client: "לקוח" }
          const isActive = sortBy === field
          return (
            <Button
              key={field}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortToggle(field)}
              className={`font-hebrew gap-1 text-xs ${isActive ? "bg-gray-800 text-white" : ""}`}
            >
              {labels[field]}
              {isActive && (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
            </Button>
          )
        })}

        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* View toggle */}
        <div className="flex border rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 ${viewMode === "list" ? "bg-teal-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 ${viewMode === "table" ? "bg-teal-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
          >
            <Table2 className="w-4 h-4" />
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchTerm("")
            setStatusFilter("all")
            setPaymentFilter("all")
          }}
          className="font-hebrew gap-1 text-gray-500 text-xs"
        >
          <X className="w-3 h-3" />
          נקה סינון
        </Button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3" dir="rtl">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חפש עבודות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 text-right font-hebrew"
            dir="rtl"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] font-hebrew text-right" dir="rtl">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="ממתין">ממתין</SelectItem>
            <SelectItem value="בתהליך">בתהליך</SelectItem>
            <SelectItem value="הושלם">הושלם</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[160px] font-hebrew text-right" dir="rtl">
            <SelectValue placeholder="תשלום" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="ממתין לתשלום">ממתין לתשלום</SelectItem>
            <SelectItem value="שולם">שולם</SelectItem>
            <SelectItem value="מאוחר">מאוחר</SelectItem>
            <SelectItem value="לא רלוונטי">לא רלוונטי</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm font-hebrew text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="rounded border-gray-300"
          />
          הצג מחוקים
        </label>
      </div>

      {/* List view */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {filtered.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4" dir="rtl">
                <div className="flex items-center gap-4">
                  {/* Right section: main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-hebrew font-bold text-gray-900 text-base">#{job.job_number}</span>
                      <span className="font-hebrew text-gray-700">{job.client_name}</span>
                      <Badge variant="outline" className="font-hebrew text-xs bg-gray-50">
                        {job.work_type}
                      </Badge>
                      <span className="text-sm text-gray-500 font-hebrew flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(job.job_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-hebrew">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.site}, {job.city}
                      </span>
                      <span>|</span>
                      <span>{job.shift_type}</span>
                    </div>
                  </div>

                  {/* Center: badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`font-hebrew text-xs gap-1 ${getStatusBadgeClasses(job.job_status)}`}>
                      {getStatusIcon(job.job_status)}
                      {job.job_status}
                    </Badge>
                    <Badge variant="outline" className={`font-hebrew text-xs ${getPaymentBadgeClasses(job.payment_status)}`}>
                      {job.payment_status}
                    </Badge>
                    <span className="font-hebrew font-semibold text-gray-900 text-sm">
                      {job.total_amount.toLocaleString()} &#8362;
                    </span>
                  </div>

                  {/* Left: worker / vehicle / documents */}
                  <div className="flex items-center gap-3 shrink-0 text-sm text-gray-600">
                    <span className="flex items-center gap-1 font-hebrew">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {job.worker_name}
                    </span>
                    <span className="flex items-center gap-1 font-hebrew">
                      <Truck className="w-3.5 h-3.5 text-gray-400" />
                      {job.vehicle_name}
                    </span>
                    {job.has_documents && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 gap-1">
                        <FileText className="w-3 h-3" />
                        קבצים
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">#</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">לקוח</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">סוג</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">תאריך</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">משמרת</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600 hidden md:table-cell">אתר</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600 hidden md:table-cell">עיר</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600 hidden lg:table-cell">עובד</th>
                  <th className="text-center p-3 font-hebrew font-medium text-gray-600">סטטוס</th>
                  <th className="text-right p-3 font-hebrew font-medium text-gray-600">סכום</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="p-3 font-hebrew font-bold text-gray-900">{job.job_number}</td>
                    <td className="p-3 font-hebrew text-gray-700">{job.client_name}</td>
                    <td className="p-3 font-hebrew text-gray-600">{job.work_type}</td>
                    <td className="p-3 font-hebrew text-gray-600">{formatDate(job.job_date)}</td>
                    <td className="p-3 font-hebrew text-gray-600">{job.shift_type}</td>
                    <td className="p-3 font-hebrew text-gray-500 hidden md:table-cell">{job.site}</td>
                    <td className="p-3 font-hebrew text-gray-500 hidden md:table-cell">{job.city}</td>
                    <td className="p-3 font-hebrew text-gray-600 hidden lg:table-cell">{job.worker_name}</td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className={`font-hebrew text-xs gap-1 ${getStatusBadgeClasses(job.job_status)}`}>
                        {getStatusIcon(job.job_status)}
                        {job.job_status}
                      </Badge>
                    </td>
                    <td className="p-3 font-hebrew font-semibold text-gray-900">{job.total_amount.toLocaleString()} &#8362;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 font-hebrew text-gray-500">
          לא נמצאו עבודות התואמות לסינון
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// TAB 3: Status Options (from existing code)
// ===========================================================================

function StatusOptionsSection() {
  const [statuses, setStatuses] = useState<StatusOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/status-options")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((result) => {
        setStatuses(result.data ?? [])
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12 font-hebrew text-gray-500">טוען סטטוסים...</div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center" dir="rtl">
          <p className="font-hebrew text-red-600">שגיאה בטעינת סטטוסים: {error}</p>
          <p className="font-hebrew text-sm text-gray-500 mt-2">
            ודא שהטבלה status_options קיימת ושנתיב /api/status-options זמין.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (statuses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center" dir="rtl">
          <p className="font-hebrew text-gray-500">לא נמצאו סטטוסים. טבלת status_options ריקה או לא קיימת.</p>
        </CardContent>
      </Card>
    )
  }

  const grouped: Record<string, StatusOption[]> = {}
  for (const s of statuses) {
    const cat = s.category || "ללא קטגוריה"
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(s)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="font-hebrew text-base">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-right p-2 font-hebrew font-medium text-gray-600">ערך</th>
                    <th className="text-right p-2 font-hebrew font-medium text-gray-600">צבע</th>
                    <th className="text-center p-2 font-hebrew font-medium text-gray-600">ברירת מחדל</th>
                    <th className="text-center p-2 font-hebrew font-medium text-gray-600">סדר</th>
                  </tr>
                </thead>
                <tbody>
                  {items
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="p-2 font-hebrew">{s.value}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-4 h-4 rounded-full border"
                              style={{ backgroundColor: s.color || "#ccc" }}
                            />
                            <span className="text-xs text-gray-500">{s.color || "---"}</span>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          {s.is_default ? (
                            <Badge className="bg-teal-100 text-teal-700 border-teal-300">ברירת מחדל</Badge>
                          ) : (
                            <span className="text-gray-300">---</span>
                          )}
                        </td>
                        <td className="p-2 text-center text-gray-500">{s.sort_order ?? "---"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ===========================================================================
// Main Sandbox Page
// ===========================================================================

export default function SandboxPage() {
  return (
    <PageLayout title="ארגז חול" titleIcon={FlaskConical}>
      {/* Banner */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center" dir="rtl">
        <p className="font-hebrew text-amber-800 font-medium">
          דף בדיקות — שינויים כאן לא משפיעים על המערכת
        </p>
      </div>

      <Tabs defaultValue="resources" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="resources" className="font-hebrew">משאבים</TabsTrigger>
          <TabsTrigger value="lists" className="font-hebrew">רשימות</TabsTrigger>
          <TabsTrigger value="statuses" className="font-hebrew">סטטוסים</TabsTrigger>
        </TabsList>

        {/* ---- Tab 1: Resources ---- */}
        <TabsContent value="resources">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-hebrew text-lg">ניהול משאבים — אב-טיפוס</CardTitle>
              </CardHeader>
              <CardContent dir="rtl">
                <p className="font-hebrew text-sm text-gray-600 mb-4">
                  עמוד אחד לניהול כל המשאבים: עובדים, כלי רכב, עגלות וסוגי עבודה. בחר קטגוריה, הוסף או ערוך רשומות.
                </p>
                <ResourcesSection />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---- Tab 2: Lists ---- */}
        <TabsContent value="lists">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-hebrew text-lg">עמוד רשימת עבודות — אב-טיפוס</CardTitle>
              </CardHeader>
              <CardContent dir="rtl">
                <p className="font-hebrew text-sm text-gray-600 mb-4">
                  רשימה אחידה עם חיפוש, מיון, סינון ותצוגת רשימה / טבלה. נתונים לדוגמה בלבד.
                </p>
                <JobsListSection />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---- Tab 3: Statuses ---- */}
        <TabsContent value="statuses">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-hebrew text-lg">סטטוסים מטבלת status_options</CardTitle>
              </CardHeader>
              <CardContent dir="rtl">
                <p className="font-hebrew text-sm text-gray-600 mb-4">
                  נתונים נטענים מ-/api/status-options ומוצגים לפי קטגוריה.
                </p>
                <StatusOptionsSection />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
