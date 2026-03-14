import * as XLSX from 'xlsx'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportColumnDef {
  dbField: string
  headerHe: string
  required: boolean
  validate?: (value: any) => string | null // returns error message or null
}

export interface ExistingJob {
  job_date: string
  client_id: string | null
  worker_id: string | null
  shift_type: string
  site: string
  client_name: string
  worker_name: string
}

export interface LookupMaps {
  clients: { id: string; company_name: string }[]
  workers: { id: string; name: string }[]
  vehicles: { id: string; name: string; license_plate: string }[]
  carts: { id: string; name: string }[]
  workTypes: { id: string; name_he: string }[]
}

export interface ParsedRow {
  rowIndex: number          // 1-based (Excel row)
  data: Record<string, any> // raw cell values keyed by dbField
  resolved: Record<string, any> | null // DB-ready object (null if invalid)
  errors: { field: string; message: string }[]
  warnings: { field: string; message: string }[]
  valid: boolean
}

export interface ParseResult {
  rows: ParsedRow[]
  validCount: number
  errorCount: number
  duplicateCount: number
  warningCount: number
}

// Shift type mapping: Hebrew → DB value
const SHIFT_MAP: Record<string, string> = {
  'יום': 'day',
  'לילה': 'night',
  'כפול': 'double',
  'day': 'day',
  'night': 'night',
  'double': 'double',
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

export const IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    dbField: 'work_type',
    headerHe: 'סוג עבודה',
    required: true,
  },
  {
    dbField: 'job_date',
    headerHe: 'תאריך',
    required: true,
    validate: (v) => {
      if (!v) return 'שדה חובה'
      // Accept Date objects from Excel or string dates
      if (v instanceof Date) return null
      const d = new Date(v)
      if (isNaN(d.getTime())) return 'פורמט תאריך לא תקין (YYYY-MM-DD)'
      return null
    },
  },
  {
    dbField: 'shift_type',
    headerHe: 'סוג משמרת',
    required: true,
    validate: (v) => {
      if (!v) return 'שדה חובה'
      if (!SHIFT_MAP[String(v).trim()]) return 'ערך לא תקין — יום / לילה / כפול'
      return null
    },
  },
  {
    dbField: 'site',
    headerHe: 'אתר',
    required: true,
  },
  {
    dbField: 'city',
    headerHe: 'עיר',
    required: true,
  },
  {
    dbField: 'client_name',
    headerHe: 'שם לקוח',
    required: true,
  },
  {
    dbField: 'worker_name',
    headerHe: 'שם עובד',
    required: true,
  },
  {
    dbField: 'vehicle_name',
    headerHe: 'רכב',
    required: true,
  },
  {
    dbField: 'cart_name',
    headerHe: 'עגלה',
    required: false,
  },
  {
    dbField: 'job_specific_shift_rate',
    headerHe: 'תעריף למשמרת',
    required: false,
    validate: (v) => {
      if (v === undefined || v === null || v === '') return null
      if (isNaN(Number(v))) return 'חייב להיות מספר'
      return null
    },
  },
  {
    dbField: 'total_amount',
    headerHe: 'סכום כולל',
    required: false,
    validate: (v) => {
      if (v === undefined || v === null || v === '') return null
      if (isNaN(Number(v))) return 'חייב להיות מספר'
      return null
    },
  },
  {
    dbField: 'service_description',
    headerHe: 'תיאור',
    required: false,
  },
  {
    dbField: 'notes',
    headerHe: 'הערות',
    required: false,
  },
]

// ---------------------------------------------------------------------------
// Template generation
// ---------------------------------------------------------------------------

