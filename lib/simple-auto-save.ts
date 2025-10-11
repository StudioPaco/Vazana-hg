// Simple auto-save utility without React hooks to prevent infinite loops

interface SavedData {
  data: any
  timestamp: number
  expiresAt: number
}

export class SimpleAutoSave {
  private key: string
  private timeoutMinutes: number
  private saveTimeout?: NodeJS.Timeout
  
  constructor(key: string, timeoutMinutes: number = 15) {
    this.key = key
    this.timeoutMinutes = timeoutMinutes
  }
  
  // Check if auto-save is enabled in settings
  private isEnabled(): boolean {
    if (typeof window === 'undefined') return false
    const enabled = localStorage.getItem('vazana-auto-save-forms')
    return enabled === 'true' || enabled === null // Default to true if not set
  }
  
  // Save data with debouncing
  save(data: any, debounceMs: number = 2000) {
    if (!this.isEnabled()) return
    
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    
    // Set new timeout for debounced save
    this.saveTimeout = setTimeout(() => {
      this.saveNow(data)
    }, debounceMs)
  }
  
  // Save data immediately
  saveNow(data: any) {
    if (!this.isEnabled() || typeof window === 'undefined') return
    
    try {
      const now = Date.now()
      const savedData: SavedData = {
        data,
        timestamp: now,
        expiresAt: now + (this.timeoutMinutes * 60 * 1000)
      }
      
      localStorage.setItem(this.key, JSON.stringify(savedData))
      console.log(`Auto-saved form data for ${this.key}`)
    } catch (error) {
      console.error('Error auto-saving data:', error)
    }
  }
  
  // Load saved data
  load(): any | null {
    if (!this.isEnabled() || typeof window === 'undefined') return null
    
    try {
      const savedItem = localStorage.getItem(this.key)
      if (!savedItem) return null
      
      const parsed: SavedData = JSON.parse(savedItem)
      const now = Date.now()
      
      // Check if data has expired
      if (now > parsed.expiresAt) {
        localStorage.removeItem(this.key)
        return null
      }
      
      return parsed.data
    } catch (error) {
      console.error('Error loading auto-saved data:', error)
      localStorage.removeItem(this.key)
      return null
    }
  }
  
  // Clear saved data
  clear() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.key)
    }
  }
  
  // Reset timeout - extend expiry by another timeoutMinutes
  resetTimeout() {
    if (!this.isEnabled() || typeof window === 'undefined') return
    
    try {
      const savedItem = localStorage.getItem(this.key)
      if (savedItem) {
        const parsed: SavedData = JSON.parse(savedItem)
        const now = Date.now()
        parsed.expiresAt = now + (this.timeoutMinutes * 60 * 1000)
        localStorage.setItem(this.key, JSON.stringify(parsed))
        console.log(`Reset timeout for ${this.key}, expires in ${this.timeoutMinutes} minutes`)
      }
    } catch (error) {
      console.error('Error resetting timeout:', error)
    }
  }
}