"use client"

import { createClient } from "@/lib/supabase/client"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  username: string
  email?: string
  role: "admin" | "user"
  full_name?: string
  loginTime: string
  sessionDuration: number // in hours
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

class UnifiedAuth {
  private supabase = createClient()
  private readonly SESSION_KEY = "vazana_user"
  private readonly LOGIN_STATUS_KEY = "vazana_logged_in"
  private readonly LOGIN_ATTEMPTS_KEY = "vazana_login_attempts"
  private readonly DEVICE_TOKEN_KEY = "vazana_device_token"
  private readonly DEFAULT_SESSION_HOURS = 24
  private readonly MAX_LOGIN_ATTEMPTS = 3
  private readonly LOCKOUT_DELAYS = [60, 300, 900] // 1min, 5min, 15min in seconds

  /**
   * Check if account is locked due to failed attempts
   */
  private isAccountLocked(username: string): { locked: boolean; timeRemaining?: number } {
    if (typeof window === "undefined") return { locked: false }
    
    const attemptsStr = localStorage.getItem(`${this.LOGIN_ATTEMPTS_KEY}_${username}`)
    if (!attemptsStr) return { locked: false }
    
    try {
      const attempts = JSON.parse(attemptsStr)
      const now = new Date().getTime()
      
      // Clean old attempts (older than 1 hour)
      const recentAttempts = attempts.filter((attempt: number) => 
        now - attempt < 3600000 // 1 hour in milliseconds
      )
      
      if (recentAttempts.length < this.MAX_LOGIN_ATTEMPTS) {
        return { locked: false }
      }
      
      // Calculate lockout time based on attempt count
      const lockoutIndex = Math.min(recentAttempts.length - this.MAX_LOGIN_ATTEMPTS, this.LOCKOUT_DELAYS.length - 1)
      const lockoutDuration = this.LOCKOUT_DELAYS[lockoutIndex] * 1000 // Convert to milliseconds
      const lastAttempt = Math.max(...recentAttempts)
      const lockoutEnd = lastAttempt + lockoutDuration
      
      if (now < lockoutEnd) {
        return { 
          locked: true, 
          timeRemaining: Math.ceil((lockoutEnd - now) / 1000) // seconds
        }
      }
      
      return { locked: false }
    } catch {
      return { locked: false }
    }
  }
  
  /**
   * Record failed login attempt
   */
  private recordFailedAttempt(username: string): void {
    if (typeof window === "undefined") return
    
    const attemptsStr = localStorage.getItem(`${this.LOGIN_ATTEMPTS_KEY}_${username}`)
    const attempts = attemptsStr ? JSON.parse(attemptsStr) : []
    attempts.push(new Date().getTime())
    
    localStorage.setItem(`${this.LOGIN_ATTEMPTS_KEY}_${username}`, JSON.stringify(attempts))
  }
  
