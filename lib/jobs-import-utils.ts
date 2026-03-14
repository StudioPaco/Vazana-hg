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
  valid: boolean
}

export interface ParseResult {
  rows: ParsedRow[]
  validCount: number
  errorCount: number
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
// Parse & validate uploaded file
// ---------------------------------------------------------------------------

export function parseAndValidateFile(
  data: ArrayBuffer,
  lookups: LookupMaps,
): ParseResult {
  const wb = XLSX.read(data, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) {
    return { rows: [], validCount: 0, errorCount: 0 }
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
    const valid = errors.length === 0
    let resolved: Record<string, any> | null = null

    if (valid) {
      // Normalize date
      let jobDate: string
      if (data.job_date instanceof Date) {
        jobDate = data.job_date.toISOString().split('T')[0]
      } else {
        jobDate = String(data.job_date).trim()
      }

      resolved = {
        work_type: String(data.work_type).trim(),
        job_date: jobDate,
        shift_type: SHIFT_MAP[String(data.shift_type).trim()] || 'day',
        site: String(data.site).trim(),
        city: String(data.city).trim(),
        client_name: resolvedClient!.company_name,
        client_id: resolvedClient!.id,
        worker_name: resolvedWorker!.name,
        worker_id: resolvedWorker!.id,
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

    return {
      rowIndex: idx + 2,
      data,
      resolved,
      errors,
      valid,
    }
  })

  // Filter out skipped example rows from counts
  const dataRows = rows.filter((r) => !r.errors.some((e) => e.field === '_row'))

  return {
    rows,
    validCount: dataRows.filter((r) => r.valid).length,
    errorCount: dataRows.filter((r) => !r.valid).length,
  }
}