export function generateTemplate(): void {
  const wb = XLSX.utils.book_new()

  // Header row
  const headers = IMPORT_COLUMNS.map((c) =>
    c.required ? `${c.headerHe} *` : c.headerHe,
  )

  // Example / hint row
  const exampleRow = IMPORT_COLUMNS.map((c) => {
    switch (c.dbField) {
      case 'job_date': return '2025-06-15'
      case 'shift_type': return 'יום / לילה / כפול'
      case 'job_specific_shift_rate': return '250'
      case 'total_amount': return '500'
      default: return ''
    }
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])

  // Column widths
  ws['!cols'] = IMPORT_COLUMNS.map((c) => ({
    wch: Math.max(c.headerHe.length + 4, 16),
  }))

  // Style mandatory header cells (orange background) — xlsx community edition
  // supports cell styles via the `s` property when using bookType xlsx
  IMPORT_COLUMNS.forEach((col, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx })
    if (!ws[cellRef]) return
    if (col.required) {
      ws[cellRef].s = {
        fill: { fgColor: { rgb: 'FF9800' } },
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'right' },
      }
    } else {
      ws[cellRef].s = {
        font: { bold: true },
        alignment: { horizontal: 'right' },
      }
    }
  })

  // Example row styling — light gray italic
  IMPORT_COLUMNS.forEach((_, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c: idx })
    if (!ws[cellRef]) return
    ws[cellRef].s = {
      font: { italic: true, color: { rgb: '999999' } },
      alignment: { horizontal: 'right' },
    }
  })

  // Set RTL sheet view
  ws['!views'] = [{ RTL: true }]

  XLSX.utils.book_append_sheet(wb, ws, 'עבודות')

  // Trigger download
  XLSX.writeFile(wb, 'תבנית_ייבוא_עבודות.xlsx', { bookType: 'xlsx' })
}

// ---------------------------------------------------------------------------
// Duplicate detection fingerprints (3 tiers)
// ---------------------------------------------------------------------------

// Tier 1 — Exact duplicate: same date + client + worker + shift + site
function fpExact(date: string, clientId: string, workerId: string, shiftType: string, site: string): string {
  return `exact|${date}|${clientId}|${workerId}|${shiftType}|${site.trim().toLowerCase()}`
}

// Tier 2 — Worker scheduling conflict: same date + worker + shift (can't be in two places)
function fpWorkerShift(date: string, workerId: string, shiftType: string): string {
  return `ws|${date}|${workerId}|${shiftType}`
}

// Tier 3 — Suspicious: same date + client + site (might be same job with different details)
function fpClientSite(date: string, clientId: string, site: string): string {
  return `cs|${date}|${clientId}|${site.trim().toLowerCase()}`
}

// ---------------------------------------------------------------------------
// Parse & validate uploaded file
// ---------------------------------------------------------------------------

