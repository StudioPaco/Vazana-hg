"use client"

import { createClient } from "@/lib/supabase/client"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  username: string
  email?: string
  role: "admin" | "user"
  full_name?: string
  loginTime?: string
  sessionDuration?: number
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

/**
 * UnifiedAuth - Client-side auth manager
 * 
 * Source of truth: HTTP-only cookies (set by /api/auth/simple-login)
 * localStorage: Used only as a cache to reduce API calls
 * 
 * The session is verified server-side via /api/auth/session
 */
class UnifiedAuth {
  private supabase = createClient()
  private readonly CACHE_KEY = "vazana_user_cache"
  private readonly CACHE_TIMESTAMP_KEY = "vazana_cache_timestamp"
  private readonly LOGIN_ATTEMPTS_KEY = "vazana_login_attempts"
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes cache
  private readonly MAX_LOGIN_ATTEMPTS = 3
  private readonly LOCKOUT_DELAYS = [60, 300, 900] // 1min, 5min, 15min in seconds

  // In-memory cache for the current request lifecycle
  private memoryCache: { user: User | null; timestamp: number } | null = null

  /**
   * Check if account is locked due to failed attempts
   */
  private isAccountLocked(username: string): { locked: boolean; timeRemaining?: number } {
    if (typeof window === "undefined") return { locked: false }
    
    const attemptsStr = localStorage.getItem(`${this.LOGIN_ATTEMPTS_KEY}_${username}`)
    if (!attemptsStr) return { locked: false }
    
    try {
      const attempts = JSON.parse(attemptsStr)
      const now = Date.now()
      
      // Clean old attempts (older than 1 hour)
      const recentAttempts = attempts.filter((attempt: number) => now - attempt < 3600000)
      
      if (recentAttempts.length < this.MAX_LOGIN_ATTEMPTS) {
        return { locked: false }
      }
      
      const lockoutIndex = Math.min(recentAttempts.length - this.MAX_LOGIN_ATTEMPTS, this.LOCKOUT_DELAYS.length - 1)
      const lockoutDuration = this.LOCKOUT_DELAYS[lockoutIndex] * 1000
      const lastAttempt = Math.max(...recentAttempts)
      const lockoutEnd = lastAttempt + lockoutDuration
      
      if (now < lockoutEnd) {
        return { locked: true, timeRemaining: Math.ceil((lockoutEnd - now) / 1000) }
      }
      
      return { locked: false }
    } catch {
      return { locked: false }
    }
  }
  
  private recordFailedAttempt(username: string): void {
    if (typeof window === "undefined") return
    const attemptsStr = localStorage.getItem(`${this.LOGIN_ATTEMPTS_KEY}_${username}`)
    const attempts = attemptsStr ? JSON.parse(attemptsStr) : []
    attempts.push(Date.now())
    localStorage.setItem(`${this.LOGIN_ATTEMPTS_KEY}_${username}`, JSON.stringify(attempts))
  }
  
