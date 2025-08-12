"use client"

import { useState, useEffect } from "react"
import { User } from "@/entities/User"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UserPlus } from "lucide-react"
import { Link } from "react-router-dom"
import { createPageUrl } from "@/utils"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SettingsUsers() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [language, setLanguage] = useState(() => localStorage.getItem("vazana-language") || "he")

  useEffect(() => {
    const handleStorageChange = () => {
      const newLang = localStorage.getItem("vazana-language") || "he"
      if (newLang !== language) setLanguage(newLang)
    }
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("languageChanged", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("languageChanged", handleStorageChange)
    }
  }, [language])

  const isHebrew = language === "he"

  const texts = {
    en: {
      title: "Manage Users",
      subtitle: "View and manage user access to the application.",
      backToSettings: "Back to Settings",
      inviteUser: "Invite New User",
      userName: "Name",
      userEmail: "Email",
      userRole: "Role",
      userStatus: "Status", // Assuming status might be available
      roleAdmin: "Admin",
      roleUser: "User",
      loadingUsers: "Loading users...",
      noUsers: "No users found.",
      // You might need more texts if actions like "Resend Invite", "Remove User" are added.
    },
    he: {
      title: "ניהול משתמשים",
      subtitle: "צפה ונהל את גישת המשתמשים לאפליקציה.",
      backToSettings: "חזור להגדרות",
      inviteUser: "הזמן משתמש חדש",
      userName: "שם",
      userEmail: 'דוא"ל',
      userRole: "תפקיד",
      userStatus: "סטטוס",
      roleAdmin: "מנהל",
      roleUser: "משתמש",
      loadingUsers: "טוען משתמשים...",
      noUsers: "לא נמצאו משתמשים.",
    },
  }
  const t = texts[language]

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const usersData = await User.list()
      setUsers(usersData)
    } catch (error) {
      console.error("Error loading users:", error)
      // Handle error state if necessary
    }
    setIsLoading(false)
  }

  // Note: Inviting users is typically handled by a platform-level UI
  // or requires an integration that can trigger the invite flow.
  // This button is a placeholder for that functionality.
  const handleInviteUser = () => {
    // This would ideally open the platform's invite user modal or navigate to it.
    // For now, it's a placeholder.
    alert(
      isHebrew
        ? "פונקציית הזמנת משתמש תטופל דרך ממשק הניהול של הפלטפורמה."
        : "User invite functionality would be handled via the platform's admin interface.",
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="p-6 lg:p-8">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{t.title}</h1>
              <p className="text-sm text-neutral-600">{t.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleInviteUser}
                className="bg-primary hover:bg-primary-dark text-primary-foreground flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> {t.inviteUser}
              </Button>
              <Link to={createPageUrl("Settings")}>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100 bg-transparent"
                >
                  <ArrowLeft className={`w-4 h-4 ${isHebrew ? "ml-1" : "mr-1"}`} />
                  {t.backToSettings}
                </Button>
              </Link>
            </div>
          </div>

          <Card className="shadow-lg border-neutral-200">
            <CardContent className="p-0">
              {" "}
              {/* Remove padding if table has its own */}
              {isLoading ? (
                <div className="p-6 text-center text-neutral-500">{t.loadingUsers}</div>
              ) : users.length === 0 ? (
                <div className="p-6 text-center text-neutral-500">{t.noUsers}</div>
              ) : (
                <Table>
                  <TableHeader className="bg-neutral-50">
                    <TableRow>
                      <TableHead className="text-neutral-700">{t.userName}</TableHead>
                      <TableHead className="text-neutral-700">{t.userEmail}</TableHead>
                      <TableHead className="text-neutral-700">{t.userRole}</TableHead>
                      {/* Add more headers if needed, e.g., Status, Actions */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-b-neutral-100 hover:bg-neutral-50/50">
                        <TableCell className="font-medium text-neutral-800">{user.full_name}</TableCell>
                        <TableCell className="text-neutral-600">{user.email}</TableCell>
                        <TableCell className="text-neutral-600">
                          <Badge
                            variant={user.role === "admin" ? "default" : "secondary"}
                            className={
                              user.role === "admin"
                                ? "bg-primary/80 text-primary-foreground"
                                : "bg-secondary/80 text-secondary-foreground"
                            }
                          >
                            {user.role === "admin" ? t.roleAdmin : t.roleUser}
                          </Badge>
                        </TableCell>
                        {/* Cells for Status, Actions */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
