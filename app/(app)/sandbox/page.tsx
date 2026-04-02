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
import { getModalClasses } from "@/lib/modal-utils"
import {
  Save,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  Filter,
  Pencil,
  Trash2,
  ShoppingCart,
  Truck,
  User,
  Building2,
  FlaskConical,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FieldDef {
  name: string
  label: string
  type: "text" | "number" | "tel" | "email" | "textarea"
  required?: boolean
  placeholder?: string
}

interface EditEntityModalProps {
  title: string
  fields: FieldDef[]
  data: Record<string, any>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Record<string, any>) => void
}

interface StatusOption {
  id: string
  category: string
  value: string
  color: string
  is_default: boolean
  sort_order: number
}

// ---------------------------------------------------------------------------
// Unified EditEntityModal (prototype — inline)
// ---------------------------------------------------------------------------

function EditEntityModal({ title, fields, data, open, onOpenChange, onSave }: EditEntityModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const initial: Record<string, any> = {}
      for (const field of fields) {
        initial[field.name] = data[field.name] ?? ""
      }
      setFormData(initial)
    }
  }, [open, data, fields])

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate save
    setTimeout(() => {
      onSave(formData)
      setIsSubmitting(false)
      onOpenChange(false)
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getModalClasses("md", true)} dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-hebrew" dir="rtl">
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label className="font-hebrew text-right block">
                {field.label}
                {field.required && " *"}
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

// ---------------------------------------------------------------------------
// Entity configurations for modals
// ---------------------------------------------------------------------------

const CART_FIELDS: FieldDef[] = [
  { name: "name", label: "שם העגלה", type: "text", required: true },
  { name: "license_plate", label: "מספר רישוי", type: "text", placeholder: "12-345-67" },
  { name: "capacity", label: "קיבולת", type: "text" },
]

const CART_DATA = { name: "עגלה לדוגמה", license_plate: "12-345-67", capacity: "500kg" }

const VEHICLE_FIELDS: FieldDef[] = [
  { name: "name", label: "שם הרכב", type: "text", required: true },
  { name: "license_plate", label: "מספר רכב", type: "text", required: true, placeholder: "12-345-678" },
  { name: "type", label: "סוג רכב", type: "text" },
]

const VEHICLE_DATA = { name: "רכב לדוגמה", license_plate: "12-345-678", type: "משאית" }

const WORKER_FIELDS: FieldDef[] = [
  { name: "name", label: "שם העובד", type: "text", required: true },
  { name: "phone_number", label: "מספר טלפון", type: "tel", required: true, placeholder: "050-1234567" },
  { name: "address", label: "כתובת", type: "text" },
  { name: "shift_rate", label: "תעריף משמרת (₪)", type: "number" },
  { name: "notes", label: "הערות", type: "textarea" },
]

const WORKER_DATA = { name: "עובד לדוגמה", phone_number: "050-1234567", address: "תל אביב", shift_rate: "350", notes: "עובד מנוסה" }

const CLIENT_FIELDS: FieldDef[] = [
  { name: "company_name", label: "שם החברה", type: "text", required: true },
  { name: "contact_person", label: "איש קשר", type: "text", required: true },
  { name: "phone", label: "טלפון", type: "tel", required: true, placeholder: "03-1234567" },
  { name: "email", label: "אימייל", type: "email", required: true },
  { name: "city", label: "עיר", type: "text" },
]

const CLIENT_DATA = { company_name: "חברה לדוגמה", contact_person: "ישראל ישראלי", phone: "03-1234567", email: "test@example.com", city: "תל אביב" }

// ---------------------------------------------------------------------------
// Mock list data
// ---------------------------------------------------------------------------

const MOCK_LIST_ITEMS = [
  { id: "1", name: "עגלה ראשית", detail: "12-345-67", status: "פעיל", date: "01/03/2026" },
  { id: "2", name: "עגלה משנית", detail: "98-765-43", status: "לא פעיל", date: "15/02/2026" },
  { id: "3", name: "עגלה שלישית", detail: "55-123-99", status: "פעיל", date: "20/01/2026" },
  { id: "4", name: "עגלה רביעית", detail: "77-888-00", status: "בתחזוקה", date: "05/03/2026" },
]

// ---------------------------------------------------------------------------
// Unified List Prototype (inline)
// ---------------------------------------------------------------------------

function MockEntityList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "date">("name")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filtered = MOCK_LIST_ITEMS.filter((item) => {
    const matchesSearch = item.name.includes(searchTerm) || item.detail.includes(searchTerm)
    const matchesFilter = filterStatus === "all" || item.status === filterStatus
    return matchesSearch && matchesFilter
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name, "he")
    return b.date.localeCompare(a.date)
  })

  const statuses = ["all", ...new Set(MOCK_LIST_ITEMS.map((i) => i.status))]

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3" dir="rtl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חיפוש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 text-right font-hebrew"
            dir="rtl"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortBy(sortBy === "name" ? "date" : "name")}
          className="font-hebrew gap-1"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortBy === "name" ? "שם" : "תאריך"}
        </Button>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm font-hebrew text-right"
          dir="rtl"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "כל הסטטוסים" : s}
            </option>
          ))}
        </select>
      </div>

      {/* Side by side: grid + list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grid view */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="w-4 h-4 text-vazana-teal" />
            <h4 className="font-hebrew font-semibold text-sm text-gray-700">תצוגת רשת</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-2" dir="rtl">
                  <div className="flex items-center justify-between">
                    <span className="font-hebrew font-semibold text-gray-900">{item.name}</span>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "פעיל"
                          ? "border-green-300 text-green-700 bg-green-50"
                          : item.status === "בתחזוקה"
                            ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                            : "border-gray-300 text-gray-600 bg-gray-50"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 font-hebrew">{item.detail}</p>
                  <p className="text-xs text-gray-400 font-hebrew">{item.date}</p>
                  <div className="flex gap-2 pt-1">
                    <Button variant="ghost" size="sm" className="text-vazana-teal hover:text-teal-700">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* List / Table view */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <List className="w-4 h-4 text-vazana-teal" />
            <h4 className="font-hebrew font-semibold text-sm text-gray-700">תצוגת רשימה</h4>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-right p-3 font-hebrew font-medium text-gray-600">שם</th>
                    <th className="text-right p-3 font-hebrew font-medium text-gray-600">פרט</th>
                    <th className="text-right p-3 font-hebrew font-medium text-gray-600">סטטוס</th>
                    <th className="text-right p-3 font-hebrew font-medium text-gray-600">תאריך</th>
                    <th className="text-center p-3 font-hebrew font-medium text-gray-600">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-hebrew font-medium text-gray-900">{item.name}</td>
                      <td className="p-3 font-hebrew text-gray-500">{item.detail}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            item.status === "פעיל"
                              ? "border-green-300 text-green-700 bg-green-50"
                              : item.status === "בתחזוקה"
                                ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                                : "border-gray-300 text-gray-600 bg-gray-50"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-3 font-hebrew text-gray-400 text-xs">{item.date}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="text-vazana-teal hover:text-teal-700">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status Options Section
// ---------------------------------------------------------------------------

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

  // Group by category
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

// ---------------------------------------------------------------------------
// Main Sandbox Page
// ---------------------------------------------------------------------------

export default function SandboxPage() {
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    title: string
    fields: FieldDef[]
    data: Record<string, any>
  }>({ title: "", fields: [], data: {} })

  const [lastSaved, setLastSaved] = useState<Record<string, any> | null>(null)

  const openModal = (title: string, fields: FieldDef[], data: Record<string, any>) => {
    setModalConfig({ title, fields, data })
    setModalOpen(true)
  }

  const handleSave = (data: Record<string, any>) => {
    setLastSaved(data)
  }

  return (
    <PageLayout title="ארגז חול" titleIcon={FlaskConical}>
      {/* Banner */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center" dir="rtl">
        <p className="font-hebrew text-amber-800 font-medium">
          דף בדיקות — שינויים כאן לא משפיעים על המערכת
        </p>
      </div>

      <Tabs defaultValue="modals" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="modals" className="font-hebrew">מודלים</TabsTrigger>
          <TabsTrigger value="lists" className="font-hebrew">רשימות</TabsTrigger>
          <TabsTrigger value="statuses" className="font-hebrew">סטטוסים</TabsTrigger>
        </TabsList>

        {/* ---- Tab 1: Modals ---- */}
        <TabsContent value="modals">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-hebrew text-lg">EditEntityModal — מודל עריכה אחיד</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4" dir="rtl">
                <p className="font-hebrew text-sm text-gray-600">
                  מודל אחד שמקבל הגדרת שדות ונתונים ומציג טופס עריכה. מחליף את כל המודלים הנפרדים לכל ישות.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => openModal("עריכת עגלה", CART_FIELDS, CART_DATA)}
                    variant="outline"
                    className="font-hebrew gap-2"
                  >
                    <ShoppingCart className="w-4 h-4 text-vazana-teal" />
                    עריכת עגלה
                  </Button>
                  <Button
                    onClick={() => openModal("עריכת רכב", VEHICLE_FIELDS, VEHICLE_DATA)}
                    variant="outline"
                    className="font-hebrew gap-2"
                  >
                    <Truck className="w-4 h-4 text-vazana-teal" />
                    עריכת רכב
                  </Button>
                  <Button
                    onClick={() => openModal("עריכת עובד", WORKER_FIELDS, WORKER_DATA)}
                    variant="outline"
                    className="font-hebrew gap-2"
                  >
                    <User className="w-4 h-4 text-vazana-teal" />
                    עריכת עובד
                  </Button>
                  <Button
                    onClick={() => openModal("עריכת לקוח", CLIENT_FIELDS, CLIENT_DATA)}
                    variant="outline"
                    className="font-hebrew gap-2"
                  >
                    <Building2 className="w-4 h-4 text-vazana-teal" />
                    עריכת לקוח
                  </Button>
                </div>

                {lastSaved && (
                  <div className="mt-4 p-3 rounded-md bg-gray-50 border" dir="rtl">
                    <p className="font-hebrew text-xs text-gray-500 mb-1">נתונים שנשמרו (לדוגמה בלבד):</p>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap" dir="ltr">
                      {JSON.stringify(lastSaved, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---- Tab 2: Lists ---- */}
        <TabsContent value="lists">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-hebrew text-lg">רשימת ישויות אחידה — אב-טיפוס</CardTitle>
              </CardHeader>
              <CardContent dir="rtl">
                <p className="font-hebrew text-sm text-gray-600 mb-4">
                  רשימה גנרית עם חיפוש, מיון, סינון ותצוגת רשת / טבלה זה לצד זה. נתונים קבועים לדוגמה.
                </p>
                <MockEntityList />
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

      {/* Unified modal instance */}
      <EditEntityModal
        title={modalConfig.title}
        fields={modalConfig.fields}
        data={modalConfig.data}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
      />
    </PageLayout>
  )
}
