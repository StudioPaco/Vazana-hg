"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Save, Eye, EyeOff, User, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { clientAuth } from "@/lib/client-auth"

interface User {
  id: string
  username: string
  role: string
  description?: string
  isSystem?: boolean
  full_name?: string
  phone?: string // Only for non-root users
}

interface UserEditModalProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: (updatedUser: User) => void
}

export default function UserEditModal({ user, open, onOpenChange, onUserUpdated }: UserEditModalProps) {
  const [userData, setUserData] = useState({
    usernameEmail: "", // Combined username/email field
    fullName: "",
    phone: "",
    role: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (user && open) {
      loadUserProfile(user.id)
    }
  }, [user, open])

  const loadUserProfile = async (userId: string) => {
    if (userId === "root") {
      // Hardcoded root user data - no phone preset
      setUserData({
        usernameEmail: "root@vazana.com",
        fullName: "מנהל מערכת",
        phone: "", // Don't preset phone number
        role: "admin",
      })
      return
    }

    setLoadingProfile(true)
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) throw error

      if (data) {
        setUserData({
          usernameEmail: data.username || "",
          fullName: data.full_name || "",
          phone: data.phone || "",
          role: data.role || "user",
        })
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      alert("שגיאה בטעינת פרטי המשתמש")
    } finally {
      setLoadingProfile(false)
    }
  }

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return true // Phone is optional
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Check if it's 10 digits starting with 05, 06, or 07
    if (cleanPhone.length === 10 && (cleanPhone.startsWith('05') || cleanPhone.startsWith('06') || cleanPhone.startsWith('07'))) {
      return true
    }
    
    // Check if it's 9 digits starting with 0 (but not 05, 06, 07 which require 10 digits)
    if (cleanPhone.length === 9 && cleanPhone.startsWith('0') && 
        !cleanPhone.startsWith('05') && !cleanPhone.startsWith('06') && !cleanPhone.startsWith('07')) {
      return true
    }
    
    return false
  }

  const validatePasswords = () => {
    if (!passwordData.newPassword && !passwordData.confirmPassword) {
      return true // No password change requested
    }

    if (!passwordData.currentPassword) {
      alert("נדרשת סיסמה נוכחית לשינוי סיסמה")
      return false
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("סיסמאות חדשות לא תואמות")
      return false
    }

    if (passwordData.newPassword.length < 8) {
      alert("סיסמה חדשה חייבת להיות אורך 8 תווים לפחות")
      return false
    }

    const hasLower = /[a-z]/.test(passwordData.newPassword)
    const hasUpper = /[A-Z]/.test(passwordData.newPassword)

    if (!hasLower || !hasUpper) {
      alert("סיסמה חדשה חייבת לכלול אותיות קטנות וגדולות")
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!user) return

    if (!validatePasswords()) return
    
    // Validate phone number for non-root users
    if (user.id !== "root" && !validatePhoneNumber(userData.phone)) {
      alert("מספר טלפון לא תקין. אנא הכנס 10 ספרות המתחילות ב-05/06/07, או 9 ספרות המתחילות ב-0 (לא 05/06/07)")
      return
    }

    setLoading(true)
    try {
      let updatedData = null
      
      // Only update profile for non-root users
      if (user.id !== "root") {
        // Update user profile
        const updateData: any = {
          username: userData.usernameEmail,
          full_name: userData.fullName,
          phone: userData.phone,
          role: userData.role,
          updated_at: new Date().toISOString(),
        }

        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .update(updateData)
          .eq("id", user.id)
          .select()
          .single()

        if (profileError) {
          console.error("Profile update error:", profileError)
          throw new Error(`Failed to update profile: ${profileError.message}`)
        }
        
        updatedData = profileData
      }

      // Handle password change if requested
      if (passwordData.newPassword) {
        try {
          // Verify current password first
          const isCurrentPasswordValid = await clientAuth.verifyPassword(
            userData.usernameEmail,
            passwordData.currentPassword
          )

          if (!isCurrentPasswordValid) {
            alert("סיסמה נוכחית שגויה")
            return
          }

          // Update password
          const passwordHash = await clientAuth.hashPassword(passwordData.newPassword)
          const { error: passwordError } = await supabase
            .from("user_profiles")
            .update({ password_hash: passwordHash })
            .eq("id", user.id)

          if (passwordError) {
            console.error("Password update error:", passwordError)
            throw new Error(`Failed to update password: ${passwordError.message}`)
          }
        } catch (passwordError: any) {
          console.error("Password update error:", passwordError)
          alert(`שגיאה בעדכון סיסמה: ${passwordError.message || passwordError}`)
          return
        }
      }

      // Create updated user object for callback
      const updatedUser: User = {
        ...user,
        // Only update these fields for non-root users
        ...(user.id !== "root" && {
          username: userData.usernameEmail,
          role: userData.role === "admin" ? "מנהל" : "משתמש",
          description: userData.role === "admin" ? "מנהל מערכת" : "משתמש רגיל",
          full_name: userData.fullName,
          phone: userData.phone,
        })
      }

      onUserUpdated(updatedUser)
      onOpenChange(false)
      
      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      alert("פרטי המשתמש נשמרו בהצלחה!")
    } catch (error: any) {
      console.error("Error updating user:", error)
      const errorMessage = error?.message || error?.toString() || "Unknown error"
      alert(`שגיאה בעדכון פרטי המשתמש: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-hebrew text-right">
            <User className="w-5 h-5 text-vazana-teal" />
            עריכת משתמש
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loadingProfile ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              {/* User Details Section - Only show for non-root users */}
              {user.id !== "root" && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">שם משתמש / אימייל</Label>
                      <Input
                        value={userData.usernameEmail}
                        onChange={(e) => setUserData({ ...userData, usernameEmail: e.target.value })}
                        className="text-right font-hebrew"
                        dir="rtl"
                        type="email"
                        placeholder="user@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">שם מלא</Label>
                      <Input
                        value={userData.fullName}
                        onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                        className="text-right font-hebrew"
                        dir="rtl"
                        placeholder="שם מלא"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">טלפון</Label>
                      <Input
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        className="text-right font-hebrew"
                        dir="rtl"
                        placeholder="050-1234567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-hebrew text-right block">תפקיד</Label>
                      <Select value={userData.role} onValueChange={(value) => setUserData({ ...userData, role: value })}>
                        <SelectTrigger className="text-right font-hebrew">
                          <SelectValue placeholder="בחר תפקיד..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin" className="font-hebrew">מנהל</SelectItem>
                          <SelectItem value="user" className="font-hebrew">משתמש</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                </>
              )}
              
              {/* Root user info display */}
              {user.id === "root" && (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-vazana-teal" />
                      <Label className="font-hebrew text-sm font-medium">משתמש מנהל ראשי</Label>
                    </div>
                    <p className="text-sm text-gray-600 font-hebrew">שם משתמש: root</p>
                    <p className="text-sm text-gray-600 font-hebrew">תפקיד: מנהל מערכת ראשי</p>
                    <p className="text-xs text-gray-500 font-hebrew">ניתן לשנות רק את הסיסמה</p>
                  </div>
                  
                  <Separator />
                </>
              )}

              {/* Password Change Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-vazana-teal" />
                  <Label className="font-hebrew text-sm font-medium">שינוי סיסמה (אופציונלי)</Label>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block text-sm">סיסמה נוכחית</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="text-right font-hebrew pl-10"
                        dir="rtl"
                        placeholder="הזן סיסמה נוכחית"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block text-sm">סיסמה חדשה</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="text-right font-hebrew pl-10"
                        dir="rtl"
                        placeholder="הזן סיסמה חדשה"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-hebrew text-right block text-sm">אימות סיסמה חדשה</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="text-right font-hebrew pl-10"
                        dir="rtl"
                        placeholder="הזן סיסמה שוב"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-start gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={loading || loadingProfile}
              className="bg-vazana-teal hover:bg-vazana-teal/90 font-hebrew"
            >
              <Save className="ml-2 w-4 h-4" />
              {loading ? "שומר..." : "שמור שינויים"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="font-hebrew bg-transparent"
            >
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}