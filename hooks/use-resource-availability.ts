"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface AvailabilityResult {
  unavailableWorkerIds: Set<string>    // booked on that date (conflict)
  unavailableVehicleIds: Set<string>
  unavailableCartIds: Set<string>
  weeklyOffWorkerIds: Set<string>      // weekly schedule says "doesn't work"
  warnings: string[]
  busyDates: string[]
}

/**
 * Checks which workers/vehicles are unavailable for a given date + shift.
 * Returns sets of unavailable IDs, warning messages, and busy dates.
 */
export function useResourceAvailability(
  date: string,
  shiftType: string,
  workers: { id: string; name: string; availability?: Record<string, boolean> | null }[],
  vehicles: { id: string; name: string }[],
  selectedWorkerIds: string[],
  selectedVehicleIds: string[],
  selectedCartIds: string[] = [],
): AvailabilityResult {
  const [result, setResult] = useState<AvailabilityResult>({
    unavailableWorkerIds: new Set(),
    unavailableVehicleIds: new Set(),
    unavailableCartIds: new Set(),
    weeklyOffWorkerIds: new Set(),
    warnings: [],
    busyDates: [],
  })

  useEffect(() => {
    const check = async () => {
      const unavailableWorkers = new Set<string>()  // conflict (booked)
      const unavailableVehicles = new Set<string>()
      const unavailableCarts = new Set<string>()
      const weeklyOff = new Set<string>()           // weekly schedule says off
      const warnings: string[] = []

      if (!date && selectedWorkerIds.length === 0 && selectedVehicleIds.length === 0 && selectedCartIds.length === 0) {
        setResult({ unavailableWorkerIds: new Set(), unavailableVehicleIds: new Set(), unavailableCartIds: new Set(), weeklyOffWorkerIds: new Set(), warnings: [], busyDates: [] })
        return
      }

      const supabase = createClient()

      // 1. Check weekly availability grid for ALL workers (not just selected)
      if (date) {
        const jobDate = new Date(date)
        const dayIdx = jobDate.getDay()

        for (const worker of workers) {
          if (!worker.availability) continue
          const dayKey = `יום_${dayIdx}`
          const nightKey = `לילה_${dayIdx}`
          const shift = shiftType || 'יום'

          const shiftKey = shift === 'לילה' ? nightKey : dayKey
          if (worker.availability[shiftKey] === false) {
            weeklyOff.add(worker.id)
            if (selectedWorkerIds.includes(worker.id)) {
              const dayNames = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]
              warnings.push(`⚠️ ${worker.name} לא עובד ביום ${dayNames[dayIdx]} במשמרת ${shift}`)
            }
          }
        }

        // 2. Check existing job conflicts on the selected date
        const { data: dateJobs } = await supabase
          .from('jobs')
          .select('worker_id, vehicle_id, cart_id, worker_name, vehicle_name, cart_name, job_number, client_name')
          .eq('job_date', date)
          .eq('is_deleted', false)

        if (dateJobs) {
          for (const job of dateJobs) {
            if (job.worker_id) {
              unavailableWorkers.add(job.worker_id)
              if (selectedWorkerIds.includes(job.worker_id)) {
                const worker = workers.find(w => w.id === job.worker_id)
                warnings.push(`⚠️ ${worker?.name || job.worker_name} כבר משובץ (עבודה #${job.job_number} - ${job.client_name})`)
              }
            }
            if (job.vehicle_id) {
              unavailableVehicles.add(job.vehicle_id)
              if (selectedVehicleIds.includes(job.vehicle_id)) {
                const vehicle = vehicles.find(v => v.id === job.vehicle_id)
                warnings.push(`⚠️ ${vehicle?.name || job.vehicle_name} כבר בשימוש (עבודה #${job.job_number} - ${job.client_name})`)
              }
            }
            if (job.cart_id) {
              unavailableCarts.add(job.cart_id)
              if (selectedCartIds.includes(job.cart_id)) {
                warnings.push(`⚠️ ${job.cart_name || 'עגלה'} כבר בשימוש (עבודה #${job.job_number} - ${job.client_name})`)
              }
            }
          }

          // Also check job_resources for additional resource conflicts
          const jobIds = dateJobs.map(j => (j as any).id).filter(Boolean)
          if (jobIds.length > 0) {
            const { data: extraResources } = await supabase
              .from('job_resources')
              .select('resource_type, resource_id, resource_name')
              .in('job_id', jobIds)

            if (extraResources) {
              for (const r of extraResources) {
                if (r.resource_type === 'worker') {
                  unavailableWorkers.add(r.resource_id)
                  if (selectedWorkerIds.includes(r.resource_id)) {
                    warnings.push(`⚠️ ${r.resource_name} כבר משובץ כעובד נוסף בתאריך זה`)
                  }
                }
                if (r.resource_type === 'vehicle') {
                  unavailableVehicles.add(r.resource_id)
                  if (selectedVehicleIds.includes(r.resource_id)) {
                    warnings.push(`⚠️ ${r.resource_name} כבר בשימוש כרכב נוסף בתאריך זה`)
                  }
                }
                if (r.resource_type === 'cart') {
                  unavailableCarts.add(r.resource_id)
                  if (selectedCartIds.includes(r.resource_id)) {
                    warnings.push(`⚠️ ${r.resource_name} כבר בשימוש כעגלה נוספת בתאריך זה`)
                  }
                }
              }
            }
          }
        }
      }

      // 3. Compute busy dates for selected workers (next 30 days)
      const busyDates: string[] = []
      if (selectedWorkerIds.length > 0 && !date) {
        const today = new Date()
        const thirtyDaysLater = new Date(today)
        thirtyDaysLater.setDate(today.getDate() + 30)

        const { data: upcomingJobs } = await supabase
          .from('jobs')
          .select('job_date, worker_id')
          .in('worker_id', selectedWorkerIds)
          .gte('job_date', today.toISOString().split('T')[0])
          .lte('job_date', thirtyDaysLater.toISOString().split('T')[0])
          .eq('is_deleted', false)

        if (upcomingJobs) {
          const dates = [...new Set(upcomingJobs.map(j => j.job_date))].sort()
          busyDates.push(...dates.map(d => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })))
        }
      }

      setResult({ unavailableWorkerIds: unavailableWorkers, unavailableVehicleIds: unavailableVehicles, unavailableCartIds: unavailableCarts, weeklyOffWorkerIds: weeklyOff, warnings, busyDates })
    }

    const timeout = setTimeout(check, 300) // debounce
    return () => clearTimeout(timeout)
  }, [date, shiftType, workers, vehicles, selectedWorkerIds, selectedVehicleIds, selectedCartIds])

  return result
}
