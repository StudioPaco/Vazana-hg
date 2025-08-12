"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, UserPlus, Shield, Crown, Settings, User } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: "root" | "admin" | "manager" | "employee"
  is_active: boolean
  created_at: string
}

export function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const userData = {
      email: formData.get("email") as string,
      full_name: formData.get("full_name") as string,
      role: formData.get("role") as string,
      permissions: {
        manage_clients: formData.get("manage_clients") === "on",
        manage_jobs: formData.get("manage_jobs") === "on",
        manage_workers: formData.get("manage_workers") === "on",
        manage_invoices: formData.get("manage_invoices") === "on",
        view_reports: formData.get("view_reports") === "on",
      },
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        await fetchUsers()
        setIsCreateDialogOpen(false)
        ;(event.target as HTMLFormElement).reset()
      }
    } catch (error) {
      console.error("Failed to create user:", error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "root":
        return <Crown className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      case "manager":
        return <Settings className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "root":
        return "bg-primary text-dark-gray"
      case "admin":
        return "bg-secondary text-white"
      case "manager":
        return "bg-accent-pink text-white"
      default:
        return "bg-neutral-200 text-neutral-700"
    }
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      root: "מנהל ראשי",
      admin: "מנהל",
      manager: "מנהל צוות",
      employee: "עובד",
    }
    return labels[role as keyof typeof labels] || role
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-gray">ניהול משתמשים</h1>
          <p className="text-neutral-600 mt-1">נהל משתמשים והרשאות במערכת</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-dark-gray hover:bg-primary/90">
              <UserPlus className="h-4 w-4 mr-2" />
              הוסף משתמש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>הוסף משתמש חדש</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="full_name">שם מלא</Label>
                <Input id="full_name" name="full_name" required />
              </div>
              <div>
                <Label htmlFor="role">תפקיד</Label>
                <Select name="role" required>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">עובד</SelectItem>
                    <SelectItem value="manager">מנהל צוות</SelectItem>
                    <SelectItem value="admin">מנהל</SelectItem>
                    <SelectItem value="root">מנהל ראשי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>הרשאות</Label>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="manage_clients" />
                    ניהול לקוחות
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="manage_jobs" />
                    ניהול עבודות
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="manage_workers" />
                    ניהול עובדים
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="manage_invoices" />
                    ניהול חשבוניות
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="view_reports" />
                    צפייה בדוחות
                  </label>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-dark-gray hover:bg-primary/90">
                צור משתמש
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">טוען משתמשים...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">לא נמצאו משתמשים</div>
        ) : (
          users.map((user) => (
            <Card key={user.id} className={`${!user.is_active ? "opacity-60" : ""}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-neutral-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-gray">{user.full_name || user.email}</h3>
                      <p className="text-sm text-neutral-600">{user.email}</p>
                      <p className="text-xs text-neutral-500">
                        נוצר: {new Date(user.created_at).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
                      {getRoleIcon(user.role)}
                      {getRoleLabel(user.role)}
                    </Badge>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
