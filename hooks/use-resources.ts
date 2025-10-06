import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

// Resource types
export interface Vehicle {
  id: string
  name: string
  license_plate: string
  details?: string
  is_active: boolean
}

export interface Worker {
  id: string
  name: string
  phone_number: string
  address?: string
  shift_rate: number
  payment_terms_days: number
  notes?: string
  is_active: boolean
}

export interface Cart {
  id: string
  name: string
  details?: string
  is_active: boolean
}

export interface WorkType {
  id: string
  name_he: string
  name_en: string
  is_active: boolean
}

// Hook for managing vehicles
export function useVehiclesResource() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles")
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to fetch vehicles")
      setVehicles(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
      console.error("Error fetching vehicles:", err)
    } finally {
      setLoading(false)
    }
  }

  const addVehicle = async (vehicle: Omit<Vehicle, "id" | "is_active">) => {
    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicle),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to add vehicle")
      await fetchVehicles() // Refresh the list
      return result
    } catch (err) {
      console.error("Error adding vehicle:", err)
      throw err
    }
  }

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      const response = await fetch("/api/vehicles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update vehicle")
      await fetchVehicles() // Refresh the list
      return result
    } catch (err) {
      console.error("Error updating vehicle:", err)
      throw err
    }
  }

  const deleteVehicle = async (id: string) => {
    try {
      const response = await fetch(`/api/vehicles?id=${id}`, {
        method: "DELETE",
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to delete vehicle")
      await fetchVehicles() // Refresh the list
      return result
    } catch (err) {
      console.error("Error deleting vehicle:", err)
      throw err
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  return {
    vehicles,
    loading,
    error,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    refresh: fetchVehicles,
  }
}

// Hook for managing workers
export function useWorkersResource() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchWorkers = async () => {
    try {
      const response = await fetch("/api/workers")
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to fetch workers")
      setWorkers(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
      console.error("Error fetching workers:", err)
    } finally {
      setLoading(false)
    }
  }

  const addWorker = async (worker: Omit<Worker, "id" | "is_active">) => {
    try {
      const response = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(worker),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to add worker")
      await fetchWorkers() // Refresh the list
      return result
    } catch (err) {
      console.error("Error adding worker:", err)
      throw err
    }
  }

  const updateWorker = async (id: string, updates: Partial<Worker>) => {
    try {
      const response = await fetch("/api/workers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update worker")
      await fetchWorkers() // Refresh the list
      return result
    } catch (err) {
      console.error("Error updating worker:", err)
      throw err
    }
  }

  const deleteWorker = async (id: string) => {
    try {
      const response = await fetch(`/api/workers?id=${id}`, {
        method: "DELETE",
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to delete worker")
      await fetchWorkers() // Refresh the list
      return result
    } catch (err) {
      console.error("Error deleting worker:", err)
      throw err
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [])

  return {
    workers,
    loading,
    error,
    addWorker,
    updateWorker,
    deleteWorker,
    refresh: fetchWorkers,
  }
}

// Hook for managing carts
export function useCartsResource() {
  const [carts, setCarts] = useState<Cart[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCarts = async () => {
    try {
      const response = await fetch("/api/carts")
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to fetch carts")
      setCarts(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
      console.error("Error fetching carts:", err)
    } finally {
      setLoading(false)
    }
  }

  const addCart = async (cart: Omit<Cart, "id" | "is_active">) => {
    try {
      const response = await fetch("/api/carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to add cart")
      await fetchCarts() // Refresh the list
      return result
    } catch (err) {
      console.error("Error adding cart:", err)
      throw err
    }
  }

  const updateCart = async (id: string, updates: Partial<Cart>) => {
    try {
      const response = await fetch("/api/carts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update cart")
      await fetchCarts() // Refresh the list
      return result
    } catch (err) {
      console.error("Error updating cart:", err)
      throw err
    }
  }

  const deleteCart = async (id: string) => {
    try {
      const response = await fetch(`/api/carts?id=${id}`, {
        method: "DELETE",
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to delete cart")
      await fetchCarts() // Refresh the list
      return result
    } catch (err) {
      console.error("Error deleting cart:", err)
      throw err
    }
  }

  useEffect(() => {
    fetchCarts()
  }, [])

  return {
    carts,
    loading,
    error,
    addCart,
    updateCart,
    deleteCart,
    refresh: fetchCarts,
  }
}

// Hook for managing work types
export function useWorkTypesResource() {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchWorkTypes = async () => {
    try {
      const response = await fetch("/api/work-types")
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to fetch work types")
      setWorkTypes(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
      console.error("Error fetching work types:", err)
    } finally {
      setLoading(false)
    }
  }

  const addWorkType = async (workType: Omit<WorkType, "id" | "is_active">) => {
    try {
      const response = await fetch("/api/work-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workType),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to add work type")
      await fetchWorkTypes() // Refresh the list
      return result
    } catch (err) {
      console.error("Error adding work type:", err)
      throw err
    }
  }

  const updateWorkType = async (id: string, updates: Partial<WorkType>) => {
    try {
      const response = await fetch("/api/work-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update work type")
      await fetchWorkTypes() // Refresh the list
      return result
    } catch (err) {
      console.error("Error updating work type:", err)
      throw err
    }
  }

  const deleteWorkType = async (id: string) => {
    try {
      const response = await fetch(`/api/work-types?id=${id}`, {
        method: "DELETE",
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to delete work type")
      await fetchWorkTypes() // Refresh the list
      return result
    } catch (err) {
      console.error("Error deleting work type:", err)
      throw err
    }
  }

  useEffect(() => {
    fetchWorkTypes()
  }, [])

  return {
    workTypes,
    loading,
    error,
    addWorkType,
    updateWorkType,
    deleteWorkType,
    refresh: fetchWorkTypes,
  }
}