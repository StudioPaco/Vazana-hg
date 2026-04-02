"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, ShoppingCart, Edit, Trash2, LayoutGrid, Table2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import CartEditModal from "@/components/carts/cart-edit-modal"

interface Cart {
  id: string
  name: string
  details: string
  license_plate?: string
}

interface CartsPageProps {
  showHeader?: boolean
}

export default function CartsPage({ showHeader = true }: CartsPageProps) {
  const [carts, setCarts] = useState<Cart[]>([])
  const [filteredCarts, setFilteredCarts] = useState<Cart[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingCart, setEditingCart] = useState<Cart | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('vazana-carts-viewMode') as 'grid' | 'table') || 'table'
    return 'table'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCarts = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("carts").select("*").order("name")

        if (error) {
          console.error("Error fetching carts:", error)
          setCarts([])
          setFilteredCarts([])
        } else {
          setCarts(data || [])
          setFilteredCarts(data || [])
        }
      } catch (error) {
        console.error("Failed to fetch carts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCarts()
  }, [])

  useEffect(() => {
    const filtered = carts.filter((cart) => cart.name.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredCarts(filtered)
  }, [searchTerm, carts])

  const handleDeleteCart = async (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק עגלה זו?")) {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("carts").delete().eq("id", id)

        if (error) {
          console.error("Error deleting cart:", error)
        }
        setCarts(carts.filter((cart) => cart.id !== id))
      } catch (error) {
        console.error("Failed to delete cart:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">עגלות</h1>
              <p className="text-gray-600">ניהול עגלות הציוד שלך</p>
            </div>
            <Button asChild>
              <Link href="/settings/resources/shopping-carts/new">
                <Plus className="ml-2 h-4 w-4" />
                הוסף עגלה
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="חיפוש עגלות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button onClick={() => { setViewMode('table'); localStorage.setItem('vazana-carts-viewMode', 'table') }} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="טבלה">
          <Table2 className="w-4 h-4" />
        </button>
        <button onClick={() => { setViewMode('grid'); localStorage.setItem('vazana-carts-viewMode', 'grid') }} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="כרטיסים">
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>

      {/* Carts */}
      {filteredCarts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2">לא נמצאו עגלות</p>
              <p className="text-sm">
                {searchTerm ? "נסה לשנות את מילות החיפוש" : "הוסף עגלה ראשונה כדי להתחיל"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-right font-hebrew font-medium text-gray-600">שם</th>
                <th className="px-4 py-2 text-right font-hebrew font-medium text-gray-600">לוחית רישוי</th>
                <th className="px-4 py-2 text-right font-hebrew font-medium text-gray-600 hidden md:table-cell">פרטים</th>
                <th className="px-4 py-2 text-center font-hebrew font-medium text-gray-600 w-20">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCarts.map((cart, idx) => (
                <tr key={cart.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-2 font-hebrew font-medium">{cart.name}</td>
                  <td className="px-4 py-2 font-mono text-gray-600">{cart.license_plate || "—"}</td>
                  <td className="px-4 py-2 text-gray-600 hidden md:table-cell">{cart.details || "—"}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCart(cart); setEditModalOpen(true) }}>
                        <Edit className="w-3.5 h-3.5 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCart(cart.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCarts.map((cart) => (
            <Card key={cart.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 rounded"><ShoppingCart className="h-4 w-4 text-orange-600" /></div>
                    <div>
                      <p className="font-hebrew font-semibold">{cart.name}</p>
                      {cart.license_plate && <p className="text-xs font-mono text-gray-500">{cart.license_plate}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCart(cart); setEditModalOpen(true) }}>
                      <Edit className="w-3.5 h-3.5 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCart(cart.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
                {cart.details && <p className="text-sm text-gray-600">{cart.details}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CartEditModal
        cart={editingCart}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onCartUpdated={(updatedCart) => {
          setCarts(carts.map(c => c.id === updatedCart.id ? { ...c, ...updatedCart } : c))
          setEditingCart(null)
        }}
      />
    </div>
  )
}
