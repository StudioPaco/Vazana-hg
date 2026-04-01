"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Download, Trash2, Search, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import type { Document } from "@/lib/document-service"

interface DocumentsPageProps {
  showHeader?: boolean
}

export function DocumentsPage({ showHeader = true }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('vazana-docs-sortBy') as any) || 'date'
    return 'date'
  })
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('vazana-docs-sortDir') as any) || 'desc'
    return 'desc'
  })

  // Upload form state
  const [entityType, setEntityType] = useState<string>("general")
  const [entityId, setEntityId] = useState<string>("")
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([])
  const [jobs, setJobs] = useState<{ id: string; job_number: string; client_name: string; job_date: string; site: string; city: string; work_type: string; shift_type: string; worker_name: string; vehicle_name: string }[]>([])

  useEffect(() => {
    fetchDocuments()
  }, [filter])

  // Persist sort preferences
  useEffect(() => {
    localStorage.setItem('vazana-docs-sortBy', sortBy)
    localStorage.setItem('vazana-docs-sortDir', sortDir)
  }, [sortBy, sortDir])

  // Fetch clients and jobs for association dropdowns
  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(result => {
      setClients((result.data || []).sort((a: any, b: any) => a.company_name.localeCompare(b.company_name, 'he')))
    }).catch(() => {})
    fetch("/api/jobs").then(r => r.json()).then(result => {
      setJobs((result.data || []).sort((a: any, b: any) => Number(b.job_number) - Number(a.job_number)))
    }).catch(() => {})
  }, [])

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.append("entityType", filter)
      }

      const response = await fetch(`/api/documents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setUploading(true)

    const formData = new FormData(event.currentTarget)
    // Override entityType and entityId from state
    formData.set("entityType", entityType)
    formData.set("entityId", entityId)

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        await fetchDocuments()
        ;(event.target as HTMLFormElement).reset()
        setEntityType("general")
        setEntityId("")
      } else {
        const err = await response.json().catch(() => ({ error: "שגיאה לא ידועה" }))
        console.error("Upload failed:", err)
        alert(`שגיאה בהעלאה: ${err.error || response.statusText}`)
      }
    } catch (error) {
      console.error("Upload failed:", error)
      alert("שגיאה בהעלאה: " + (error instanceof Error ? error.message : "שגיאה לא ידועה"))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק מסמך זה?")) return

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchDocuments()
      }
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      job: "עבודה",
      client: "לקוח",
      invoice: "חשבונית",
      general: "כללי",
    }
    return labels[type] || type
  }

  // Get display name for associated entity
  const getEntityName = (doc: Document) => {
    if (doc.entity_type === "client" && doc.entity_id) {
      const client = clients.find(c => c.id === doc.entity_id)
      return client ? client.company_name : doc.entity_id
    }
    if (doc.entity_type === "job" && doc.entity_id) {
      const job = jobs.find(j => j.id === doc.entity_id)
      return job ? `#${job.job_number} ${job.client_name}` : doc.entity_id
    }
    return null
  }

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      if (!searchTerm) return true
      return doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1
      if (sortBy === 'date') return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
      if (sortBy === 'name') return a.filename.localeCompare(b.filename, 'he') * dir
      return ((a.file_size || 0) - (b.file_size || 0)) * dir
    })

  return (
    <div className="space-y-4">
      {/* Action Row */}
      <div className="flex items-center gap-3" dir="rtl">
        <Link href="/documents/form">
          <Button className="h-9 bg-amber-500 hover:bg-amber-600 text-white font-hebrew text-sm">
            <FileSpreadsheet className="w-4 h-4 ml-1" />
            טופס עבודה
          </Button>
        </Link>
      </div>

      {/* Compact Upload Bar */}
      <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-3" dir="rtl">
        <div className="shrink-0">
          <Label htmlFor="file" className="font-hebrew text-xs text-gray-500">קובץ</Label>
          <label htmlFor="file" className="flex items-center gap-2 h-9 px-3 border border-dashed border-gray-400 rounded-md cursor-pointer hover:border-teal-500 hover:bg-teal-50/30 transition-colors text-sm font-hebrew text-gray-600">
            <Upload className="w-4 h-4 text-gray-400" />
            <span id="file-label">בחר קובץ</span>
          </label>
          <input id="file" name="file" type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" className="sr-only" onChange={(e) => {
            const label = document.getElementById('file-label')
            if (label && e.target.files?.[0]) {
              label.textContent = e.target.files[0].name
            }
          }} />
        </div>
        <div className="w-32">
          <Label className="font-hebrew text-xs text-gray-500">שייך ל</Label>
          <Select value={entityType} onValueChange={(v) => { setEntityType(v); setEntityId("") }} dir="rtl">
            <SelectTrigger className="h-9 font-hebrew text-sm text-right">
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="general">כללי</SelectItem>
              <SelectItem value="client">לקוח</SelectItem>
              <SelectItem value="job">עבודה</SelectItem>
              <SelectItem value="invoice">חשבונית</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {entityType === "client" && (
          <div className="w-48">
            <Label className="font-hebrew text-xs text-gray-500">לקוח</Label>
            <Select value={entityId} onValueChange={setEntityId} dir="rtl">
              <SelectTrigger className="h-9 font-hebrew text-sm text-right">
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {entityType === "job" && (
          <div className="w-56">
            <Label className="font-hebrew text-xs text-gray-500">עבודה</Label>
            <Select value={entityId} onValueChange={setEntityId} dir="rtl">
              <SelectTrigger className="h-9 font-hebrew text-sm text-right">
                <SelectValue placeholder="בחר עבודה" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {jobs.map(j => (
                  <SelectItem key={j.id} value={j.id}>#{j.job_number} — {j.client_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {entityType === "invoice" && (
          <div className="w-48">
            <Label className="font-hebrew text-xs text-gray-500">מזהה חשבונית</Label>
            <Input name="entityId" value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="מזהה" className="h-9 text-sm text-right" />
          </div>
        )}
        <Button type="submit" disabled={uploading} className="h-9 bg-teal-600 hover:bg-teal-700 text-white font-hebrew text-sm">
          <Upload className="w-4 h-4 ml-1" />
          {uploading ? "מעלה..." : "העלה"}
        </Button>
      </form>

      {/* Filters + Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between" dir="rtl">
        <div className="flex gap-2 items-center">
          <Select value={filter} onValueChange={setFilter} dir="rtl">
            <SelectTrigger className="w-[140px] h-9 font-hebrew text-sm text-right">
              <SelectValue placeholder="כל הסוגים" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">כל הסוגים</SelectItem>
              <SelectItem value="job">עבודות</SelectItem>
              <SelectItem value="client">לקוחות</SelectItem>
              <SelectItem value="invoice">חשבוניות</SelectItem>
              <SelectItem value="general">כללי</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { if (sortBy === 'date') setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy('date'); setSortDir('desc') } }}
              className={`font-hebrew text-xs px-2 py-1 h-7 ${
                sortBy === 'date' ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              תאריך {sortBy === 'date' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { if (sortBy === 'name') setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy('name'); setSortDir('desc') } }}
              className={`font-hebrew text-xs px-2 py-1 h-7 ${
                sortBy === 'name' ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              שם {sortBy === 'name' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { if (sortBy === 'size') setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy('size'); setSortDir('desc') } }}
              className={`font-hebrew text-xs px-2 py-1 h-7 ${
                sortBy === 'size' ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              גודל {sortBy === 'size' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </Button>
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="חפש מסמכים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right font-hebrew w-full sm:w-[250px] h-9 text-sm"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="grid gap-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium mb-2 font-hebrew">לא נמצאו מסמכים</p>
            <p className="text-sm font-hebrew">
              {searchTerm || filter !== "all" ? "נסה לשנות את החיפוש או המסננים" : "העלה את המסמך הראשון שלך"}
            </p>
          </div>
        ) : (
          filteredDocuments.map((doc) => {
            const entityName = getEntityName(doc)
            return (
              <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center justify-between p-3" dir="rtl">
                  <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                  <div className="text-right flex-1 mx-3">
                    <h3 className="font-medium font-hebrew text-sm">{doc.filename}</h3>
                    <p className="text-xs text-gray-500 font-hebrew">
                      {getEntityTypeLabel(doc.entity_type)}
                      {entityName && <span className="text-gray-700"> — {entityName}</span>}
                      {' · '}{formatFileSize(doc.file_size)}
                      {' · '}{new Date(doc.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(`/api/documents/${doc.id}/download`, "_blank")}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {!loading && filteredDocuments.length > 0 && (
        <div className="text-center text-xs text-gray-400 font-hebrew">
          {filteredDocuments.length} מסמכים
        </div>
      )}
    </div>
  )
}
