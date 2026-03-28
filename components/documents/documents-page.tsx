"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Download, Trash2, Search, ArrowUpDown } from "lucide-react"
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
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date')

  useEffect(() => {
    fetchDocuments()
  }, [filter])

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

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        await fetchDocuments()
        ;(event.target as HTMLFormElement).reset()
      }
    } catch (error) {
      console.error("Upload failed:", error)
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

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      if (!searchTerm) return true
      return doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'name') return a.filename.localeCompare(b.filename, 'he')
      return (b.file_size || 0) - (a.file_size || 0)
    })

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-hebrew">
            <Upload className="h-5 w-5" />
            העלאת מסמך חדש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="file" className="font-hebrew">קובץ</Label>
                <Input id="file" name="file" type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" />
              </div>
              <div>
                <Label htmlFor="entityType" className="font-hebrew">סוג ישות</Label>
                <Select name="entityType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג ישות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job">עבודה</SelectItem>
                    <SelectItem value="client">לקוח</SelectItem>
                    <SelectItem value="invoice">חשבונית</SelectItem>
                    <SelectItem value="general">כללי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="entityId" className="font-hebrew">מזהה ישות (אופציונלי)</Label>
                <Input id="entityId" name="entityId" placeholder="מזהה הישות הקשורה" className="text-right" />
              </div>
            </div>
            <Button type="submit" disabled={uploading} className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
              {uploading ? "מעלה..." : "העלה מסמך"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-4 mb-6">
        {/* Sort Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortBy('date')}
            className={`font-hebrew text-xs px-3 py-1 transition-colors ${
              sortBy === 'date' ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            תאריך
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortBy('name')}
            className={`font-hebrew text-xs px-3 py-1 transition-colors ${
              sortBy === 'name' ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            שם קובץ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortBy('size')}
            className={`font-hebrew text-xs px-3 py-1 transition-colors ${
              sortBy === 'size' ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            גודל
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[160px] font-hebrew">
            <SelectValue placeholder="כל הסוגים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסוגים</SelectItem>
            <SelectItem value="job">עבודות</SelectItem>
            <SelectItem value="client">לקוחות</SelectItem>
            <SelectItem value="invoice">חשבוניות</SelectItem>
            <SelectItem value="general">כללי</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="חפש מסמכים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right font-hebrew w-full sm:w-[300px]"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="grid gap-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
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
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/api/documents/${doc.id}/download`, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="text-right flex-1 mx-4">
                  <h3 className="font-medium font-hebrew">{doc.filename}</h3>
                  <p className="text-sm text-gray-500 font-hebrew">
                    {getEntityTypeLabel(doc.entity_type)} · {formatFileSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString("he-IL")}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500 shrink-0" />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Document count */}
      {!loading && filteredDocuments.length > 0 && (
        <div className="text-center text-sm text-gray-400 font-hebrew">
          {filteredDocuments.length} מסמכים
        </div>
      )}
    </div>
  )
}
