"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Edit, Trash2 } from "lucide-react"
import SidebarNavigation from "@/components/layout/sidebar-navigation"

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState("employees")

  const mockEmployees = [
    { id: 1, name: "אחמד עלי", phone: "052-1234567", shift_rate: 120, status: "פעיל" },
    { id: 2, name: "מוחמד חסן", phone: "053-7654321", shift_rate: 110, status: "פעיל" },
  ]

  const mockVehicles = [
    { id: 1, name: "רכב 1", license_plate: "123-45-678", status: "זמין" },
    { id: 2, name: "רכב 2", license_plate: "987-65-432", status: "בשימוש" },
  ]

  const mockCarts = [
    { id: 1, name: "עגלה 1", details: "עגלת אבטחה סטנדרטית", status: "זמין" },
    { id: 2, name: "עגלה 2", details: "עגלת אבטחה מתקדמת", status: "בתיקון" },
  ]

  const mockJobTypes = [
    { id: 1, name_he: "אבטחת אירועים", name_en: "Event Security" },
    { id: 2, name_he: "אבטחת כבישים", name_en: "Road Security" },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dir-rtl">
      <SidebarNavigation />

      <div className="flex-1 p-6 mr-64">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">ניהול משאבים</h1>
          </div>
          <p className="text-gray-600 text-right mt-2">נהל עובדים, כלי רכב, עגלות וסוגי עבודות</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit mr-auto">
          <Button
            variant={activeTab === "employees" ? "default" : "ghost"}
            onClick={() => setActiveTab("employees")}
            className="text-sm"
          >
            עובדים
          </Button>
          <Button
            variant={activeTab === "vehicles" ? "default" : "ghost"}
            onClick={() => setActiveTab("vehicles")}
            className="text-sm"
          >
            כלי רכב
          </Button>
          <Button
            variant={activeTab === "carts" ? "default" : "ghost"}
            onClick={() => setActiveTab("carts")}
            className="text-sm"
          >
            עגלות
          </Button>
          <Button
            variant={activeTab === "job-types" ? "default" : "ghost"}
            onClick={() => setActiveTab("job-types")}
            className="text-sm"
          >
            סוגי עבודות
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "employees" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button>
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף עובד
                  </Button>
                  <CardTitle className="text-right">עובדים</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={employee.status === "פעיל" ? "default" : "secondary"}>{employee.status}</Badge>
                        <div className="text-right">
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-gray-600">{employee.phone}</p>
                          <p className="text-sm text-gray-600">₪{employee.shift_rate}/משמרת</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "vehicles" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button>
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף רכב
                  </Button>
                  <CardTitle className="text-right">כלי רכב</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={vehicle.status === "זמין" ? "default" : "secondary"}>{vehicle.status}</Badge>
                        <div className="text-right">
                          <p className="font-medium">{vehicle.name}</p>
                          <p className="text-sm text-gray-600">{vehicle.license_plate}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "carts" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button>
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף עגלה
                  </Button>
                  <CardTitle className="text-right">עגלות</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCarts.map((cart) => (
                    <div key={cart.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="default">זמין</Badge>
                        <div className="text-right">
                          <p className="font-medium">{cart.name}</p>
                          <p className="text-sm text-gray-600">{cart.details}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "job-types" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button>
                    <Plus className="ml-2 h-4 w-4" />
                    הוסף סוג עבודה
                  </Button>
                  <CardTitle className="text-right">סוגי עבודות</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockJobTypes.map((jobType) => (
                    <div key={jobType.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{jobType.name_he}</p>
                        <p className="text-sm text-gray-600">{jobType.name_en}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
