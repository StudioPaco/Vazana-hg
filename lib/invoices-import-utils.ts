import * as XLSX from 'xlsx'
import { ImportColumnDef } from '@/lib/jobs-import-utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvoiceParsedRow {
  rowIndex: number          // 1-based (Excel row)
  data: Record<string, any> // raw cell values keyed by dbField
  resolved: Record<string, any> | null // DB-ready object (null if invalid)
  errors: { field: string; message: string }[]
  warnings: { field: string; message: string }[]
  valid: boolean
}

export interface InvoiceParseResult {
  rows: InvoiceParsedRow[]
  validCount: number
  errorCount: number
}

export interface ExistingInvoice {
  id: string
  invoice_number: string
}

export interface ExistingClient {
  id: string
  company_name: string
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

export const INVOICE_IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    dbField: 'invoice_number',
    headerHe: 'מספר חשבונית',
    required: true,
  },
  {
    dbField: 'client_name',
    headerHe: 'שם לקוח',
    required: true,
  },
  {
    dbField: 'invoice_date',
    headerHe: 'תאריך הנפקה',
    required: true,
    validate: (v) => {
      if (v === undefined || v === null || String(v).trim() === '') return null
      const d = parseDate(v)
      if (!d) return 'תאריך לא תקין (פורמט: YYYY-MM-DD או DD/MM/YYYY)'
      return null
    },
  },
  {
    dbField: 'due_date',
    headerHe: 'תאריך פירעון',
    required: false,
    validate: (v) => {
      if (v === undefined || v === null || String(v).trim() === '') return null
      const d = parseDate(v)
      if (!d) return 'תאריך לא תקין (פורמט: YYYY-MM-DD או DD/MM/YYYY)'
      return null
    },
  },
  {
    dbField: 'total_amount',
    headerHe: 'סכום',
    required: true,
    validate: (v) => {
      if (v === undefined || v === null || v === '') return null
      if (isNaN(Number(v))) return 'חייב להיות מספר'
      if (Number(v) < 0) return 'סכום חייב להיות חיובי'
      return null
    },
  },
  {
    dbField: 'status',
    headerHe: 'סטטוס',
    required: false,
    validate: (v) => {
      if (v === undefined || v === null || String(v).trim() === '') return null
      const valid = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
      if (!valid.includes(String(v).trim().toLowerCase())) {
        return `סטטוס לא תקין. ערכים אפשריים: ${valid.join(', ')}`
      }
      return null
    },
  },
  {
    dbField: 'notes',
    headerHe: 'הערות',
    required: false,
  },
]

// ---------------------------------------------------------------------------
// Date parsing helper
// ---------------------------------------------------------------------------

function parseDate(value: any): string | null {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }

  // Handle Excel serial date numbers
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(excelEpoch.getTime() + value * 86400000)
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
    return null
  }

  const str = String(value).trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const d = new Date(str)
    if (!isNaN(d.getTime())) return str
  }

  // DD/MM/YYYY or DD.MM.YYYY
  const match = str.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
    if (!isNaN(d.getTime())) return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return null
}

// ---------------------------------------------------------------------------
// Template generation
// ---------------------------------------------------------------------------

export function generateInvoiceTemplate(): void {
  const wb = XLSX.utils.book_new()

  // Header row
  const headers = INVOICE_IMPORT_COLUMNS.map((c) =>
    c.required ? `${c.headerHe} *` : c.headerHe,
  )

  // Example / hint row
  const exampleRow = INVOICE_IMPORT_COLUMNS.map((c) => {
    switch (c.dbField) {
      case 'invoice_number': return '1001'
      case 'client_name': return 'חברת דוגמה בע"מ'
      case 'invoice_date': return '2026-01-15'
      case 'due_date': return '2026-02-15'
      case 'total_amount': return '5000'
      case 'status': return 'draft'
      case 'notes': return ''
      default: return ''
    }
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])

  // Column widths
  ws['!cols'] = INVOICE_IMPORT_COLUMNS.map((c) => ({
    wch: Math.max(c.headerHe.length + 4, 16),
  }))

  // Style mandatory header cells (orange background)
  INVOICE_IMPORT_COLUMNS.forEach((col, idx) => {
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
  INVOICE_IMPORT_COLUMNS.forEach((_, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c: idx })
    if (!ws[cellRef]) return
    ws[cellRef].s = {
      font: { italic: true, color: { rgb: '999999' } },
      alignment: { horizontal: 'right' },
    }
  })

  // Set RTL sheet view
  ws['!views'] = [{ RTL: true }]

  XLSX.utils.book_append_sheet(wb, ws, 'חשבוניות')

  // Trigger download
  XLSX.writeFile(wb, 'תבנית_ייבוא_חשבוניות.xlsx', { bookType: 'xlsx' })
}

