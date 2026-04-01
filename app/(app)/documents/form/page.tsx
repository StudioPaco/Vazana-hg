"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, ArrowRight, Save, FileText } from "lucide-react"
import Link from "next/link"
import PageLayout from "@/components/layout/page-layout"
import { toast } from "@/hooks/use-toast"

interface Job {
  id: string
  job_number: string
  client_name: string
  job_date: string
  site: string
  city: string
  work_type: string
  shift_type: string
  worker_name: string
  vehicle_name: string
}

const defaultRows = [
  ["מס׳ עבודה", "", "לקוח", "", "תאריך", "", "סוג עבודה", "", "משמרת", ""],
  ["אתר", "", "עיר", "", "עובד", "", "רכב", "", "", ""],
  ["שעת התחלה", "", "שעת סיום", "", "סה״כ שעות", "", "שעות נוספות", "", "סה״כ", ""],
  ["תיאור עבודה", "", "", "", "", "", "", "", "", ""],
  ["ציוד שהובא", "", "", "", "", "", "", "", "", ""],
  ["ציוד שנשאר", "", "", "", "", "", "", "", "", ""],
  ["חומרים", "", "", "", "", "", "", "", "", ""],
  ["הערות לקוח", "", "", "", "", "", "", "", "", ""],
  ["הערות פנימיות", "", "", "", "", "", "", "", "", ""],
  ["חתימת עובד", "", "", "חתימת לקוח", "", "", "תאריך", "", "", ""],
]

