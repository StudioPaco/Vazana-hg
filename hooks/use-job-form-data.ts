"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export function useClients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("clients")
          .select("id, company_name, contact_person")
          .order("company_name", { ascending: true })

        if (error) {
          throw error
        }
        setClients(data || [])
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  return { clients, loading, error }
}

export function useWorkTypes() {
  const [workTypes, setWorkTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchWorkTypes = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("work_types")
          .select("id, name_he, name_en")
          .order("name_he", { ascending: true })

        if (error) {
          throw error
        }
        setWorkTypes(data || [])
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkTypes()
  }, [])

  return { workTypes, loading, error }
}

export function useWorkers() {
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("workers")
          .select("id, name, phone_number")
          .order("name", { ascending: true })

        if (error) {
          throw error
        }
        setWorkers(data || [])
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkers()
  }, [])

  return { workers, loading, error }
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, license_plate, name, details")
          .order("license_plate", { ascending: true })

        if (error) {
          throw error
        }
        setVehicles(data || [])
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  return { vehicles, loading, error }
}

export function useCarts() {
  const [carts, setCarts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchCarts = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("carts")
          .select("id, name, details")
          .order("name", { ascending: true })

        if (error) {
          throw error
        }
        setCarts(data || [])
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCarts()
  }, [])

  return { carts, loading, error }
}
