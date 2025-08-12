"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, ShoppingCart, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

interface Cart {
  id: string
  name: string
  details: string
}

export default function CartsPage() {
  const [carts, setCarts] = useState<Cart[]>([])
  const [filteredCarts, setFilteredCarts] = useState<Cart[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCarts = async () => {
      try {
        const response = await apiClient.getCarts()
        setCarts(response.data || [])
        setFilteredCarts(response.data || [])
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
    if (confirm("Are you sure you want to delete this cart?")) {
      try {
        // await apiClient.deleteCart(id)
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carts</h1>
          <p className="text-gray-600">עגלות - Manage your equipment carts</p>
        </div>
        <Button asChild>
          <Link href="/carts/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Cart
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search carts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Carts Grid */}
      {filteredCarts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2">No carts found</p>
              <p className="text-sm">
                {searchTerm ? "Try adjusting your search terms" : "Add your first cart to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCarts.map((cart) => (
            <Card key={cart.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{cart.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.details && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Details:</p>
                    <p className="text-sm text-gray-700">{cart.details}</p>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href={`/carts/${cart.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCart(cart.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
