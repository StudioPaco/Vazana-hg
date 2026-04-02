/**
 * Fetch configurable status options from the status_options DB table.
 * Caches per category after first fetch. Call clearStatusCache() after settings change.
 */

export interface StatusOption {
  value: string
  label_he: string
  label_en?: string
  color?: string
  is_default: boolean
}

const cache: Record<string, StatusOption[]> = {}

export async function getStatusOptions(category: string): Promise<StatusOption[]> {
  if (cache[category]) return cache[category]

  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase
      .from('status_options')
      .select('value, label_he, label_en, color, is_default')
      .eq('category', category)
      .eq('is_active', true)
      .order('sort_order')

    if (data && data.length > 0) {
      cache[category] = data
      return data
    }
  } catch {
    // Fall back to hardcoded defaults
  }

  return getDefaults(category)
}

export function clearStatusCache() {
  Object.keys(cache).forEach(k => delete cache[k])
}

/** Get the default value for a category */
export async function getDefaultStatus(category: string): Promise<string> {
  const options = await getStatusOptions(category)
  const def = options.find(o => o.is_default)
  return def?.value || options[0]?.value || ''
}

/** Get color for a status value */
export async function getStatusColor(category: string, value: string): Promise<string> {
  const options = await getStatusOptions(category)
  const opt = options.find(o => o.value === value)
  return opt?.color || 'gray'
}

// Hardcoded fallbacks if DB is unavailable
function getDefaults(category: string): StatusOption[] {
  switch (category) {
    case 'payment_status':
      return [
        { value: 'ממתין לתשלום', label_he: 'ממתין לתשלום', color: 'yellow', is_default: true },
        { value: 'שולם', label_he: 'שולם', color: 'green', is_default: false },
        { value: 'מאוחר', label_he: 'מאוחר', color: 'red', is_default: false },
        { value: 'לא רלוונטי', label_he: 'לא רלוונטי', color: 'gray', is_default: false },
      ]
    case 'invoice_status':
      return [
        { value: 'טיוטה', label_he: 'טיוטה', color: 'gray', is_default: true },
        { value: 'נשלח', label_he: 'נשלח', color: 'blue', is_default: false },
        { value: 'שולם', label_he: 'שולם', color: 'green', is_default: false },
        { value: 'בוטל', label_he: 'בוטל', color: 'red', is_default: false },
      ]
    case 'client_status':
      return [
        { value: 'active', label_he: 'פעיל', color: 'green', is_default: true },
        { value: 'inactive', label_he: 'לא פעיל', color: 'gray', is_default: false },
      ]
    default:
      return []
  }
}