export function parseAndValidateFile(
  data: ArrayBuffer,
  lookups: LookupMaps,
  existingJobs: ExistingJob[] = [],
): ParseResult {
  const wb = XLSX.read(data, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) {
    return { rows: [], validCount: 0, errorCount: 0, duplicateCount: 0, warningCount: 0 }
  }

  // Read all rows as array of objects keyed by header
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, {
    defval: '',
  })

  // Build header→dbField mapping (handle both "סוג עבודה *" and "סוג עבודה")
  const headerMap = new Map<string, string>()
  IMPORT_COLUMNS.forEach((col) => {
    headerMap.set(col.headerHe, col.dbField)
    headerMap.set(`${col.headerHe} *`, col.dbField)
  })

  // Build fast lookup maps (case-insensitive / trimmed)
  const clientMap = new Map(lookups.clients.map((c) => [c.company_name.trim().toLowerCase(), c]))
  const workerMap = new Map(lookups.workers.map((w) => [w.name.trim().toLowerCase(), w]))
  const vehicleByName = new Map(lookups.vehicles.map((v) => [v.name.trim().toLowerCase(), v]))
  const vehicleByPlate = new Map(lookups.vehicles.map((v) => [v.license_plate.trim().toLowerCase(), v]))
  const cartMap = new Map(lookups.carts.map((c) => [c.name.trim().toLowerCase(), c]))

  // Build existing-jobs fingerprint sets (3 tiers) for duplicate detection
  const dbExact = new Set<string>()
  const dbWorkerShift = new Map<string, ExistingJob>()  // fp → job info for error messages
  const dbClientSite = new Map<string, ExistingJob>()
  for (const ej of existingJobs) {
    const date = ej.job_date ? ej.job_date.split('T')[0] : ''
    if (!date) continue
    if (ej.client_id && ej.worker_id) {
      dbExact.add(fpExact(date, ej.client_id, ej.worker_id, ej.shift_type || '', ej.site || ''))
    }
    if (ej.worker_id) {
      dbWorkerShift.set(fpWorkerShift(date, ej.worker_id, ej.shift_type || ''), ej)
    }
    if (ej.client_id) {
      dbClientSite.set(fpClientSite(date, ej.client_id, ej.site || ''), ej)
    }
  }

  // Track fingerprints within the file itself (intra-file duplicates) — 3 tiers
  const fileExact = new Set<string>()
  const fileWorkerShift = new Map<string, { rowIndex: number; workerName: string }>()
  const fileClientSite = new Map<string, { rowIndex: number; clientName: string; site: string }>()

  const rows: ParsedRow[] = rawRows.map((raw, idx) => {
    // Skip example/hint rows that contain slash hints
    const firstVal = String(Object.values(raw)[0] || '')
    if (idx === 0 && (firstVal.includes('/') || firstVal === '')) {
      // This might be the example row from the template — skip it
      // But only if it looks like a hint (contains slash patterns)
      const allVals = Object.values(raw).join(' ')
      if (allVals.includes('יום / לילה / כפול') || allVals.includes('YYYY-MM-DD')) {
        return {
          rowIndex: idx + 2, // +2 because row 1 is header
          data: {},
          resolved: null,
          errors: [{ field: '_row', message: 'שורת דוגמה — נדלגה' }],
          warnings: [],
          valid: false,
        }
      }
    }

    // Map raw keys → dbField keys
    const data: Record<string, any> = {}
    for (const [rawKey, value] of Object.entries(raw)) {
      const dbField = headerMap.get(rawKey.trim())
      if (dbField) {
        data[dbField] = value
      }
    }

    const errors: { field: string; message: string }[] = []

    // Validate each column
    for (const col of IMPORT_COLUMNS) {
      const val = data[col.dbField]

      // Required check
      if (col.required && (val === undefined || val === null || String(val).trim() === '')) {
        errors.push({ field: col.dbField, message: `${col.headerHe} — שדה חובה` })
        continue
      }

      // Custom validation
      if (col.validate && val !== undefined && val !== null && String(val).trim() !== '') {
        const err = col.validate(val)
        if (err) {
          errors.push({ field: col.dbField, message: `${col.headerHe} — ${err}` })
        }
      }
    }

    // Resolve names → IDs
    let resolvedClient: { id: string; company_name: string } | undefined
    let resolvedWorker: { id: string; name: string } | undefined
    let resolvedVehicle: { id: string; name: string; license_plate: string } | undefined
    let resolvedCart: { id: string; name: string } | undefined

    if (data.client_name) {
      const key = String(data.client_name).trim().toLowerCase()
      resolvedClient = clientMap.get(key)
      if (!resolvedClient) {
        errors.push({ field: 'client_name', message: `לקוח "${data.client_name}" לא נמצא במערכת` })
      }
    }

    if (data.worker_name) {
      const key = String(data.worker_name).trim().toLowerCase()
      resolvedWorker = workerMap.get(key)
      if (!resolvedWorker) {
        errors.push({ field: 'worker_name', message: `עובד "${data.worker_name}" לא נמצא במערכת` })
      }
    }

    if (data.vehicle_name) {
      const key = String(data.vehicle_name).trim().toLowerCase()
      resolvedVehicle = vehicleByName.get(key) || vehicleByPlate.get(key)
      if (!resolvedVehicle) {
        errors.push({ field: 'vehicle_name', message: `רכב "${data.vehicle_name}" לא נמצא במערכת` })
      }
    }

    if (data.cart_name && String(data.cart_name).trim()) {
      const key = String(data.cart_name).trim().toLowerCase()
      resolvedCart = cartMap.get(key)
      if (!resolvedCart) {
        errors.push({ field: 'cart_name', message: `עגלה "${data.cart_name}" לא נמצאה במערכת` })
      }
    }

    // Build resolved DB-ready object
    const warnings: { field: string; message: string }[] = []
    let resolved: Record<string, any> | null = null

    if (errors.length === 0) {
      // Normalize date
      let jobDate: string
      if (data.job_date instanceof Date) {
        jobDate = data.job_date.toISOString().split('T')[0]
      } else {
        jobDate = String(data.job_date).trim()
      }

      const shiftDb = SHIFT_MAP[String(data.shift_type).trim()] || 'day'
      const siteStr = String(data.site).trim()
      const clientId = resolvedClient!.id
      const workerId = resolvedWorker!.id
      const clientName = resolvedClient!.company_name
      const workerName = resolvedWorker!.name

      // ---- Tier 1: Exact duplicate (BLOCK) ----
      const fp1 = fpExact(jobDate, clientId, workerId, shiftDb, siteStr)
      if (dbExact.has(fp1)) {
        errors.push({
          field: '_duplicate',
          message: `כפילות מדויקת — עבודה זהה כבר קיימת במערכת (${jobDate}, ${clientName}, ${workerName}, ${siteStr})`,
        })
      } else if (fileExact.has(fp1)) {
        errors.push({
          field: '_duplicate',
          message: `כפילות בקובץ — שורה זהה מופיעה מוקדם יותר בקובץ (${jobDate}, ${clientName}, ${workerName})`,
        })
      }

      // ---- Tier 2: Worker scheduling conflict (BLOCK) ----
      if (errors.length === 0) {
        const fp2 = fpWorkerShift(jobDate, workerId, shiftDb)
        const dbConflict = dbWorkerShift.get(fp2)
        const fileConflict = fileWorkerShift.get(fp2)
        if (dbConflict) {
          errors.push({
            field: '_conflict',
            message: `סתירת תיאום — ${workerName} כבר משובץ לעבודה ב${jobDate} משמרת ${shiftDb === 'day' ? 'יום' : shiftDb === 'night' ? 'לילה' : 'כפול'} (אצל ${dbConflict.client_name}, ${dbConflict.site})`,
          })
        } else if (fileConflict) {
          errors.push({
            field: '_conflict',
            message: `סתירת תיאום בקובץ — ${workerName} כבר משובץ בשורה ${fileConflict.rowIndex} לאותו תאריך+משמרת`,
          })
        }
      }

      // ---- Tier 3: Suspicious match (WARNING — still importable) ----
      if (errors.length === 0) {
        const fp3 = fpClientSite(jobDate, clientId, siteStr)
        const dbSuspect = dbClientSite.get(fp3)
        const fileSuspect = fileClientSite.get(fp3)
        if (dbSuspect) {
          warnings.push({
            field: '_warning',
            message: `חשוד — כבר קיימת עבודה באותו תאריך+לקוח+אתר (${dbSuspect.worker_name})`,
          })
        } else if (fileSuspect) {
          warnings.push({
            field: '_warning',
            message: `חשוד — שורה ${fileSuspect.rowIndex} עם אותו תאריך+לקוח+אתר`,
          })
        }
      }

      // Register this row's fingerprints for intra-file checks
      fileExact.add(fp1)
      fileWorkerShift.set(fpWorkerShift(jobDate, workerId, shiftDb), { rowIndex: idx + 2, workerName })
      fileClientSite.set(fpClientSite(jobDate, clientId, siteStr), { rowIndex: idx + 2, clientName, site: siteStr })

      // Only build resolved if no blocking errors
      if (errors.length === 0) {
        resolved = {
          work_type: String(data.work_type).trim(),
          job_date: jobDate,
          shift_type: shiftDb,
          site: siteStr,
          city: String(data.city).trim(),
          client_name: clientName,
          client_id: clientId,
          worker_name: workerName,
          worker_id: workerId,
          vehicle_name: resolvedVehicle ? `${resolvedVehicle.license_plate} - ${resolvedVehicle.name}` : '',
          vehicle_id: resolvedVehicle!.id,
          cart_name: resolvedCart?.name || null,
          cart_id: resolvedCart?.id || null,
          job_specific_shift_rate: data.job_specific_shift_rate ? Number(data.job_specific_shift_rate) : null,
          total_amount: data.total_amount ? Number(data.total_amount) : null,
          service_description: data.service_description ? String(data.service_description).trim() : null,
          notes: data.notes ? String(data.notes).trim() : null,
          payment_status: 'לא רלוונטי',
          is_sample: false,
        }
      }
    }

    const valid = errors.length === 0

    return {
      rowIndex: idx + 2,
      data,
      resolved,
      errors,
      warnings,
      valid,
    }
  })

  // Filter out skipped example rows from counts
  const dataRows = rows.filter((r) => !r.errors.some((e) => e.field === '_row'))
  const duplicates = dataRows.filter((r) => r.errors.some((e) => e.field === '_duplicate' || e.field === '_conflict'))
  const warned = dataRows.filter((r) => r.valid && r.warnings.length > 0)

  return {
    rows,
    validCount: dataRows.filter((r) => r.valid).length,
    errorCount: dataRows.filter((r) => !r.valid).length,
    duplicateCount: duplicates.length,
    warningCount: warned.length,
  }
}
