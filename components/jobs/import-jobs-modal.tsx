"use client"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  generateTemplate,
  parseAndValidateFile,
  type ParseResult,
  type ParsedRow,
  type LookupMaps,
  type ExistingJob,
} from "@/lib/jobs-import-utils"

// Same status logic as jobs-page.tsx
const calculateJobStatus = (jobDate: string): string => {
  const now = new Date()
  const date = new Date(jobDate)
  const diffHours = (date.getTime() - now.getTime()) / (1000 * 3600)
  if (diffHours < -24) return "הושלם"
  if (diffHours <= 24) return "בתהליך"
  return "ממתין"
}

const statusColors: Record<string, string> = {
  "הושלם": "bg-green-100 text-green-800",
  "בתהליך": "bg-yellow-100 text-yellow-800",
  "ממתין": "bg-blue-100 text-blue-800",
}

interface ImportJobsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

type Step = "upload" | "preview" | "result"

export default function ImportJobsModal({
  open,
  onOpenChange,
  onImportComplete,
}: ImportJobsModalProps) {
  const [step, setStep] = useState<Step>("upload")
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [lookups, setLookups] = useState<LookupMaps | null>(null)
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    total: number
    errors: { row: number; error: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch reference data for name→ID resolution + existing jobs for duplicate check
  const fetchLookups = useCallback(async (): Promise<{ maps: LookupMaps; existingJobs: ExistingJob[] } | null> => {
    setLookupsLoading(true)
    try {
      const [clientsRes, workersRes, vehiclesRes, cartsRes, workTypesRes, jobsRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/workers"),
        fetch("/api/vehicles"),
        fetch("/api/carts"),
        fetch("/api/work-types"),
        fetch("/api/jobs"),
      ])

      const [clientsData, workersData, vehiclesData, cartsData, workTypesData, jobsData] = await Promise.all([
        clientsRes.json(),
        workersRes.json(),
        vehiclesRes.json(),
        cartsRes.json(),
        workTypesRes.json(),
        jobsRes.json(),
      ])

      const maps: LookupMaps = {
        clients: clientsData.data || [],
        workers: workersData.data || [],
        vehicles: vehiclesData.data || [],
        carts: cartsData.data || [],
        workTypes: workTypesData.data || [],
      }

      const existingJobs: ExistingJob[] = (jobsData.data || [])
        .filter((j: any) => !j.is_deleted)
        .map((j: any) => ({
          job_date: j.job_date,
          client_id: j.client_id,
          worker_id: j.worker_id,
          shift_type: j.shift_type,
          site: j.site,
          client_name: j.client_name,
          worker_name: j.worker_name,
        }))

      setLookups(maps)
      return { maps, existingJobs }
    } catch (err) {
      console.error("Failed to fetch lookup data:", err)
      toast({ title: "שגיאה בטעינת נתוני מערכת", variant: "destructive" })
      return null
    } finally {
      setLookupsLoading(false)
    }
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast({ title: "יש להעלות קובץ Excel (.xlsx)", variant: "destructive" })
      return
    }

    const lookupsResult = await fetchLookups()
    if (!lookupsResult) return

    try {
      const buffer = await file.arrayBuffer()
      const result = parseAndValidateFile(buffer, lookupsResult.maps, lookupsResult.existingJobs)

      if (result.rows.length === 0) {
        toast({ title: "הקובץ ריק או לא מכיל שורות נתונים", variant: "destructive" })
        return
      }

      setParseResult(result)
      setStep("preview")
    } catch (err) {
      console.error("File parse error:", err)
      toast({ title: "שגיאה בקריאת הקובץ", variant: "destructive" })
    }

    // Reset input so the same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleImport = async () => {
    if (!parseResult) return

    const validJobs = parseResult.rows
      .filter((r) => r.valid && r.resolved)
      .map((r) => r.resolved)

    if (validJobs.length === 0) {
      toast({ title: "אין שורות תקינות לייבוא", variant: "destructive" })
      return
    }

    setImporting(true)
    try {
      const response = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: validJobs }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({ title: `שגיאת שרת: ${result.error || "שגיאה לא ידועה"}`, variant: "destructive" })
        return
      }

      setImportResult(result)
      setStep("result")

      if (result.imported > 0) {
        onImportComplete()
      }
    } catch (err) {
      console.error("Import error:", err)
      toast({ title: "שגיאה בייבוא העבודות", variant: "destructive" })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setStep("upload")
    setParseResult(null)
    setImportResult(null)
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
            ייבוא עבודות מקובץ
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload / Download */}
        {step === "upload" && (
          <div className="space-y-6 py-4">
            <p className="text-sm text-gray-600 font-hebrew text-right">
              ייבא עבודות מקובץ Excel. הורד את התבנית, מלא אותה ואז העלה את הקובץ.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Download template */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-vazana-teal"
                onClick={() => generateTemplate()}
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
                  {lookupsLoading ? (
                    <Loader2 className="h-10 w-10 text-vazana-teal animate-spin" />
                  ) : (
                    <Upload className="h-10 w-10 text-vazana-teal" />
                  )}
                  <span className="font-hebrew font-semibold text-vazana-dark">
                    {lookupsLoading ? "טוען נתונים..." : "העלה קובץ מלא"}
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

        {/* Step 2: Preview */}
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
                {parseResult.warningCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-hebrew font-semibold text-yellow-600">
                      {parseResult.warningCount} חשודות
                    </span>
                  </div>
                )}
                {parseResult.errorCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-hebrew font-semibold text-red-600">
                      {parseResult.errorCount} נחסמו
                      {parseResult.duplicateCount > 0 && ` (${parseResult.duplicateCount} כפילויות/סתירות)`}
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
                    <th className="px-3 py-2 text-right font-hebrew">סוג עבודה</th>
                    <th className="px-3 py-2 text-right font-hebrew">תאריך</th>
                    <th className="px-3 py-2 text-right font-hebrew">לקוח</th>
                    <th className="px-3 py-2 text-right font-hebrew">עובד</th>
                    <th className="px-3 py-2 text-right font-hebrew">מצב עבודה</th>
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
                      ייבא {parseResult.validCount} עבודות תקינות
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
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
                  ? `${importResult.imported} עבודות יובאו בהצלחה`
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

function PreviewRow({ row }: { row: ParsedRow }) {
  const [expanded, setExpanded] = useState(false)
  const hasWarnings = row.warnings && row.warnings.length > 0
  const hasDetails = !row.valid || hasWarnings

  // Calculate job status for valid rows
  const jobStatus = row.valid && row.resolved?.job_date
    ? calculateJobStatus(row.resolved.job_date)
    : null

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
        <td className="px-3 py-2 font-hebrew">{row.data.work_type || "—"}</td>
        <td className="px-3 py-2 font-hebrew">
          {row.data.job_date instanceof Date
            ? row.data.job_date.toISOString().split("T")[0]
            : row.data.job_date || "—"}
        </td>
        <td className="px-3 py-2 font-hebrew">{row.data.client_name || "—"}</td>
        <td className="px-3 py-2 font-hebrew">{row.data.worker_name || "—"}</td>
        <td className="px-3 py-2">
          {jobStatus ? (
            <Badge className={`text-xs font-hebrew ${statusColors[jobStatus] || "bg-gray-100"}`}>
              {jobStatus}
            </Badge>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
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
          <td colSpan={8} className="px-6 py-2">
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