  private clearLoginAttempts(username: string): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(`${this.LOGIN_ATTEMPTS_KEY}_${username}`)
  }

  /**
   * Update the local cache with user data
   */
  private updateCache(user: User | null): void {
    if (typeof window === "undefined") return
    
    this.memoryCache = { user, timestamp: Date.now() }
    
    if (user) {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(user))
      localStorage.setItem(this.CACHE_TIMESTAMP_KEY, Date.now().toString())
    } else {
      localStorage.removeItem(this.CACHE_KEY)
      localStorage.removeItem(this.CACHE_TIMESTAMP_KEY)
    }
  }

  /**
   * Get cached user if still valid
   */
  private getCachedUser(): User | null {
    if (typeof window === "undefined") return null
    
    // Check memory cache first
    if (this.memoryCache && Date.now() - this.memoryCache.timestamp < this.CACHE_TTL_MS) {
      return this.memoryCache.user
    }
    
    // Check localStorage cache
    const timestampStr = localStorage.getItem(this.CACHE_TIMESTAMP_KEY)
    if (!timestampStr) return null
    
    const cacheAge = Date.now() - parseInt(timestampStr, 10)
    if (cacheAge > this.CACHE_TTL_MS) {
      // Cache expired, clear it
      this.updateCache(null)
      return null
    }
    
    try {
      const userStr = localStorage.getItem(this.CACHE_KEY)
      if (!userStr) return null
      const user = JSON.parse(userStr) as User
      this.memoryCache = { user, timestamp: Date.now() }
      return user
    } catch {
      return null
    }
  }

  /**
   * Login - authenticates via server API which sets HTTP-only cookies
   */
  async login(username: string, password: string): Promise<AuthResult> {
    try {
      // Check account lockout first
      const lockout = this.isAccountLocked(username)
      if (lockout.locked) {
        const minutes = Math.ceil(lockout.timeRemaining! / 60)
        return { success: false, error: `חשבון נעול ל-${minutes} דקות עקב ניסיונות התחברות כושלים` }
      }
      
      // Authenticate via server API (sets HTTP-only cookies)
      const response = await fetch("/api/auth/simple-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Important: include cookies
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const user: User = {
          id: data.user?.id || username,
          username: data.user?.username || username,
          email: data.user?.email || `${username}@vazana.local`,
          role: data.user?.role || "user",
          full_name: data.user?.full_name || username,
          loginTime: new Date().toISOString(),
        }
        
        this.clearLoginAttempts(username)
        this.updateCache(user)
        
        // Also save to legacy keys for backward compatibility
        if (typeof window !== "undefined") {
          localStorage.setItem("vazana_user", JSON.stringify(user))
          localStorage.setItem("vazana_logged_in", "true")
        }
        
        return { success: true, user }
      }

      this.recordFailedAttempt(username)
      return { success: false, error: data.error || "שם משתמש או סיסמה שגויים" }
      
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "אירעה שגיאה בלתי צפויה" }
    }
  }

  /**
   * Get current user - uses localStorage cache primarily
   * Server session is optional enhancement, not required for auth
   */
  async getCurrentUserAsync(): Promise<User | null> {
    // Check localStorage cache first - this is the primary auth method
    const cached = this.getCachedUser()
    if (cached) return cached
    
    // Also check legacy localStorage key for backward compatibility
    if (typeof window !== "undefined") {
      const legacyUser = localStorage.getItem("vazana_user")
      if (legacyUser) {
        try {
          const user = JSON.parse(legacyUser) as User
          this.updateCache(user)
          return user
        } catch {}
      }
    }
    
    // No local session found
    return null
  }

  /**
   * Synchronous getCurrentUser - returns cached user only
   * For async session verification, use getCurrentUserAsync()
   */
  getCurrentUser(): User | null {
    return this.getCachedUser()
  }

  /**
   * Check if user is authenticated (synchronous, cache-based)
   * For accurate check, use isAuthenticatedAsync()
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  /**
   * Async authentication check - checks localStorage primarily
   */
  async isAuthenticatedAsync(): Promise<boolean> {
    // Check localStorage for login state first (fast path)
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("vazana_logged_in")
      if (loggedIn === "true") return true
    }
    
    // Fall back to cache check
    const user = await this.getCurrentUserAsync()
    return user !== null
  }

  /**
   * Check if session is valid (synchronous, cache-based)
   */
  isSessionValid(): boolean {
    return this.isAuthenticated()
  }

  /**
   * Logout - clears server session and local cache
   */
  async logout(): Promise<void> {
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
    
    // Clear all local caches including legacy keys
    this.updateCache(null)
    this.memoryCache = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("vazana_user")
      localStorage.removeItem("vazana_logged_in")
    }
  }

  /**
   * Synchronous logout for components that can't await
   */
  logoutSync(): void {
    // Fire and forget the API call
    fetch("/api/auth/session", { method: "DELETE", credentials: "include" }).catch(() => {})
    this.updateCache(null)
    this.memoryCache = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("vazana_user")
      localStorage.removeItem("vazana_logged_in")
    }
  }

  /**
   * Get session time remaining (returns 0 if no session info available)
   */
  getSessionTimeRemaining(): number {
    // For now, return a default value
    // In future, we can track expiry from the session API response
    const cached = this.getCachedUser()
    if (!cached) return 0
    return 60 * 24 // Default 24 hours in minutes
  }

  /**
   * Hash a password for storage
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * Verify a password - checks via server API
   */
  async verifyPassword(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/simple-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      return response.ok && data.success
    } catch {
      return false
    }
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser()
    return user?.role === "admin"
  }

  /**
   * Async admin check
   */
  async isAdminAsync(): Promise<boolean> {
    const user = await this.getCurrentUserAsync()
    return user?.role === "admin"
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    if (user.role === "admin") return true
    
    const basicPermissions = ["view_dashboard", "view_jobs", "view_clients", "create_jobs"]
    return basicPermissions.includes(permission)
  }

  /**
   * Force refresh the session from server
   */
  async refreshSession(): Promise<User | null> {
    this.memoryCache = null
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.CACHE_KEY)
      localStorage.removeItem(this.CACHE_TIMESTAMP_KEY)
    }
    return this.getCurrentUserAsync()
  }
}

// Export singleton instance
export const clientAuth = new UnifiedAuth()

// Legacy compatibility exports
export const auth = clientAuth
