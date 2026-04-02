"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, LayoutGrid, Table2, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import WorkerEditModal from "@/components/workers/worker-edit-modal"
import { toast } from "@/hooks/use-toast"

interface Worker {
  id: string
  name: string
  phone_number: string
  address: string
  shift_rate: number
  payment_terms_days: number
  availability: Record<string, boolean> | null
  notes: string
}

interface WorkersPageProps {
  showHeader?: boolean
}

export default function WorkersPage({ showHeader = true }: WorkersPageProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('vazana-workers-viewMode') as 'grid' | 'table') || 'table'
    return 'table'
  })

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("workers").select("*").order("name")

        if (error) {
          console.error("Error fetching workers:", error)
          setWorkers([])
          setFilteredWorkers([])
        } else {
          setWorkers(data || [])
          setFilteredWorkers(data || [])
        }
      } catch (error) {
        console.error("Failed to fetch workers:", error)
        setWorkers([])
        setFilteredWorkers([])
      } finally {
        setLoading(false)
      }
    }

    fetchWorkers()
  }, [])

  useEffect(() => {
    const filtered = workers.filter(
      (worker) =>
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.phone_number.includes(searchTerm) ||
        worker.address.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredWorkers(filtered)
  }, [searchTerm, workers])

  const handleDeleteWorker = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק עובד זה?")) {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("workers").delete().eq("id", id)

        if (error) {
          console.error("Error deleting worker:", error)
          toast({ title: "שגיאה במחיקת העובד. נסה שוב.", variant: "destructive" })
          return
        }
        setWorkers(workers.filter((worker) => worker.id !== id))
      } catch (error) {
        console.error("Failed to delete worker:", error)
        toast({ title: "שגיאה במחיקת העובד. נסה שוב.", variant: "destructive" })
      }
    }
  }

  const getAvailabilityRow = (availability: Record<string, boolean> | null) => {
    const dayNames = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]
    return dayNames.map((name, index) => {
      const dayAvail = availability?.[`יום_${index}`] !== false
      const nightAvail = availability?.[`לילה_${index}`] !== false
      let color = "bg-gray-200" // neither
      let title = "לא זמין"
      if (dayAvail && nightAvail) { color = "bg-green-500"; title = "יום + לילה" }
      else if (dayAvail) { color = "bg-yellow-400"; title = "יום בלבד" }
      else if (nightAvail) { color = "bg-blue-500"; title = "לילה בלבד" }
      return { name, color, title }
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${showHeader ? 'p-6' : ''} space-y-6`} dir="rtl">
      {showHeader && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-900">עובדים</h1>
              <p className="text-gray-600">ניהול כוח האדם שלך</p>
            </div>
            <Button asChild>
              <Link href="/settings/resources/workers/new">
                <Plus className="ml-2 h-4 w-4" />
                הוסף עובד
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="חפש עובדים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => { setViewMode('table'); localStorage.setItem('vazana-workers-viewMode', 'table') }}
          className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          title="תצוגת טבלה"
        >
          <Table2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setViewMode('grid'); localStorage.setItem('vazana-workers-viewMode', 'grid') }}
          className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          title="תצוגת כרטיסים"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>

      {/* Workers */}
      {filteredWorkers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <Plus className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2">לא נמצאו עובדים</p>
              <p className="text-sm">
                {searchTerm ? "נסה לשנות את מילות החיפוש" : "הוסף את העובד הראשון שלך כדי להתחיל"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-right font-hebrew font-medium text-gray-600">שם</th>
                  <th className="px-3 py-2 text-right font-hebrew font-medium text-gray-600">טלפון</th>
                  <th className="px-3 py-2 text-right font-hebrew font-medium text-gray-600 hidden md:table-cell">כתובת</th>
                  <th className="px-3 py-2 text-right font-hebrew font-medium text-gray-600">תעריף</th>
                  <th className="px-3 py-2 text-center font-hebrew font-medium text-gray-600">
                    <div className="flex items-center justify-center gap-1">
                      <span>זמינות</span>
                      <span className="text-[9px] text-gray-400 hidden lg:inline">(א׳-ש׳)</span>
                    </div>
                  </th>
                  <th className="px-3 py-2 text-center font-hebrew font-medium text-gray-600 w-20">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredWorkers.map((worker, idx) => {
                  const avail = getAvailabilityRow(worker.availability)
                  return (
                    <tr key={worker.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-3 py-2 font-hebrew font-medium">{worker.name}</td>
                      <td className="px-3 py-2 text-gray-600 direction-ltr" dir="ltr">{worker.phone_number}</td>
                      <td className="px-3 py-2 text-gray-600 hidden md:table-cell">{worker.address || "—"}</td>
                      <td className="px-3 py-2 text-gray-600">₪{worker.shift_rate}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          {avail.map((day, i) => (
                            <div
                              key={i}
                              title={`${day.name}: ${day.title}`}
                              className={`w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center text-white ${day.color}`}
                            >
                              {day.name.replace("׳", "")}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingWorker(worker)
                              setEditModalOpen(true)
                            }}
                          >
                            <Edit className="w-3.5 h-3.5 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDeleteWorker(worker.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Availability legend */}
          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-hebrew justify-end">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> יום</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> לילה</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> שניהם</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> לא זמין</span>
          </div>
        </>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map((worker) => {
            const avail = getAvailabilityRow(worker.availability)
            return (
              <Card key={worker.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-hebrew font-semibold">{worker.name}</p>
                      <p className="text-sm text-gray-500">₪{worker.shift_rate}/משמרת</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingWorker(worker); setEditModalOpen(true) }}>
                        <Edit className="w-3.5 h-3.5 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteWorker(worker.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {worker.phone_number && <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {worker.phone_number}</div>}
                    {worker.address && <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {worker.address}</div>}
                  </div>
                  <div className="flex items-center gap-0.5 pt-1">
                    {avail.map((day, i) => (
                      <div key={i} title={`${day.name}: ${day.title}`} className={`w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center text-white ${day.color}`}>
                        {day.name.replace("׳", "")}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <WorkerEditModal
        worker={editingWorker}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onWorkerUpdated={(updated) => {
          setWorkers(prev => prev.map(w => w.id === updated.id ? updated : w))
        }}
      />
    </div>
  )
}
