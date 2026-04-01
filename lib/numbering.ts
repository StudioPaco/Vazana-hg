/**
 * Centralized numbering format utility.
 * Reads format settings from business_settings DB and generates
 * consistent numbers for jobs, invoices, forms, etc.
 */

export interface NumberingConfig {
  job_number_prefix: string
  job_number_digits: number
  invoice_number_prefix: string
  invoice_number_digits: number
  invoice_number_include_year: boolean
  form_number_prefix: string
  form_number_digits: number
}

const defaultConfig: NumberingConfig = {
  job_number_prefix: '',
  job_number_digits: 4,
  invoice_number_prefix: 'INV',
  invoice_number_digits: 4,
  invoice_number_include_year: true,
  form_number_prefix: 'FRM',
  form_number_digits: 4,
}

let cachedConfig: NumberingConfig | null = null

/**
 * Fetch numbering config from business_settings.
 * Caches after first call.
 */
export async function getNumberingConfig(): Promise<NumberingConfig> {
  if (cachedConfig) return cachedConfig

  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase
      .from('business_settings')
      .select('job_number_prefix, job_number_digits, invoice_number_prefix, invoice_number_digits, invoice_number_include_year, form_number_prefix, form_number_digits')
      .limit(1)
      .single()

    if (data) {
      cachedConfig = {
        job_number_prefix: data.job_number_prefix ?? defaultConfig.job_number_prefix,
        job_number_digits: data.job_number_digits ?? defaultConfig.job_number_digits,
        invoice_number_prefix: data.invoice_number_prefix ?? defaultConfig.invoice_number_prefix,
        invoice_number_digits: data.invoice_number_digits ?? defaultConfig.invoice_number_digits,
        invoice_number_include_year: data.invoice_number_include_year ?? defaultConfig.invoice_number_include_year,
        form_number_prefix: data.form_number_prefix ?? defaultConfig.form_number_prefix,
        form_number_digits: data.form_number_digits ?? defaultConfig.form_number_digits,
      }
      return cachedConfig
    }
  } catch {
    // Fall back to defaults
  }

  return defaultConfig
}

/** Clear cached config (call after settings are saved) */
export function clearNumberingCache() {
  cachedConfig = null
}

/** Format a job number: prefix + padded sequence */
export function formatJobNumber(seq: number, config: NumberingConfig): string {
  const num = String(seq).padStart(config.job_number_digits, '0')
  return config.job_number_prefix ? `${config.job_number_prefix}-${num}` : num
}

/** Format an invoice number: prefix + optional year + padded sequence */
export function formatInvoiceNumber(seq: number, config: NumberingConfig): string {
  const num = String(seq).padStart(config.invoice_number_digits, '0')
  const year = new Date().getFullYear()
  const parts = [config.invoice_number_prefix]
  if (config.invoice_number_include_year) parts.push(String(year))
  parts.push(num)
  return parts.filter(Boolean).join('-')
}

/** Format a form number: prefix + padded sequence */
export function formatFormNumber(seq: number, config: NumberingConfig): string {
  const num = String(seq).padStart(config.form_number_digits, '0')
  return config.form_number_prefix ? `${config.form_number_prefix}-${num}` : num
}
