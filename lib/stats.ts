"use client"

import { createClient } from "@/lib/supabase/client"

// Types for stats
export interface JobStats {
  totalRevenue: number
  pendingJobs: number
  urgentJobs: number
  completedJobs: number
  monthlyRevenue: number
  weeklyJobs: number
  completionRate: number
}

export interface ClientStats {
  averageRates: {
    security: number
    installation: number
    combined: number
  }
  activeClientsCount: number
  leadingClient: {
    name: string
    monthlyIncome: number
    jobCount: number
  }
  pendingInvoices: number
  monthlyIncome: number
}

export interface DashboardStats {
  totalClients: number
  totalJobs: number
  totalWorkers: number
  totalVehicles: number
  pendingJobs: number
  completedJobs: number
  monthlyRevenue: number
  activeWorkers: number
  activeVehicles: number
  averageResponseTime: number // in hours
}

// Helper function to get current month start/end
const getCurrentMonthRange = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: startOfMonth.toISOString().split('T')[0],
    end: endOfMonth.toISOString().split('T')[0]
  }
}

// Helper function to get current week range
const getCurrentWeekRange = () => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // End of week (Saturday)
  
  return {
    start: startOfWeek.toISOString().split('T')[0],
    end: endOfWeek.toISOString().split('T')[0]
  }
}

// Job-related stats
export async function getJobStats(): Promise<JobStats> {
  try {
    const supabase = createClient()
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange()
    const { start: weekStart, end: weekEnd } = getCurrentWeekRange()
    
    // Fetch all jobs
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('total_amount, payment_status, job_status, job_date, created_at')
      .not('is_deleted', 'eq', true)
    
    if (error) throw error
    
    const totalRevenue = jobs?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0
    const pendingJobs = jobs?.filter(job => job.job_status === 'ממתין' || job.job_status === 'בתהליך').length || 0
    const urgentJobs = jobs?.filter(job => job.job_status === 'דחוף').length || 0
    const completedJobs = jobs?.filter(job => job.job_status === 'הושלם').length || 0
    
    // Monthly revenue (jobs completed this month)
    const monthlyRevenue = jobs?.filter(job => 
      job.job_date >= monthStart && job.job_date <= monthEnd && job.payment_status === 'paid'
    ).reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0
    
    // Weekly jobs
    const weeklyJobs = jobs?.filter(job => 
      job.job_date >= weekStart && job.job_date <= weekEnd
    ).length || 0
    
    // Completion rate
    const totalJobsCount = jobs?.length || 0
    const completionRate = totalJobsCount > 0 ? (completedJobs / totalJobsCount) * 100 : 0
    
    return {
      totalRevenue,
      pendingJobs,
      urgentJobs,
      completedJobs,
      monthlyRevenue,
      weeklyJobs,
      completionRate: Math.round(completionRate)
    }
  } catch (error) {
    console.error('Error fetching job stats:', error)
    return {
      totalRevenue: 0,
      pendingJobs: 0,
      urgentJobs: 0,
      completedJobs: 0,
      monthlyRevenue: 0,
      weeklyJobs: 0,
      completionRate: 0
    }
  }
}

