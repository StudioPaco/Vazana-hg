"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Download, Trash2 } from "lucide-react"
import type { Document } from "@/lib/document-service"

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<string>("all")

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
    const labels = {
      job: "עבודה",
      client: "לקוח",
      invoice: "חשבונית",
      general: "כללי",
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ניהול מסמכים</h1>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            העלאת מסמך חדש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="file">קובץ</Label>
                <Input id="file" name="file" type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" />
              </div>
              <div>
                <Label htmlFor="entityType">סוג ישות</Label>
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
                <Label htmlFor="entityId">מזהה ישות (אופציונלי)</Label>
                <Input id="entityId" name="entityId" placeholder="מזהה הישות הקשורה" />
              </div>
            </div>
            <Button type="submit" disabled={uploading}>
              {uploading ? "מעלה..." : "העלה מסמך"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-4 items-center">
        <Label>סינון לפי סוג:</Label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="job">עבודות</SelectItem>
            <SelectItem value="client">לקוחות</SelectItem>
            <SelectItem value="invoice">חשבוניות</SelectItem>
            <SelectItem value="general">כללי</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">טוען מסמכים...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">לא נמצאו מסמכים</div>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-medium">{doc.filename}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getEntityTypeLabel(doc.entity_type)} • {formatFileSize(doc.file_size)} •
                      {new Date(doc.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/api/documents/${doc.id}/download`, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
