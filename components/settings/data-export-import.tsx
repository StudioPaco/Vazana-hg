"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { 
  Download, 
  Upload, 
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  CheckCircle,
  X
} from "lucide-react"
import { getModalClasses } from "@/lib/modal-utils"

interface DataExportImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ExportOptions {
  format: 'excel' | 'csv'
  dateRange: 'all' | 'custom'
  startMonth: string
  endMonth: string
  includeJobs: boolean
  includeClients: boolean
  includeInvoices: boolean
  includeWorkers: boolean
  includeVehicles: boolean
}

interface ImportResult {
  total: number
  success: number
  duplicates: DuplicateItem[]
  errors: string[]
}

interface DuplicateItem {
  id: string
  type: 'job' | 'client' | 'invoice'
  existing: any
  new: any
}

export default function DataExportImport({ open, onOpenChange }: DataExportImportProps) {
  const [activeTab, setActiveTab] = useState("export")
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showDuplicates, setShowDuplicates] = useState(false)

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    dateRange: 'all',
    startMonth: new Date().toISOString().slice(0, 7),
    endMonth: new Date().toISOString().slice(0, 7),
    includeJobs: true,
    includeClients: true,
    includeInvoices: true,
    includeWorkers: true,
    includeVehicles: true,
  })

  const getCurrentMonth = () => new Date().toISOString().slice(0, 7)
  const getLastYear = () => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 1)
    return date.toISOString().slice(0, 7)
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportOptions),
      })

      clearInterval(progressInterval)
      setExportProgress(100)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const filename = `vazana-export-${new Date().toISOString().slice(0, 10)}.${exportOptions.format === 'excel' ? 'xlsx' : 'csv'}`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export error:', error)
      alert('שגיאה בייצוא הנתונים')
    }

    setIsExporting(false)
    setExportProgress(0)
  }

  const handleImport = async () => {
    if (!importFile) {
      alert('אנא בחר קובץ לייבוא')
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 300)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setImportProgress(100)

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result: ImportResult = await response.json()
      setImportResult(result)

      if (result.duplicates.length > 0) {
        setShowDuplicates(true)
      }

    } catch (error) {
      console.error('Import error:', error)
      alert('שגיאה בייבוא הנתונים')
    }

    setIsImporting(false)
    setImportProgress(0)
  }

  const handleDuplicateAction = async (action: 'reject' | 'merge' | 'create', duplicateId?: string) => {
    try {
      await fetch('/api/import/duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          duplicateId,
          all: !duplicateId
        }),
      })

      if (!duplicateId) {
        // Applied to all
        setShowDuplicates(false)
        setImportResult(null)
      } else {
        // Applied to single item, remove from list
        setImportResult(prev => prev ? {
          ...prev,
          duplicates: prev.duplicates.filter(d => d.id !== duplicateId)
        } : null)
      }
    } catch (error) {
      console.error('Error handling duplicate:', error)
      alert('שגיאה בטיפול ברשומות כפולות')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getModalClasses('lg', true)}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between font-hebrew">
            <FileSpreadsheet className="w-6 h-6 text-vazana-teal" />
            <span>ייצוא וייבוא נתונים</span>
          </DialogTitle>
        </DialogHeader>

        <div className="scroll-content p-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="export" className="font-hebrew">ייצוא נתונים</TabsTrigger>
            <TabsTrigger value="import" className="font-hebrew">ייבוא נתונים</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between font-hebrew">
                  <Download className="w-5 h-5 text-vazana-teal" />
                  <span>ייצוא נתונים</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-right block font-hebrew">פורמט קובץ</Label>
                    <Select value={exportOptions.format} onValueChange={(value: 'excel' | 'csv') => setExportOptions({...exportOptions, format: value})}>
                      <SelectTrigger className="text-right font-hebrew" dir="rtl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-right block font-hebrew">טווח תאריכים</Label>
                    <Select value={exportOptions.dateRange} onValueChange={(value: 'all' | 'custom') => setExportOptions({...exportOptions, dateRange: value})}>
                      <SelectTrigger className="text-right font-hebrew" dir="rtl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל הנתונים</SelectItem>
                        <SelectItem value="custom">טווח מותאם</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {exportOptions.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-right block font-hebrew">מחודש</Label>
                      <Input
                        type="month"
                        value={exportOptions.startMonth}
                        onChange={(e) => setExportOptions({...exportOptions, startMonth: e.target.value})}
                        className="text-right font-hebrew"
                        style={{ textAlign: 'right' }}
                      />
                    </div>
                    <div>
                      <Label className="text-right block font-hebrew">עד חודש</Label>
                      <Input
                        type="month"
                        value={exportOptions.endMonth}
                        onChange={(e) => setExportOptions({...exportOptions, endMonth: e.target.value})}
                        className="text-right font-hebrew"
                        style={{ textAlign: 'right' }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-right block font-hebrew mb-4">סוגי נתונים לייצוא</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'includeJobs', label: 'עבודות' },
                      { key: 'includeClients', label: 'לקוחות' },
                      { key: 'includeInvoices', label: 'חשבוניות' },
                      { key: 'includeWorkers', label: 'עובדים' },
                      { key: 'includeVehicles', label: 'כלי רכב' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          checked={exportOptions[key as keyof ExportOptions] as boolean}
                          onCheckedChange={(checked) => setExportOptions({...exportOptions, [key]: !!checked})}
                        />
                        <Label className="font-hebrew">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {isExporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-hebrew">
                      <span>מייצא נתונים...</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="w-full" />
                  </div>
                )}

                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
                >
                  <Download className="w-4 h-4 ml-2" />
                  {isExporting ? 'מייצא...' : 'ייצא נתונים'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between font-hebrew">
                  <Upload className="w-5 h-5 text-vazana-teal" />
                  <span>ייבוא נתונים</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="mb-4"
                  />
                  <p className="text-sm text-gray-600 font-hebrew">
                    בחר קובץ Excel או CSV לייבוא
                  </p>
                  {importFile && (
                    <p className="text-sm font-medium font-hebrew mt-2">
                      קובץ נבחר: {importFile.name}
                    </p>
                  )}
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-hebrew">
                      <span>מייבא נתונים...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="w-full" />
                  </div>
                )}

                {importResult && !showDuplicates && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-800 font-hebrew">ייבוא הושלם בהצלחה</h3>
                    </div>
                    <div className="text-sm text-green-700 font-hebrew space-y-1">
                      <p>סה"כ רשומות: {importResult.total}</p>
                      <p>יובאו בהצלחה: {importResult.success}</p>
                      {importResult.duplicates.length > 0 && (
                        <p>רשומות כפולות: {importResult.duplicates.length}</p>
                      )}
                      {importResult.errors.length > 0 && (
                        <p>שגיאות: {importResult.errors.length}</p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  className="w-full bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
                >
                  <Upload className="w-4 h-4 ml-2" />
                  {isImporting ? 'מייבא...' : 'ייבא נתונים'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>

        {/* Duplicates Dialog */}
        {showDuplicates && importResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-4xl max-h-[80vh] overflow-y-auto m-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between font-hebrew">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <span>נמצאו רשומות כפולות</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 font-hebrew">
                  נמצאו {importResult.duplicates.length} רשומות כפולות. אנא בחר פעולה:
                </p>

                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={() => handleDuplicateAction('reject')}
                    variant="outline"
                    className="font-hebrew"
                  >
                    דחה הכל
                  </Button>
                  <Button
                    onClick={() => handleDuplicateAction('merge')}
                    variant="outline"
                    className="font-hebrew"
                  >
                    מזג הכל
                  </Button>
                  <Button
                    onClick={() => handleDuplicateAction('create')}
                    variant="outline"
                    className="font-hebrew"
                  >
                    צור חדש הכל
                  </Button>
                  <Button
                    onClick={() => setShowDuplicates(false)}
                    variant="ghost"
                    className="font-hebrew"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {importResult.duplicates.slice(0, 10).map((duplicate) => (
                    <div key={duplicate.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-hebrew">
                          <p><strong>קיים:</strong> {JSON.stringify(duplicate.existing).slice(0, 100)}...</p>
                          <p><strong>חדש:</strong> {JSON.stringify(duplicate.new).slice(0, 100)}...</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleDuplicateAction('reject', duplicate.id)}>
                            דחה
                          </Button>
                          <Button size="sm" onClick={() => handleDuplicateAction('merge', duplicate.id)}>
                            מזג
                          </Button>
                          <Button size="sm" onClick={() => handleDuplicateAction('create', duplicate.id)}>
                            צור חדש
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}