export default function JobFormPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [tableData, setTableData] = useState<string[][]>(defaultRows.map(r => [...r]))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formNumber, setFormNumber] = useState("")
  const [savedForms, setSavedForms] = useState<{ id: string; form_number: string; job_id: string; job_number: string }[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/jobs").then(r => r.json()),
      fetch("/api/documents?entityType=job").then(r => r.json()),
    ]).then(([jobsRes, docsRes]) => {
      const data = (jobsRes.data || []).sort((a: Job, b: Job) => Number(b.job_number) - Number(a.job_number))
      setJobs(data)
      // Find existing form documents
      const forms = (Array.isArray(docsRes) ? docsRes : []).filter((d: any) => d.filename?.startsWith('טופס-'))
      setSavedForms(forms.map((d: any) => ({
        id: d.id,
        form_number: d.filename?.replace('טופס-', '').replace('.json', '') || '',
        job_id: d.entity_id || '',
        job_number: '',
      })))
      if (data.length > 0) {
        setSelectedJobId(data[0].id)
        fillFromJob(data[0])
        // Generate next form number
        const maxForm = forms.reduce((max: number, d: any) => {
          const num = parseInt(d.filename?.replace('טופס-', '').replace('.json', '') || '0')
          return num > max ? num : max
        }, 0)
        setFormNumber(String(maxForm + 1).padStart(4, '0'))
      } else {
        setFormNumber('0001')
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const fillFromJob = (job: Job) => {
    const newData = defaultRows.map(r => [...r])
    newData[0][1] = job.job_number || ""
    newData[0][3] = job.client_name || ""
    newData[0][5] = job.job_date ? new Date(job.job_date).toLocaleDateString("he-IL") : ""
    newData[0][7] = job.work_type || ""
    newData[0][9] = job.shift_type || ""
    newData[1][1] = job.site || ""
    newData[1][3] = job.city || ""
    newData[1][5] = job.worker_name || ""
    newData[1][7] = job.vehicle_name || ""
    setTableData(newData)
  }

  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId)
    const job = jobs.find(j => j.id === jobId)
    if (job) fillFromJob(job)
  }

  const handleCellChange = (row: number, col: number, value: string) => {
    setTableData(prev => {
      const next = prev.map(r => [...r])
      next[row][col] = value
      return next
    })
  }

  const handleSaveToJob = async () => {
    if (!selectedJobId) {
      toast({ title: "יש לבחור עבודה", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      // Save form data as a JSON document attached to the job
      const formBlob = new Blob([JSON.stringify({
        form_number: formNumber,
        job_id: selectedJobId,
        table_data: tableData,
        created_at: new Date().toISOString(),
      })], { type: 'application/json' })

      const file = new File([formBlob], `form-${formNumber}.json`, { type: 'application/json' })
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'job')
      formData.append('entityId', selectedJobId)

      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')

      toast({ title: `טופס #FRM-${formNumber} נשמר ושויך לעבודה` })
      // Increment form number
      setFormNumber(String(parseInt(formNumber) + 1).padStart(4, '0'))
    } catch (error) {
      console.error('Save form error:', error)
      toast({ title: "שגיאה בשמירת הטופס", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const rows = tableData.map((row, ri) =>
      `<tr>${row.map((cell, ci) => {
        const isHeader = ci % 2 === 0 && defaultRows[ri]?.[ci] !== ""
        return isHeader
          ? `<td style="background:#f0f0f0;font-weight:bold;padding:6px 10px;border:1px solid #333;font-size:12px;">${cell}</td>`
          : `<td style="padding:6px 10px;border:1px solid #333;font-size:12px;min-width:80px;">${cell}</td>`
      }).join('')}</tr>`
    ).join('\n')

    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8">
      <title>טופס עבודה #${formNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        h2 { text-align: center; margin-bottom: 4px; }
        .form-num { text-align: center; font-size: 14px; color: #666; margin-bottom: 12px; }
        @media print { body { padding: 10px; } }
      </style>
    </head><body>
      <h2>וזאנה אבטחת כבישים — טופס עבודה</h2>
      <div class="form-num">טופס מס׳ ${formNumber}</div>
      <table>${rows}</table>
    </body></html>`)
    w.document.close()
    w.print()
  }

  if (loading) {
    return (
      <PageLayout title="טופס עבודה" subtitle="מילוי והדפסת טופס עבודה" titleIcon={FileText} variant="form" maxWidth="7xl">
        <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />
      </PageLayout>
    )
  }

  return (
    <PageLayout title="טופס עבודה" subtitle="מילוי והדפסת טופס עבודה" titleIcon={FileText} variant="form" maxWidth="7xl">
      {/* Form Number — top right like job/invoice */}
      <div className="flex justify-end mb-2">
        <div className="text-sm text-gray-500 font-hebrew">
          <span>מספר טופס: </span><span className="text-teal-600 font-semibold">FRM-{formNumber}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4" dir="rtl">
        <Link href="/documents">
          <Button variant="outline" size="sm" className="font-hebrew h-9">
            <ArrowRight className="w-4 h-4 ml-1" />
            חזרה
          </Button>
        </Link>
        <Select value={selectedJobId} onValueChange={handleJobChange} dir="rtl">
          <SelectTrigger className="w-[260px] font-hebrew text-right h-9 text-sm">
            <SelectValue placeholder="בחר עבודה" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {jobs.map(j => (
              <SelectItem key={j.id} value={j.id}>
                #{j.job_number} — {j.client_name} ({new Date(j.job_date).toLocaleDateString('he-IL')})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 mr-auto">
          <Button onClick={handleSaveToJob} disabled={saving || !selectedJobId} className="bg-teal-600 hover:bg-teal-700 text-white font-hebrew h-9 text-sm">
            <Save className="w-4 h-4 ml-1" />
            {saving ? "שומר..." : "שמור ושייך לעבודה"}
          </Button>
          <Button onClick={handlePrint} variant="outline" className="font-hebrew h-9 text-sm">
            <Printer className="w-4 h-4 ml-1" />
            הדפס
          </Button>
        </div>
      </div>

      {/* Editable Table */}
      <div className="border rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-sm" dir="rtl">
          <tbody>
            {tableData.map((row, ri) => (
              <tr key={ri} className={ri === 0 ? "bg-gray-50" : ""}>
                {row.map((cell, ci) => {
                  const isLabel = ci % 2 === 0 && defaultRows[ri]?.[ci] !== ""
                  return (
                    <td key={ci} className={`border border-gray-300 ${isLabel ? "bg-gray-100 font-medium font-hebrew text-xs px-2 py-1.5 w-[80px]" : "p-0"}`}>
                      {isLabel ? (
                        <span className="text-gray-700">{cell}</span>
                      ) : (
                        <Input
                          value={cell}
                          onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                          className="border-0 rounded-none h-8 text-sm font-hebrew text-right bg-transparent focus:bg-white focus:ring-1 focus:ring-teal-300"
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-gray-400 font-hebrew mt-2">
        ערוך את הטבלה. לחץ ״שמור ושייך לעבודה״ כדי לצרף לעבודה, או ״הדפס״ להדפסה.
      </p>
    </PageLayout>
  )
}