// Client-related stats
export async function getClientStats(): Promise<ClientStats> {
  try {
    const supabase = createClient()
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange()
    
    // Fetch all clients
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, company_name, security_rate, installation_rate, status')
    
    if (error) throw error
    
    const activeClients = clients?.filter(client => client.status === 'active') || []
    const activeClientsCount = activeClients.length
    
    // Calculate average rates
    const validSecurityRates = activeClients.filter(client => client.security_rate > 0)
    const validInstallationRates = activeClients.filter(client => client.installation_rate > 0)
    
    const avgSecurity = validSecurityRates.length > 0 
      ? Math.round(validSecurityRates.reduce((sum, client) => sum + client.security_rate, 0) / validSecurityRates.length)
      : 0
      
    const avgInstallation = validInstallationRates.length > 0
      ? Math.round(validInstallationRates.reduce((sum, client) => sum + client.installation_rate, 0) / validInstallationRates.length)
      : 0
    
    const avgCombined = Math.round((avgSecurity + avgInstallation) / 2)
    
    // Get jobs for client income calculation
    const { data: jobs } = await supabase
      .from('jobs')
      .select('client_id, client_name, total_amount, job_date, payment_status')
      .gte('job_date', monthStart)
      .lte('job_date', monthEnd)
      .eq('payment_status', 'paid')
    
    // Calculate leading client by monthly income
    const clientIncome: { [key: string]: { name: string, income: number, jobCount: number } } = {}
    
    jobs?.forEach(job => {
      if (!clientIncome[job.client_id]) {
        clientIncome[job.client_id] = {
          name: job.client_name,
          income: 0,
          jobCount: 0
        }
      }
      clientIncome[job.client_id].income += job.total_amount || 0
      clientIncome[job.client_id].jobCount += 1
    })
    
    let leadingClient = { name: 'אין נתונים', monthlyIncome: 0, jobCount: 0 }
    let maxIncome = 0
    
    Object.values(clientIncome).forEach(client => {
      if (client.income > maxIncome) {
        maxIncome = client.income
        leadingClient = {
          name: client.name,
          monthlyIncome: client.income,
          jobCount: client.jobCount
        }
      }
    })
    
    // Get pending invoices count (receipts with draft status)
    const { data: receipts } = await supabase
      .from('receipts')
      .select('id')
      .eq('status', 'draft')
    
    const pendingInvoices = receipts?.length || 0
    
    // Monthly income (total from paid jobs this month)
    const monthlyIncome = jobs?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0
    
    return {
      averageRates: {
        security: avgSecurity,
        installation: avgInstallation,
        combined: avgCombined
      },
      activeClientsCount,
      leadingClient,
      pendingInvoices,
      monthlyIncome
    }
  } catch (error) {
    console.error('Error fetching client stats:', error)
    return {
      averageRates: { security: 0, installation: 0, combined: 0 },
      activeClientsCount: 0,
      leadingClient: { name: 'אין נתונים', monthlyIncome: 0, jobCount: 0 },
      pendingInvoices: 0,
      monthlyIncome: 0
    }
  }
}

// Dashboard overview stats
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = createClient()
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange()
    
    // Fetch counts from all tables
    const [clientsRes, jobsRes, workersRes, vehiclesRes, receiptsRes] = await Promise.all([
      supabase.from('clients').select('id, status'),
      supabase.from('jobs').select('job_status, payment_status, total_amount, job_date, created_at').not('is_deleted', 'eq', true),
      supabase.from('workers').select('id, name'),
      supabase.from('vehicles').select('id, name'),
      supabase.from('receipts').select('id, status')
    ])
    
    const totalClients = clientsRes.data?.length || 0
    const totalJobs = jobsRes.data?.length || 0
    const totalWorkers = workersRes.data?.length || 0
    const totalVehicles = vehiclesRes.data?.length || 0
    
    const jobs = jobsRes.data || []
    const pendingJobs = jobs.filter(job => job.job_status === 'ממתין' || job.job_status === 'בתהליך').length
    const completedJobs = jobs.filter(job => job.job_status === 'הושלם').length
    
    // Monthly revenue
    const monthlyRevenue = jobs
      .filter(job => job.job_date >= monthStart && job.job_date <= monthEnd && job.payment_status === 'paid')
      .reduce((sum, job) => sum + (job.total_amount || 0), 0)
    
    // Active workers (workers assigned to jobs this month)
    const activeWorkerIds = new Set(jobs
      .filter(job => job.job_date >= monthStart && job.job_date <= monthEnd)
      .map(job => job.worker_id)
      .filter(Boolean))
    const activeWorkers = activeWorkerIds.size
    
    // Active vehicles (vehicles used in jobs this month)  
    const activeVehicleIds = new Set(jobs
      .filter(job => job.job_date >= monthStart && job.job_date <= monthEnd)
      .map(job => job.vehicle_id)
      .filter(Boolean))
    const activeVehicles = activeVehicleIds.size
    
    // Average response time (mock calculation - hours between job creation and assignment)
    const averageResponseTime = 2 // Mock value - would need job assignment timestamps
    
    return {
      totalClients,
      totalJobs,
      totalWorkers,
      totalVehicles,
      pendingJobs,
      completedJobs,
      monthlyRevenue,
      activeWorkers,
      activeVehicles,
      averageResponseTime
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalClients: 0,
      totalJobs: 0,
      totalWorkers: 0,
      totalVehicles: 0,
      pendingJobs: 0,
      completedJobs: 0,
      monthlyRevenue: 0,
      activeWorkers: 0,
      activeVehicles: 0,
      averageResponseTime: 0
    }
  }
}

// Get all stats at once
export async function getAllStats() {
  const [jobStats, clientStats, dashboardStats] = await Promise.all([
    getJobStats(),
    getClientStats(),
    getDashboardStats()
  ])
  
  return {
    jobs: jobStats,
    clients: clientStats, 
    dashboard: dashboardStats
  }
}