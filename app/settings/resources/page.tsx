"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Edit, Trash2 } from "lucide-react"
import SidebarNavigation from "@/components/layout/sidebar-navigation"
import { useWorkersResource, useVehiclesResource, useCartsResource, useWorkTypesResource } from "@/hooks/use-resources"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState("employees")
  const { toast } = useToast()
  
  // Resource hooks
  const {
    workers: employees,
    loading: employeesLoading,
    error: employeesError,
    addWorker,
    updateWorker,
    deleteWorker,
  } = useWorkersResource()

  const {
    vehicles,
    loading: vehiclesLoading,
    error: vehiclesError,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  } = useVehiclesResource()

  const {
    carts,
    loading: cartsLoading,
    error: cartsError,
    addCart,
    updateCart,
    deleteCart,
  } = useCartsResource()

  const {
    workTypes,
    loading: workTypesLoading,
    error: workTypesError,
    addWorkType,
    updateWorkType,
    deleteWorkType,
  } = useWorkTypesResource()

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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="ml-2 h-4 w-4" />
                        הוסף עובד
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>הוספת עובד חדש</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const worker = {
                          name: formData.get("name") as string,
                          phone_number: formData.get("phone_number") as string,
                          address: formData.get("address") as string || undefined,
                          shift_rate: Number(formData.get("shift_rate")),
                          payment_terms_days: Number(formData.get("payment_terms_days")),
                          notes: formData.get("notes") as string || undefined,
                        }
                        
                        try {
                          await addWorker(worker)
                          toast({
                            title: "עובד נוסף בהצלחה",
                            variant: "default",
                          })
                          ;(e.target as HTMLFormElement).reset()
                          const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement
                          closeButton?.click()
                        } catch (error) {
                          toast({
                            title: "שגיאה בהוספת עובד",
                            description: error instanceof Error ? error.message : "נא לנסות שוב",
                            variant: "destructive",
                          })
                        }
                      }}>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">שם העובד</Label>
                            <Input id="name" name="name" placeholder="שם מלא" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone_number">מספר טלפון</Label>
                            <Input id="phone_number" name="phone_number" placeholder="050-1234567" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address">כתובת</Label>
                            <Input id="address" name="address" placeholder="כתובת מלאה" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="shift_rate">תעריף למשמרת</Label>
                              <Input 
                                id="shift_rate" 
                                name="shift_rate" 
                                type="number" 
                                placeholder="₪" 
                                required 
                                min="0"
                                step="10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="payment_terms_days">ימי אשראי</Label>
                              <Input 
                                id="payment_terms_days" 
                                name="payment_terms_days" 
                                type="number" 
                                placeholder="ימים" 
                                required 
                                min="0"
                                defaultValue="30"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">הערות</Label>
                            <Textarea id="notes" name="notes" placeholder="הערות נוספות..." />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit">הוסף עובד</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <CardTitle className="text-right">עובדים</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeesLoading ? (
                    <div className="text-center py-4 text-gray-500">טוען...</div>
                  ) : employeesError ? (
                    <div className="text-center py-4 text-red-500">שגיאה בטעינת נתונים</div>
                  ) : employees?.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">אין עובדים להצגה</div>
                  ) : employees?.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              await deleteWorker(employee.id)
                              toast({
                                title: "עובד נמחק בהצלחה",
                                variant: "default",
                              })
                            } catch (error) {
                              toast({
                                title: "שגיאה במחיקת עובד",
                                description: error instanceof Error ? error.message : "נא לנסות שוב",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="default">{employee.is_active ? "פעיל" : "לא פעיל"}</Badge>
                        <div className="text-right">
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-gray-600">{employee.phone_number}</p>
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="ml-2 h-4 w-4" />
                        הוסף רכב
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>הוספת רכב חדש</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const vehicle = {
                          name: formData.get("name") as string,
                          license_plate: formData.get("license_plate") as string,
                          details: formData.get("details") as string || undefined,
                        }
                        
                        try {
                          await addVehicle(vehicle)
                          toast({
                            title: "רכב נוסף בהצלחה",
                            variant: "default",
                          })
                          ;(e.target as HTMLFormElement).reset()
                          const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement
                          closeButton?.click()
                        } catch (error) {
                          toast({
                            title: "שגיאה בהוספת רכב",
                            description: error instanceof Error ? error.message : "נא לנסות שוב",
                            variant: "destructive",
                          })
                        }
                      }}>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">שם הרכב</Label>
                            <Input id="name" name="name" placeholder="לדוגמה: טנדר לבן" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="license_plate">מספר רישוי</Label>
                            <Input id="license_plate" name="license_plate" placeholder="לדוגמה: 12-345-67" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="details">פרטים נוספים</Label>
                            <Textarea id="details" name="details" placeholder="פרטים נוספים על הרכב..." />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit">הוסף רכב</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <CardTitle className="text-right">כלי רכב</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehiclesLoading ? (
                    <div className="text-center py-4 text-gray-500">טוען...</div>
                  ) : vehiclesError ? (
                    <div className="text-center py-4 text-red-500">שגיאה בטעינת נתונים</div>
                  ) : vehicles?.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">אין רכבים להצגה</div>
                  ) : vehicles?.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              await deleteVehicle(vehicle.id)
                              toast({
                                title: "רכב נמחק בהצלחה",
                                variant: "default",
                              })
                            } catch (error) {
                              toast({
                                title: "שגיאה במחיקת רכב",
                                description: error instanceof Error ? error.message : "נא לנסות שוב",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="default">{vehicle.is_active ? "זמין" : "לא זמין"}</Badge>
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="ml-2 h-4 w-4" />
                        הוסף עגלה
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>הוספת עגלה חדשה</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const cart = {
                          name: formData.get("name") as string,
                          details: formData.get("details") as string || undefined,
                        }
                        
                        try {
                          await addCart(cart)
                          toast({
                            title: "עגלה נוספה בהצלחה",
                            variant: "default",
                          })
                          ;(e.target as HTMLFormElement).reset()
                          const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement
                          closeButton?.click()
                        } catch (error) {
                          toast({
                            title: "שגיאה בהוספת עגלה",
                            description: error instanceof Error ? error.message : "נא לנסות שוב",
                            variant: "destructive",
                          })
                        }
                      }}>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">שם העגלה</Label>
                            <Input id="name" name="name" placeholder="לדוגמה: עגלת אבטחה בסיסית" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="details">פרטים נוספים</Label>
                            <Textarea id="details" name="details" placeholder="פרטים נוספים על העגלה וציוד..." />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit">הוסף עגלה</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <CardTitle className="text-right">עגלות</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartsLoading ? (
                    <div className="text-center py-4 text-gray-500">טוען...</div>
                  ) : cartsError ? (
                    <div className="text-center py-4 text-red-500">שגיאה בטעינת נתונים</div>
                  ) : carts?.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">אין עגלות להצגה</div>
                  ) : carts?.map((cart) => (
                    <div key={cart.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              await deleteCart(cart.id)
                              toast({
                                title: "עגלה נמחקה בהצלחה",
                                variant: "default",
                              })
                            } catch (error) {
                              toast({
                                title: "שגיאה במחיקת עגלה",
                                description: error instanceof Error ? error.message : "נא לנסות שוב",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="ml-2 h-4 w-4" />
                        הוסף סוג עבודה
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>הוספת סוג עבודה חדש</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const workType = {
                          name_he: formData.get("name_he") as string,
                          name_en: formData.get("name_en") as string,
                        }
                        
                        try {
                          await addWorkType(workType)
                          toast({
                            title: "סוג עבודה נוסף בהצלחה",
                            variant: "default",
                          })
                          ;(e.target as HTMLFormElement).reset()
                          const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement
                          closeButton?.click()
                        } catch (error) {
                          toast({
                            title: "שגיאה בהוספת סוג עבודה",
                            description: error instanceof Error ? error.message : "נא לנסות שוב",
                            variant: "destructive",
                          })
                        }
                      }}>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name_he">שם העבודה בעברית</Label>
                            <Input id="name_he" name="name_he" placeholder="לדוגמה: אבטחת אירועים" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="name_en">שם העבודה באנגלית</Label>
                            <Input id="name_en" name="name_en" placeholder="e.g., Event Security" required />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit">הוסף סוג עבודה</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <CardTitle className="text-right">סוגי עבודות</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workTypesLoading ? (
                    <div className="text-center py-4 text-gray-500">טוען...</div>
                  ) : workTypesError ? (
                    <div className="text-center py-4 text-red-500">שגיאה בטעינת נתונים</div>
                  ) : workTypes?.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">אין סוגי עבודה להצגה</div>
                  ) : workTypes?.map((jobType) => (
                    <div key={jobType.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              await deleteWorkType(jobType.id)
                              toast({
                                title: "סוג עבודה נמחק בהצלחה",
                                variant: "default",
                              })
                            } catch (error) {
                              toast({
                                title: "שגיאה במחיקת סוג עבודה",
                                description: error instanceof Error ? error.message : "נא לנסות שוב",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
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
