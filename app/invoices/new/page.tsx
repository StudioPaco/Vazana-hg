"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, FileText, Calendar, User } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  company_name: string
  contact_person: string
}

interface Job {
  id: string
  job_number: string
  client_name: string
  work_type: string
  date: string
  location: string
  price: number
}

interface InvoiceSummary {
  subtotal: number
  vat: number
  total: number
}

export default function NewInvoicePage() {
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [jobs, setJobs] = useState<Job[]>([])
  const [summary, setSummary] = useState<InvoiceSummary>({ subtotal: 0, vat: 0, total: 0 })
  const [loading, setLoading] = useState(false)

  const clients: Client[] = [
    { id: "1", company_name: "אדהם עבודות פיתוח", contact_person: "אדהם כהן" },
    { id: "2", company_name: "אלקים סימון בבשים", contact_person: "משה לוי" },
    { id: "3", company_name: "דברים זוהרים", contact_person: "שרה כהן" },
  ]

  const months = [
    { value: "2025-01", label: "ינואר 2025" },
    { value: "2025-02", label: "פברואר 2025" },
    { value: "2025-03", label: "מרץ 2025" },
    { value: "2025-04", label: "אפריל 2025" },
    { value: "2025-05", label: "מאי 2025" },
    { value: "2025-06", label: "יוני 2025" },
    { value: "2025-07", label: "יולי 2025" },
    { value: "2025-08", label: "אוגוסט 2025" },
    { value: "2025-09", label: "ספטמבר 2025" },
    { value: "2025-10", label: "אוקטובר 2025" },
    { value: "2025-11", label: "נובמבר 2025" },
    { value: "2025-12", label: "דצמבר 2025" },
  ]

  const fetchJobs = async () => {
    if (!selectedClient || !selectedMonth) return

    setLoading(true)
    try {
      // Sample jobs data - in real app, fetch from database
      const sampleJobs: Job[] = [
        {
          id: "1",
          job_number: "0001",
          client_name: clients.find((c) => c.id === selectedClient)?.company_name || "",
          work_type: "אבטחה",
          date: "2025-10-15",
          location: "תל אביב",
          price: 900,
        },
        {
          id: "2",
          job_number: "0002",
          client_name: clients.find((c) => c.id === selectedClient)?.company_name || "",
          work_type: "התקנה",
          date: "2025-10-20",
          location: "חיפה",
          price: 1200,
        },
      ]

      setJobs(sampleJobs)

      // Calculate summary
      const subtotal = sampleJobs.reduce((sum, job) => sum + job.price, 0)
      const vat = subtotal * 0.18
      const total = subtotal + vat

      setSummary({ subtotal, vat, total })
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header with title in top-right corner */}
      <div className="relative">
        <div className="absolute top-0 right-0">
          <h1 className="text-2xl font-bold text-gray-900">הפקת חשבונית</h1>
          <p className="text-sm text-gray-600">צור חשבונית חדשה עבור לקוח ותקופת חיוב</p>
        </div>
        <div className="absolute top-0 left-0">
          <FileText className="h-6 w-6 text-gray-400" />
        </div>
      </div>

      <div className="pt-16 space-y-6">
        {/* Back button */}
        <div className="flex justify-start">
          <Button variant="outline" asChild>
            <Link href="/invoices">
              <ArrowRight className="ml-2 h-4 w-4" />
              חזור לחשבוניות
            </Link>
          </Button>
        </div>

        {/* Client and Period Selection */}
        <Card>
          <CardContent className="p-6">
            <div className="relative mb-4">
              <div className="absolute top-0 right-0">
                <h2 className="text-lg font-semibold">בחר לקוח</h2>
              </div>
              <div className="absolute top-0 left-0">
                <User className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Button
                onClick={fetchJobs}
                disabled={!selectedClient || !selectedMonth || loading}
                className="bg-vazana-teal hover:bg-vazana-teal/90 text-white"
              >
                {loading ? "טוען..." : "הביא עבודות"}
              </Button>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="תקופת חיוב (חודש)" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר חברה..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Lines */}
        <Card>
          <CardContent className="p-6">
            <div className="relative mb-4">
              <div className="absolute top-0 right-0">
                <h2 className="text-lg font-semibold">שורות חשבונית</h2>
              </div>
              <div className="absolute top-0 left-0">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="pt-8">
              {jobs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>לא נמצאו פריטים לחשבונית. בחר לקוח ותקופה להביא עבודות או להוסיף פריט ידני.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
                    <div className="text-right">סכום (₪)</div>
                    <div className="text-right">אתר</div>
                    <div className="text-right">סוג עבודה (פריט ידני)</div>
                    <div className="text-right">תאריך / תקופת</div>
                    <div className="text-right">תיאור פריט</div>
                  </div>
                  {jobs.map((job) => (
                    <div key={job.id} className="grid grid-cols-5 gap-4 text-sm py-2 border-b">
                      <div className="text-right font-medium">₪{job.price}</div>
                      <div className="text-right">{job.location}</div>
                      <div className="text-right">{job.work_type}</div>
                      <div className="text-right">{job.date}</div>
                      <div className="text-right">עבודה #{job.job_number}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="relative mb-4">
              <div className="absolute top-0 right-0">
                <h2 className="text-lg font-semibold">סיכום חשבונית</h2>
              </div>
            </div>

            <div className="pt-8 space-y-3">
              <div className="flex justify-between text-sm">
                <div>₪{summary.subtotal.toFixed(2)}</div>
                <div>סכום ביניים:</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>₪{summary.vat.toFixed(2)}</div>
                <div>מע"מ (18%):</div>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <div>₪{summary.total.toFixed(2)}</div>
                <div>סכום כולל:</div>
              </div>
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>הערות (אופציונלי)</p>
                <p>הוסף הערות לחשבונית...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
