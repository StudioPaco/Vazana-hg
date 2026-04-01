import * as XLSX from 'xlsx'

export interface ExportHeader {
  key: string
  label: string
}

/**
 * Export data to an XLSX file and trigger a browser download.
 */
export function exportToXLSX(
  data: Record<string, any>[],
  headers: ExportHeader[],
  filename: string
) {
  const rows = data.map((row) =>
    headers.reduce<Record<string, any>>((acc, h) => {
      acc[h.label] = row[h.key] ?? ''
      return acc
    }, {})
  )

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: headers.map((h) => h.label),
  })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  triggerDownload(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

/**
 * Export data to a CSV file with UTF-8 BOM (for Hebrew support in Excel)
 * and trigger a browser download.
 */
export function exportToCSV(
  data: Record<string, any>[],
  headers: ExportHeader[],
  filename: string
) {
  const headerLine = headers.map((h) => csvEscape(h.label)).join(',')

  const lines = data.map((row) =>
    headers.map((h) => csvEscape(String(row[h.key] ?? ''))).join(',')
  )

  // BOM prefix ensures Excel opens the file with UTF-8 encoding
  const csv = '\uFEFF' + [headerLine, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
