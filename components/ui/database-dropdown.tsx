"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataItem {
  id: string
  name?: string
  name_he?: string
  name_en?: string
  company_name?: string // for clients
  [key: string]: any
}

interface DatabaseDropdownProps {
  // Legacy props for backward compatibility
  table?: string
  labelField?: string // The field to show in the dropdown (e.g., 'name_he', 'company_name')
  onChange?: (value: string) => void
  
  // New props-based API
  data?: DataItem[]
  displayField?: string | ((item: DataItem) => string)
  valueField?: string
  onValueChange?: (value: string) => void
  loading?: boolean
  allowEmpty?: boolean
  
  // Common props
  value?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  
  // Legacy props
  filter?: {
    field: string
    value: any
  }
  orderBy?: {
    field: string
    ascending?: boolean
  }
  customDisplayFormat?: (item: DataItem) => string // Custom formatting function
}

export default function DatabaseDropdown({
  // Legacy props
  table,
  labelField,
  onChange,
  customDisplayFormat,
  filter,
  orderBy = { field: "created_date", ascending: false },
  
  // New props
  data,
  displayField,
  valueField = "id",
  onValueChange,
  loading: propLoading = false,
  allowEmpty = false,
  
  // Common props
  value,
  placeholder = "בחר...",
  className = "",
  disabled = false,
  required = false
}: DatabaseDropdownProps) {
  const [items, setItems] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(!data) // Don't load if data is provided
  const [error, setError] = useState<string | null>(null)
  
  // Determine if we should use legacy or new API
  const isLegacyMode = Boolean(table && !data)
  const effectiveOnChange = onValueChange || onChange || (() => {})
  const effectiveLoading = isLegacyMode ? loading : (propLoading || false)

  useEffect(() => {
    if (data) {
      // Use provided data
      setItems(data)
      setLoading(false)
      return
    }
    
    if (!isLegacyMode) {
      return
    }
    
    const fetchItems = async () => {
      try {
        // Use API endpoints instead of direct Supabase queries
        const apiTable = table === 'work_types' ? 'work-types' : table
        const response = await fetch(`/api/${apiTable}`)
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        
        const result = await response.json()
        let data = result.data || []
        
        // Apply client-side filter if provided
        if (filter) {
          data = data.filter((item: DataItem) => item[filter.field] === filter.value)
        }
        
        // Apply client-side ordering
        data.sort((a: DataItem, b: DataItem) => {
          const aValue = a[orderBy.field] || ''
          const bValue = b[orderBy.field] || ''
          
          if (orderBy.ascending) {
            return aValue.localeCompare(bValue)
          } else {
            return bValue.localeCompare(aValue)
          }
        })
        
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading items")
        console.error(`Error fetching items from ${table}:`, err)
      } finally {
        setLoading(false)
      }
    }

    if (isLegacyMode) {
      fetchItems()
    }
  }, [table, filter, orderBy.field, orderBy.ascending, data, isLegacyMode])

  // Determine which field to use for the label
  const getItemLabel = (item: DataItem) => {
    // New API: displayField can be a function or string
    if (displayField) {
      if (typeof displayField === 'function') {
        return displayField(item)
      }
      return item[displayField]
    }
    
    // Legacy API
    if (customDisplayFormat) return customDisplayFormat(item)
    if (labelField) return item[labelField]
    if (item.name_he) return item.name_he
    if (item.name) return item.name
    if (item.company_name) return item.company_name
    return item.id
  }
  
  const getItemValue = (item: DataItem) => {
    return item[valueField] || item.id
  }

  if (effectiveLoading) {
    return (
      <Select disabled value="_loading">
        <SelectTrigger className={className}>
          <SelectValue>טוען...</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_loading">טוען...</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (error) {
    return (
      <Select disabled value="_error">
        <SelectTrigger className={className}>
          <SelectValue>שגיאה בטעינת נתונים</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_error">שגיאה בטעינת נתונים</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  // Handle value changes and empty values
  const handleValueChange = (newValue: string) => {
    if (newValue === "_placeholder" || newValue === "_empty") {
      effectiveOnChange("")
      return
    }
    effectiveOnChange(newValue)
  }
  
  const effectiveValue = value || (allowEmpty ? "_empty" : "_placeholder")

  return (
    <Select value={effectiveValue} onValueChange={handleValueChange} disabled={disabled} dir="rtl">
      <SelectTrigger 
        className={`${className} text-right dir-rtl database-dropdown rtl-placeholder`} 
        dir="rtl"
        style={{ textAlign: 'right', direction: 'rtl' }}
      >
        <SelectValue 
          placeholder={placeholder} 
          className="text-right rtl-placeholder" 
          dir="rtl"
          style={{ textAlign: 'right', direction: 'rtl', width: '100%', display: 'block' }}
        />
      </SelectTrigger>
      <SelectContent className="text-right dir-rtl" dir="rtl">
        <SelectItem value="_placeholder" className="text-right" dir="rtl" style={{ display: 'none' }}>{placeholder}</SelectItem>
        {allowEmpty && (
          <SelectItem value="_empty" className="text-right" dir="rtl">
            {placeholder}
          </SelectItem>
        )}
        {items.map((item) => (
          <SelectItem key={getItemValue(item)} value={getItemValue(item)} className="text-right" dir="rtl">
            {getItemLabel(item)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}