// ---------------------------------------------------------------------------
// Parse & validate uploaded file
// ---------------------------------------------------------------------------

export async function parseInvoiceFile(
  file: File,
  columnMapping: Record<string, string>,
  existingInvoices: ExistingInvoice[] = [],
  existingClients: ExistingClient[] = [],
): Promise<InvoiceParseResult> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) {
    return { rows: [], validCount: 0, errorCount: 0 }
  }

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, {
    defval: '',
  })

  // Build fast lookup for existing invoices (by invoice_number)
  const existingInvoiceMap = new Map(
    existingInvoices.map((inv) => [String(inv.invoice_number).trim().toLowerCase(), inv]),
  )

  // Build fast lookup for existing clients (case-insensitive)
  const existingClientMap = new Map(
    existingClients.map((c) => [c.company_name.trim().toLowerCase(), c]),
  )

  // Build header→dbField mapping from column mapping parameter
  const headerToDb = new Map<string, string>()
  for (const [fileHeader, dbField] of Object.entries(columnMapping)) {
    headerToDb.set(fileHeader.trim(), dbField)
  }
  // Also register template headers for convenience
  INVOICE_IMPORT_COLUMNS.forEach((col) => {
    headerToDb.set(col.headerHe, col.dbField)
    headerToDb.set(`${col.headerHe} *`, col.dbField)
  })

  // Track invoice numbers within the file for intra-file duplicate detection
  const fileInvoiceNumbers = new Map<string, number>() // number → first rowIndex

  const rows: InvoiceParsedRow[] = rawRows.map((raw, idx) => {
    // Skip example/hint rows from template
    const firstVal = String(Object.values(raw)[0] || '')
    if (idx === 0 && (firstVal.includes('דוגמה') || firstVal === '1001')) {
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
    for (const col of INVOICE_IMPORT_COLUMNS) {
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

    // Duplicate detection — check against existing invoices in DB
    const invoiceNumber = data.invoice_number ? String(data.invoice_number).trim() : ''
    const invoiceKey = invoiceNumber.toLowerCase()

    if (invoiceKey && existingInvoiceMap.has(invoiceKey)) {
      errors.push({
        field: '_duplicate',
        message: `כפילות — חשבונית "${invoiceNumber}" כבר קיימת במערכת`,
      })
    }

    // Intra-file duplicate detection
    if (invoiceKey && errors.length === 0) {
      const prevRow = fileInvoiceNumbers.get(invoiceKey)
      if (prevRow !== undefined) {
        errors.push({
          field: '_duplicate',
          message: `כפילות בקובץ — חשבונית "${invoiceNumber}" מופיעה גם בשורה ${prevRow}`,
        })
      } else {
        fileInvoiceNumbers.set(invoiceKey, idx + 2)
      }
    }

    // Client matching
    const clientName = data.client_name ? String(data.client_name).trim() : ''
    const clientKey = clientName.toLowerCase()
    const matchedClient = clientKey ? existingClientMap.get(clientKey) : undefined

    if (clientName && !matchedClient) {
      warnings.push({
        field: 'client_name',
        message: `לקוח "${clientName}" לא נמצא במערכת — החשבונית תיווצר ללא שיוך ללקוח`,
      })
    }

    // Build resolved DB-ready object
    let resolved: Record<string, any> | null = null

    if (errors.length === 0) {
      const invoiceDateStr = parseDate(data.invoice_date) || new Date().toISOString().split('T')[0]
      const dueDateStr = data.due_date ? parseDate(data.due_date) : null
      const statusVal = data.status ? String(data.status).trim().toLowerCase() : 'draft'

      resolved = {
        invoice_number: invoiceNumber,
        client_id: matchedClient?.id || null,
        invoice_date: invoiceDateStr,
        due_date: dueDateStr || new Date(new Date(invoiceDateStr).getTime() + 30 * 86400000).toISOString().split('T')[0],
        total_amount: Number(data.total_amount),
        status: statusVal,
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