  /**
   * Clear login attempts on successful login
   */
  private clearLoginAttempts(username: string): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(`${this.LOGIN_ATTEMPTS_KEY}_${username}`)
  }
  
  /**
   * Generate or get device token for device recognition
   */
  private getDeviceToken(): string {
    if (typeof window === "undefined") return "server"
    
    let token = localStorage.getItem(this.DEVICE_TOKEN_KEY)
    if (!token) {
      // Generate device fingerprint based on browser characteristics
      const fingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}-${Intl.DateTimeFormat().resolvedOptions().timeZone}`
      token = btoa(fingerprint + Date.now()).slice(0, 32)
      localStorage.setItem(this.DEVICE_TOKEN_KEY, token)
    }
    return token
  }
  
  /**
   * Simple unified login: supports root user + database users
   */
  async login(username: string, password: string): Promise<AuthResult> {
    try {
      // Check account lockout first
      const lockout = this.isAccountLocked(username)
      if (lockout.locked) {
        const minutes = Math.ceil(lockout.timeRemaining! / 60)
        return { 
          success: false, 
          error: `חשבון נעול ל-${minutes} דקות עקב ניסיונות התחברות כושלים` 
        }
      }
      
      // Check for root user first (hardcoded as requested)
      if (username === "root" && password === "10203040") {
        const user: User = {
          id: "root",
          username: "root",
          email: "root@vazana.com",
          role: "admin",
          full_name: "מנהל מערכת",
          loginTime: new Date().toISOString(),
          sessionDuration: this.DEFAULT_SESSION_HOURS
        }
        
        this.clearLoginAttempts(username) // Clear failed attempts on successful login
        this.storeSession(user)
        return { success: true, user }
      }

      // Check database users
      const { data: dbUsers, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single()

      if (error || !dbUsers) {
        return { success: false, error: "שם משתמש או סיסמה שגויים" }
      }

      // Verify password using bcrypt
      if (dbUsers.password_hash && await bcrypt.compare(password, dbUsers.password_hash)) {
        const user: User = {
          id: dbUsers.id,
          username: dbUsers.username,
          email: dbUsers.email || `${dbUsers.username}@vazana.local`,
          role: dbUsers.role || "user",
          full_name: dbUsers.full_name || dbUsers.username,
          loginTime: new Date().toISOString(),
          sessionDuration: this.DEFAULT_SESSION_HOURS
        }
        
        this.clearLoginAttempts(username) // Clear failed attempts on successful login
        this.storeSession(user)
        return { success: true, user }
      }

      // Record failed attempt and return error
      this.recordFailedAttempt(username)
      return { success: false, error: "שם משתמש או סיסמה שגויים" }
      
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: "אירעה שגיאה בלתי צפויה" }
    }
  }

  /**
   * Store session in localStorage with timestamp for timeout management
   */
  private storeSession(user: User): void {
    if (typeof window === "undefined") return
    
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user))
    localStorage.setItem(this.LOGIN_STATUS_KEY, "true")
  }

  /**
   * Get current user if session is valid
   */
  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null
    
    const userStr = localStorage.getItem(this.SESSION_KEY)
    if (!userStr) return null

    try {
      const user = JSON.parse(userStr) as User
      
      // Check if session is expired (avoid circular dependency)
      const loginTime = new Date(user.loginTime)
      const now = new Date()
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLogin >= user.sessionDuration) {
        this.logout() // Auto-logout on expired session
        return null
      }
      
      return user
    } catch {
      this.logout() // Clear invalid session data
      return null
    }
  }

  /**
   * Check if current session is valid (not expired)
   */
  isSessionValid(): boolean {
    if (typeof window === "undefined") return false
    
    const userStr = localStorage.getItem(this.SESSION_KEY)
    if (!userStr) return false

    try {
      const user = JSON.parse(userStr) as User
      const loginTime = new Date(user.loginTime)
      const now = new Date()
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
      
      return hoursSinceLogin < user.sessionDuration
    } catch {
      return false
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  /**
   * Logout user and clear session
   */
  logout(): void {
    if (typeof window === "undefined") return
    
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.LOGIN_STATUS_KEY)
  }

  /**
   * Update session duration for current user
   */
  updateSessionDuration(hours: number): void {
    const user = this.getCurrentUser()
    if (user) {
      user.sessionDuration = hours
      this.storeSession(user)
    }
  }

  /**
   * Get time remaining in session (in minutes)
   */
  getSessionTimeRemaining(): number {
    const user = this.getCurrentUser()
    if (!user) return 0

    const loginTime = new Date(user.loginTime)
    const now = new Date()
    const minutesSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60)
    const totalSessionMinutes = user.sessionDuration * 60
    
    return Math.max(0, totalSessionMinutes - minutesSinceLogin)
  }

  /**
   * Hash a password for storage
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  /**
   * Check if user has admin privileges
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser()
    return user?.role === "admin"
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    
    // Admin has all permissions
    if (user.role === "admin") return true
    
    // For now, regular users have basic permissions
    const basicPermissions = ["view_dashboard", "view_jobs", "view_clients", "create_jobs"]
    return basicPermissions.includes(permission)
  }
}

// Export singleton instance
export const clientAuth = new UnifiedAuth()

// Legacy compatibility exports
export const auth = clientAuth
