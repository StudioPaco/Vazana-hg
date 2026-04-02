"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { getModalClasses } from "@/lib/modal-utils"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  generateInvoiceTemplate,
  parseInvoiceFile,
  type InvoiceParseResult,
  type InvoiceParsedRow,
  type ExistingInvoice,
  type ExistingClient,
} from "@/lib/invoices-import-utils"

interface ImportInvoicesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

type Step = "upload" | "mapping" | "preview" | "result"

const systemFields = [
  { key: 'invoice_number', label: 'מספר חשבונית', required: true },
  { key: 'client_name', label: 'שם לקוח', required: true },
  { key: 'invoice_date', label: 'תאריך הנפקה', required: true },
  { key: 'due_date', label: 'תאריך פירעון', required: false },
  { key: 'total_amount', label: 'סכום', required: true },
  { key: 'status', label: 'סטטוס', required: false },
  { key: 'notes', label: 'הערות', required: false },
]

export default function ImportInvoicesModal({
  open,
  onOpenChange,
  onImportComplete,
}: ImportInvoicesModalProps) {
  const [step, setStep] = useState<Step>("upload")
  const [parseResult, setParseResult] = useState<InvoiceParseResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    total: number
    errors: { row: number; error: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast({ title: "יש להעלות קובץ Excel (.xlsx)", variant: "destructive" })
      return
    }

    try {
      const buffer = await file.arrayBuffer()

      // Read headers from Excel for column mapping
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 })
      const headers = (rows[0] as string[] || []).map(h => String(h || '').trim()).filter(Boolean)

      if (headers.length === 0) {
        toast({ title: "לא נמצאו כותרות בקובץ", variant: "destructive" })
        return
      }

      setExcelHeaders(headers)
      setSelectedFile(file)

      // Auto-map by matching Hebrew headers
      const autoMap: Record<string, string> = {}
      for (const field of systemFields) {
        const match = headers.find(h => h === field.label || h.includes(field.label) || h.includes(field.key))
        if (match) autoMap[field.key] = match
      }
      setColumnMapping(autoMap)
      setStep("mapping")
    } catch (err) {
      console.error("File parse error:", err)
      toast({ title: "שגיאה בקריאת הקובץ", variant: "destructive" })
    }

    // Reset input so the same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleProceedToPreview = async () => {
    // Check required mappings
    const missing = systemFields.filter(f => f.required && !columnMapping[f.key])
    if (missing.length > 0) {
      toast({ title: `חסרים שדות חובה: ${missing.map(f => f.label).join(', ')}`, variant: "destructive" })
      return
    }
    if (!selectedFile) return

    setParsing(true)
    try {
      // Fetch existing invoices for duplicate detection
      const invoicesRes = await fetch("/api/invoices")
      const invoicesData = await invoicesRes.json()
      const existingInvoices: ExistingInvoice[] = (invoicesData.data || [])
        .map((inv: any) => ({ id: inv.id, invoice_number: inv.invoice_number }))

      // Fetch existing clients for client matching
      const clientsRes = await fetch("/api/clients")
      const clientsData = await clientsRes.json()
      const existingClients: ExistingClient[] = (clientsData.data || [])
        .filter((c: any) => !c.is_deleted)
        .map((c: any) => ({ id: c.id, company_name: c.company_name }))

      // Invert mapping: UI stores { dbField: excelHeader }, parseInvoiceFile expects { fileHeader: dbField }
      const invertedMapping: Record<string, string> = {}
      for (const [dbField, excelHeader] of Object.entries(columnMapping)) {
        if (excelHeader) {
          invertedMapping[excelHeader] = dbField
        }
      }

      const result = await parseInvoiceFile(selectedFile, invertedMapping, existingInvoices, existingClients)
      if (result.rows.length === 0) {
        toast({ title: "הקובץ ריק", variant: "destructive" })
        return
      }
      setParseResult(result)
      setStep("preview")
    } catch (err) {
      console.error("Parse error:", err)
      toast({ title: "שגיאה בעיבוד הקובץ", variant: "destructive" })
    } finally {
      setParsing(false)
    }
  }

  const handleImport = async () => {
    if (!parseResult) return

    const validRows = parseResult.rows
      .filter((r) => r.valid && r.resolved)
      .map((r) => r.resolved!)

    if (validRows.length === 0) {
      toast({ title: "אין שורות תקינות לייבוא", variant: "destructive" })
      return
    }

    setImporting(true)
    const errors: { row: number; error: string }[] = []
    let imported = 0

    try {
      const supabase = createClient()

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i]
        try {
          const { error } = await (supabase.from('invoices') as any).insert([row])

          if (error) {
            errors.push({
              row: i + 1,
              error: error.message || "שגיאה לא ידועה",
            })
          } else {
            imported++
          }
        } catch (err) {
          errors.push({
            row: i + 1,
            error: "שגיאת רשת",
          })
        }
      }

      setImportResult({ imported, total: validRows.length, errors })
      setStep("result")

      if (imported > 0) {
        onImportComplete()
      }
    } catch (err) {
      console.error("Import error:", err)
      toast({ title: "שגיאה בייבוא החשבוניות", variant: "destructive" })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setStep("upload")
    setParseResult(null)
    setImportResult(null)
    setSelectedFile(null)
    setExcelHeaders([])
    setColumnMapping({})
    onOpenChange(false)
  }

  const handleBack = () => {
    setStep("upload")
    setParseResult(null)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={getModalClasses("xl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right font-hebrew">
            <FileSpreadsheet className="h-5 w-5 text-vazana-teal" />
            ייבוא חשבוניות מקובץ
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload / Download */}
        {step === "upload" && (
          <div className="space-y-6 py-4">
            <p className="text-sm text-gray-600 font-hebrew text-right">
              ייבא חשבוניות מקובץ Excel. הורד את התבנית, מלא אותה ואז העלה את הקובץ.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Download template */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-vazana-teal"
                onClick={() => generateInvoiceTemplate()}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 gap-3">
                  <Download className="h-10 w-10 text-vazana-teal" />
                  <span className="font-hebrew font-semibold text-vazana-dark">
                    הורד תבנית ריקה
                  </span>
                  <span className="text-xs text-gray-500 font-hebrew text-center">
                    קובץ Excel עם כותרות ודוגמה
                    <br />
                    שדות חובה מסומנים בכתום
                  </span>
                </CardContent>
              </Card>

              {/* Upload file */}
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-vazana-teal"
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 gap-3">
                  <Upload className="h-10 w-10 text-vazana-teal" />
                  <span className="font-hebrew font-semibold text-vazana-dark">
                    העלה קובץ מלא
                  </span>
                  <span className="text-xs text-gray-500 font-hebrew">
                    קובץ .xlsx בלבד
                  </span>
                </CardContent>
              </Card>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "mapping" && (
          <div className="space-y-4" dir="rtl">
            <p className="text-sm text-gray-600 font-hebrew text-right">התאם את העמודות בקובץ לשדות במערכת:</p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right font-hebrew font-medium">שדה במערכת</th>
                    <th className="px-3 py-2 text-right font-hebrew font-medium">עמודה בקובץ</th>
                    <th className="px-3 py-2 text-center font-hebrew font-medium w-16">חובה</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {systemFields.map(field => (
                    <tr key={field.key} className={!columnMapping[field.key] && field.required ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2 font-hebrew font-medium">{field.label}</td>
                      <td className="px-3 py-1">
                        <select
                          value={columnMapping[field.key] || ''}
                          onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full border rounded px-2 py-1 text-sm text-right font-hebrew"
                          dir="rtl"
                        >
                          <option value="">— בחר עמודה —</option>
                          {excelHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {field.required ? <span className="text-red-500 font-bold">*</span> : <span className="text-gray-300">--</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 justify-start">
              <Button
                onClick={handleProceedToPreview}
                disabled={parsing}
                className="bg-teal-600 hover:bg-teal-700 text-white font-hebrew"
              >
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    מעבד...
                  </>
                ) : (
                  "המשך לתצוגה מקדימה"
                )}
              </Button>
              <Button variant="outline" onClick={() => { setStep("upload"); setExcelHeaders([]); setColumnMapping({}); setSelectedFile(null) }} className="font-hebrew">
                חזור
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && parseResult && (
          <div className="space-y-4 py-2">
            {/* Summary bar */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-hebrew font-semibold text-green-700">
                    {parseResult.validCount} תקינות
                  </span>
                </div>
                {parseResult.errorCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-hebrew font-semibold text-red-600">
                      {parseResult.errorCount} נחסמו
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 font-hebrew">
                סה&quot;כ {parseResult.validCount + parseResult.errorCount} שורות
              </span>
            </div>

            {/* Rows table */}
            <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm" dir="rtl">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-right font-hebrew">שורה</th>
                    <th className="px-3 py-2 text-right font-hebrew">סטטוס</th>
                    <th className="px-3 py-2 text-right font-hebrew">מס׳ חשבונית</th>
                    <th className="px-3 py-2 text-right font-hebrew">לקוח</th>
                    <th className="px-3 py-2 text-right font-hebrew">תאריך</th>
                    <th className="px-3 py-2 text-right font-hebrew">סכום</th>
                    <th className="px-3 py-2 text-right font-hebrew">פרטים</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows
                    .filter((r) => !r.errors.some((e) => e.field === "_row"))
                    .map((row) => (
                      <PreviewRow key={row.rowIndex} row={row} />
                    ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={handleBack} className="font-hebrew">
                חזרה
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="font-hebrew">
                  ביטול
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={parseResult.validCount === 0 || importing}
                  className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      מייבא...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 ml-2" />
                      ייבא {parseResult.validCount} חשבוניות תקינות
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === "result" && importResult && (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-3">
              {importResult.imported > 0 ? (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              ) : (
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
              )}

              <h3 className="text-lg font-bold font-hebrew">
                {importResult.imported > 0
                  ? `${importResult.imported} חשבוניות יובאו בהצלחה`
                  : "הייבוא נכשל"}
              </h3>

              {importResult.errors.length > 0 && (
                <div className="text-right bg-red-50 rounded-lg p-4 mt-4">
                  <p className="text-sm font-hebrew font-semibold text-red-700 mb-2">
                    {importResult.errors.length} שגיאות בצד השרת:
                  </p>
                  <ul className="space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-xs text-red-600 font-hebrew">
                        שורה {err.row}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-2">
              <Button onClick={handleClose} className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew">
                סגור
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Preview row sub-component
// ---------------------------------------------------------------------------

function PreviewRow({ row }: { row: InvoiceParsedRow }) {
  const [expanded, setExpanded] = useState(false)
  const hasWarnings = row.warnings && row.warnings.length > 0
  const hasDetails = !row.valid || hasWarnings

  // Row background: red for errors, yellow tint for warnings, default for clean
  const rowBg = !row.valid
    ? "bg-red-50"
    : hasWarnings
    ? "bg-yellow-50"
    : ""

  return (
    <>
      <tr
        className={`border-b cursor-pointer hover:bg-gray-50 ${rowBg}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <td className="px-3 py-2 font-hebrew">{row.rowIndex}</td>
        <td className="px-3 py-2">
          {!row.valid ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : hasWarnings ? (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </td>
        <td className="px-3 py-2 font-hebrew">{row.data.invoice_number || "--"}</td>
        <td className="px-3 py-2 font-hebrew">{row.data.client_name || "--"}</td>
        <td className="px-3 py-2 font-hebrew">{row.data.invoice_date || "--"}</td>
        <td className="px-3 py-2 font-hebrew">{row.data.total_amount ? `${Number(row.data.total_amount).toLocaleString()}` : "--"}</td>
        <td className="px-3 py-2">
          {!row.valid ? (
            <span className="text-xs text-red-500 font-hebrew">
              {row.errors.length} שגיאות
            </span>
          ) : hasWarnings ? (
            <span className="text-xs text-yellow-600 font-hebrew">
              אזהרה
            </span>
          ) : null}
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr className={!row.valid ? "bg-red-50" : "bg-yellow-50"}>
          <td colSpan={7} className="px-6 py-2">
            <ul className="space-y-1">
              {row.errors.map((err, i) => (
                <li key={`e-${i}`} className="text-xs text-red-600 font-hebrew flex items-center gap-1">
                  <XCircle className="h-3 w-3 flex-shrink-0" />
                  {err.message}
                </li>
              ))}
              {(row.warnings || []).map((warn, i) => (
                <li key={`w-${i}`} className="text-xs text-yellow-700 font-hebrew flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  {warn.message}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}
