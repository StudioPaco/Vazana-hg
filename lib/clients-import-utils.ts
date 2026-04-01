import * as XLSX from 'xlsx'
import { ImportColumnDef } from '@/lib/jobs-import-utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClientParsedRow {
  rowIndex: number          // 1-based (Excel row)
  data: Record<string, any> // raw cell values keyed by dbField
  resolved: Record<string, any> | null // DB-ready object (null if invalid)
  errors: { field: string; message: string }[]
  warnings: { field: string; message: string }[]
  valid: boolean
}

export interface ClientParseResult {
  rows: ClientParsedRow[]
  validCount: number
  errorCount: number
}

export interface ExistingClient {
  id: string
  company_name: string
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const CLIENT_IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    dbField: 'company_name',
    headerHe: 'שם חברה',
    required: true,
  },
  {
    dbField: 'contact_person',
    headerHe: 'איש קשר',
    required: true,
  },
  {
    dbField: 'phone',
    headerHe: 'טלפון',
    required: true,
  },
  {
    dbField: 'email',
    headerHe: 'אימייל',
    required: false,
    validate: (v) => {
      if (v === undefined || v === null || String(v).trim() === '') return null
      if (!EMAIL_REGEX.test(String(v).trim())) return 'כתובת אימייל לא תקינה'
      return null
    },
  },
  {
    dbField: 'address',
    headerHe: 'כתובת',
    required: false,
  },
  {
    dbField: 'city',
    headerHe: 'עיר',
    required: false,
  },
  {
    dbField: 'security_rate',
    headerHe: 'תעריף אבטחה',
    required: false,
    validate: (v) => {
      if (v === undefined || v === null || v === '') return null
      if (isNaN(Number(v))) return 'חייב להיות מספר'
      return null
    },
  },
  {
    dbField: 'installation_rate',
    headerHe: 'תעריף התקנה',
    required: false,
    validate: (v) => {
      if (v === undefined || v === null || v === '') return null
      if (isNaN(Number(v))) return 'חייב להיות מספר'
      return null
    },
  },
  {
    dbField: 'payment_method',
    headerHe: 'אופן תשלום',
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

export function generateClientTemplate(): void {
  const wb = XLSX.utils.book_new()

  // Header row
  const headers = CLIENT_IMPORT_COLUMNS.map((c) =>
    c.required ? `${c.headerHe} *` : c.headerHe,
  )

  // Example / hint row
  const exampleRow = CLIENT_IMPORT_COLUMNS.map((c) => {
    switch (c.dbField) {
      case 'company_name': return 'חברת דוגמה בע"מ'
      case 'contact_person': return 'ישראל ישראלי'
      case 'phone': return '050-1234567'
      case 'email': return 'info@example.com'
      case 'security_rate': return '250'
      case 'installation_rate': return '300'
      default: return ''
    }
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])

  // Column widths
  ws['!cols'] = CLIENT_IMPORT_COLUMNS.map((c) => ({
    wch: Math.max(c.headerHe.length + 4, 16),
  }))

  // Style mandatory header cells (orange background)
  CLIENT_IMPORT_COLUMNS.forEach((col, idx) => {
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
  CLIENT_IMPORT_COLUMNS.forEach((_, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c: idx })
    if (!ws[cellRef]) return
    ws[cellRef].s = {
      font: { italic: true, color: { rgb: '999999' } },
      alignment: { horizontal: 'right' },
    }
  })

  // Set RTL sheet view
  ws['!views'] = [{ RTL: true }]

  XLSX.utils.book_append_sheet(wb, ws, 'לקוחות')

  // Trigger download
  XLSX.writeFile(wb, 'תבנית_ייבוא_לקוחות.xlsx', { bookType: 'xlsx' })
}

// ---------------------------------------------------------------------------
// Parse & validate uploaded file
// ---------------------------------------------------------------------------

export async function parseClientFile(
  file: File,
  columnMapping: Record<string, string>,
  existingClients: ExistingClient[] = [],
): Promise<ClientParseResult> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) {
    return { rows: [], validCount: 0, errorCount: 0 }
  }

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, {
    defval: '',
  })

  // Build fast lookup for existing clients (case-insensitive)
  const existingMap = new Map(
    existingClients.map((c) => [c.company_name.trim().toLowerCase(), c]),
  )

  // Build header→dbField mapping from column mapping parameter
  // columnMapping: { fileHeader: dbField }
  // Also support template headers (with and without *)
  const headerToDb = new Map<string, string>()
  for (const [fileHeader, dbField] of Object.entries(columnMapping)) {
    headerToDb.set(fileHeader.trim(), dbField)
  }
  // Also register template headers for convenience
  CLIENT_IMPORT_COLUMNS.forEach((col) => {
    headerToDb.set(col.headerHe, col.dbField)
    headerToDb.set(`${col.headerHe} *`, col.dbField)
  })

  // Track company names within the file for intra-file duplicate detection
  const fileCompanyNames = new Map<string, number>() // name → first rowIndex

  const rows: ClientParsedRow[] = rawRows.map((raw, idx) => {
    // Skip example/hint rows from template
    const firstVal = String(Object.values(raw)[0] || '')
    if (idx === 0 && firstVal.includes('דוגמה')) {
      return {
        rowIndex: idx + 2,
        data: {},
        resolved: null,
        errors: [{ field: '_row', message: 'שורת דוגמה — נדלגה' }],
        warnings: [],
        valid: false,
      }
    }

    // Map raw keys → dbField keys
    const data: Record<string, any> = {}
    for (const [rawKey, value] of Object.entries(raw)) {
      const dbField = headerToDb.get(rawKey.trim())
      if (dbField) {
        data[dbField] = value
      }
    }

    const errors: { field: string; message: string }[] = []
    const warnings: { field: string; message: string }[] = []

    // Validate each column
    for (const col of CLIENT_IMPORT_COLUMNS) {
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

    // Duplicate detection — check against existing clients in DB
    const companyName = data.company_name ? String(data.company_name).trim() : ''
    const companyKey = companyName.toLowerCase()

    if (companyKey && existingMap.has(companyKey)) {
      errors.push({
        field: '_duplicate',
        message: `כפילות — לקוח "${companyName}" כבר קיים במערכת`,
      })
    }

    // Intra-file duplicate detection
    if (companyKey && errors.length === 0) {
      const prevRow = fileCompanyNames.get(companyKey)
      if (prevRow !== undefined) {
        errors.push({
          field: '_duplicate',
          message: `כפילות בקובץ — "${companyName}" מופיע גם בשורה ${prevRow}`,
        })
      } else {
        fileCompanyNames.set(companyKey, idx + 2)
      }
    }

    // Build resolved DB-ready object
    let resolved: Record<string, any> | null = null

    if (errors.length === 0) {
      resolved = {
        company_name: companyName,
        contact_person: data.contact_person ? String(data.contact_person).trim() : '',
        phone: data.phone ? String(data.phone).trim() : '',
        email: data.email ? String(data.email).trim() : null,
        address: data.address ? String(data.address).trim() : null,
        city: data.city ? String(data.city).trim() : null,
        security_rate: data.security_rate ? Number(data.security_rate) : null,
        installation_rate: data.installation_rate ? Number(data.installation_rate) : null,
        payment_method: data.payment_method ? String(data.payment_method).trim() : null,
        notes: data.notes ? String(data.notes).trim() : null,
        is_sample: false,
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

  return {
    rows,
    validCount: dataRows.filter((r) => r.valid).length,
    errorCount: dataRows.filter((r) => !r.valid).length,
  }
}
