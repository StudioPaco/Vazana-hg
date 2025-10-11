import { useEffect, useRef, useCallback } from 'react'

interface AutoSaveOptions {
  key: string
  data: any
  enabled: boolean
  debounceMs?: number
  timeoutMinutes?: number
}

interface SavedData {
  data: any
  timestamp: number
  expiresAt: number
}

export function useAutoSave({ 
  key, 
  data, 
  enabled, 
  debounceMs = 2000,
  timeoutMinutes = 15 
}: AutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveRef = useRef<string>()
  
  // Load saved data from localStorage
  const loadSavedData = useCallback((): any | null => {
    if (!enabled || typeof window === 'undefined') return null
    
    try {
      const savedItem = localStorage.getItem(key)
      if (!savedItem) return null
      
      const parsed: SavedData = JSON.parse(savedItem)
      const now = Date.now()
      
      // Check if data has expired
      if (now > parsed.expiresAt) {
        localStorage.removeItem(key)
        return null
      }
      
      return parsed.data
    } catch (error) {
      console.error('Error loading auto-saved data:', error)
      localStorage.removeItem(key)
      return null
    }
  }, [key, enabled])
  
  // Save data to localStorage
  const saveData = (dataToSave: any) => {
    if (!enabled || typeof window === 'undefined') return
    
    try {
      const now = Date.now()
      const savedData: SavedData = {
        data: dataToSave,
        timestamp: now,
        expiresAt: now + (timeoutMinutes * 60 * 1000) // Convert minutes to milliseconds
      }
      
      localStorage.setItem(key, JSON.stringify(savedData))
      console.log(`Auto-saved form data for ${key}`)
    } catch (error) {
      console.error('Error auto-saving data:', error)
    }
  }
  
  // Clear saved data
  const clearSavedData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  }
  
  // Get time remaining until expiry
  const getTimeRemaining = (): number => {
    if (!enabled || typeof window === 'undefined') return 0
    
    try {
      const savedItem = localStorage.getItem(key)
      if (!savedItem) return 0
      
      const parsed: SavedData = JSON.parse(savedItem)
      const now = Date.now()
      const remaining = parsed.expiresAt - now
      
      return Math.max(0, remaining)
    } catch (error) {
      return 0
    }
  }
  
  // Reset timeout - extend expiry by another 15 minutes
  const resetTimeout = () => {
    if (!enabled || typeof window === 'undefined') return
    
    try {
      const savedItem = localStorage.getItem(key)
      if (savedItem) {
        const parsed: SavedData = JSON.parse(savedItem)
        const now = Date.now()
        parsed.expiresAt = now + (timeoutMinutes * 60 * 1000)
        localStorage.setItem(key, JSON.stringify(parsed))
        console.log(`Reset timeout for ${key}, expires in ${timeoutMinutes} minutes`)
      }
    } catch (error) {
      console.error('Error resetting timeout:', error)
    }
  }
  
  // Auto-save effect with debouncing
  useEffect(() => {
    if (!enabled || !data) return
    
    // Convert data to string for comparison
    const dataString = JSON.stringify(data)
    
    // Don't save if data hasn't changed
    if (dataString === lastSaveRef.current) return
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      saveData(data)
      lastSaveRef.current = dataString
    }, debounceMs)
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, enabled, key, debounceMs, timeoutMinutes])
  
  // Cleanup expired data on mount
  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      try {
        const savedItem = localStorage.getItem(key)
        if (savedItem) {
          const parsed: SavedData = JSON.parse(savedItem)
          const now = Date.now()
          
          // Clean up expired data
          if (now > parsed.expiresAt) {
            localStorage.removeItem(key)
          }
        }
      } catch (error) {
        localStorage.removeItem(key)
      }
    }
  }, []) // Only run on mount
  
  return {
    loadSavedData,
    saveData,
    clearSavedData,
    getTimeRemaining,
    resetTimeout
  }
}