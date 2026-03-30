"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, FileText, Calendar, User, Calculator, CheckCircle, RotateCcw } from "lucide-react"
import Link from "next/link"
// Sidebar handled by (app) layout
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import DatabaseDropdown from "@/components/ui/database-dropdown"
import PageLayout from "@/components/layout/page-layout"
import InvoicePreviewModal from "@/components/invoices/invoice-preview-modal"
import { SimpleAutoSave } from "@/lib/simple-auto-save"

interface Client {
  id: string
  company_name: string
  contact_person: string
  address: string
  city: string
  email: string
  phone: string
}

interface Job {
  id: string
  job_number: string
  client_name: string
  client_id: string
  work_type: string
  job_date: string
  site: string
  city: string
  total_amount: number
  payment_status: string
  selected?: boolean
}

interface InvoiceLineItem {
  job_id: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
  work_type: string
  job_date: string
  site_location: string
}

interface InvoiceSummary {
  subtotal: number
  tax_amount: number
  total_amount: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const autoSave = new SimpleAutoSave('new-invoice-draft', 15)
  
  // Invoice number
  const [invoiceNumber, setInvoiceNumber] = useState("")

  // Form state
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("נטו 30")
  const [includeBankDetails, setIncludeBankDetails] = useState(true)
  const [showOlderJobs, setShowOlderJobs] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  // Data state
  const [clients, setClients] = useState<Client[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [summary, setSummary] = useState<InvoiceSummary>({ subtotal: 0, tax_amount: 0, total_amount: 0 })
  
  // Loading states
  const [clientsLoading, setClientsLoading] = useState(true)
  const [jobsLoading, setJobsLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [manualItems, setManualItems] = useState<{ description: string; quantity: number; unit_price: number }[]>(() => {
    // Load from localStorage with 15 min timeout
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vazana-manual-invoice-items')
      if (saved) {
        try {
          const { items, timestamp } = JSON.parse(saved)
          if (Date.now() - timestamp < 15 * 60 * 1000) return items
          localStorage.removeItem('vazana-manual-invoice-items')
        } catch {}
      }
    }
    return []
  })

  const addManualItem = () => {
    setManualItems(prev => [...prev, { description: "", quantity: 1, unit_price: 0 }])
  }

  const updateManualItem = (index: number, field: string, value: string | number) => {
    setManualItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const removeManualItem = (index: number) => {
    setManualItems(prev => prev.filter((_, i) => i !== index))
  }

  const manualTotal = manualItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  // Recalculate summary and persist when manual items change
  useEffect(() => {
    calculateSummary(jobs, manualItems)
    if (manualItems.length > 0) {
      localStorage.setItem('vazana-manual-invoice-items', JSON.stringify({ items: manualItems, timestamp: Date.now() }))
    } else {
      localStorage.removeItem('vazana-manual-invoice-items')
    }
  }, [manualItems])
  const [lastSearchedClient, setLastSearchedClient] = useState("")
  const [lastSearchedMonth, setLastSearchedMonth] = useState("")
  
  // Auto-save on form data changes - include full session state
  useEffect(() => {
    // Only save if we have meaningful data (not just initial state)
    if (selectedClient || selectedMonth || notes || searchPerformed) {
      autoSave.save({
        selectedClient,
        selectedMonth,
        notes,
        paymentTerms,
        includeBankDetails,
        showOlderJobs,
        jobs,
        summary,
        searchPerformed,
        lastSearchedClient,
        lastSearchedMonth
      })
    }
  }, [selectedClient, selectedMonth, notes, paymentTerms, includeBankDetails, showOlderJobs, jobs, summary, searchPerformed, lastSearchedClient, lastSearchedMonth])

  // Generate current month and 5 previous months
  const generateMonths = () => {
    const months = []
    const now = new Date()
    const monthNames = [
      "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
      "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    ]
    
    // Start from current month and go back 5 months
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1 // getMonth() returns 0-11, we need 1-12
      
      const value = `${year}-${month.toString().padStart(2, '0')}`
      const label = `${monthNames[month - 1]} ${year}`
      months.push({ value, label })
    }
    
    return months
  }
  
  const months = generateMonths()
  
  // Load auto-save setting from localStorage
  useEffect(() => {
    const autoSave = localStorage.getItem('vazana-auto-save-forms')
    if (autoSave !== null) {
      setAutoSaveEnabled(autoSave === 'true')
    }
  }, [])
  
  // Reset timeout when user visits the form
  useEffect(() => {
    autoSave.resetTimeout()
  }, [])
  
  // Load saved data on mount - restore full session state
  useEffect(() => {
    const savedData = autoSave.load()
    if (savedData && savedData.searchPerformed) {
      // Restore form selections
      if (savedData.selectedClient) setSelectedClient(savedData.selectedClient)
      if (savedData.selectedMonth) setSelectedMonth(savedData.selectedMonth)
      if (savedData.notes) setNotes(savedData.notes)
      if (savedData.paymentTerms) setPaymentTerms(savedData.paymentTerms)
      if (typeof savedData.includeBankDetails === 'boolean') setIncludeBankDetails(savedData.includeBankDetails)
      if (typeof savedData.showOlderJobs === 'boolean') setShowOlderJobs(savedData.showOlderJobs)
      
      // Restore search results and state
      if (savedData.jobs) setJobs(savedData.jobs)
      if (savedData.summary) setSummary(savedData.summary)
      if (savedData.searchPerformed) setSearchPerformed(savedData.searchPerformed)
      if (savedData.lastSearchedClient) setLastSearchedClient(savedData.lastSearchedClient)
      if (savedData.lastSearchedMonth) setLastSearchedMonth(savedData.lastSearchedMonth)
      
      console.log('Loaded auto-saved invoice form data with full session state')
    }
  }, [])
  
  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, company_name, contact_person, address, city, email, phone')
          .eq('status', 'active')
          .order('company_name')
        
        if (error) throw error
        setClients(data || [])
      } catch (error) {
        console.error('Failed to fetch clients:', error)
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת רשימת הלקוחות",
          variant: "destructive",
        })
      } finally {
        setClientsLoading(false)
      }
    }
    
    fetchClients()

    // Generate next invoice number
    const fetchInvoiceNumber = async () => {
      const { data } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
      const lastNum = data?.[0]?.invoice_number
      const num = lastNum ? parseInt(lastNum.replace(/\D/g, '')) + 1 : 1
      setInvoiceNumber(String(num).padStart(4, '0'))
    }
    fetchInvoiceNumber()
  }, [])
  
  // Fetch jobs when client and month are selected
  const fetchJobs = async () => {
    if (!selectedClient || !selectedMonth) return

    setJobsLoading(true)
    setSearchPerformed(true)
    setLastSearchedClient(selectedClient)
    setLastSearchedMonth(selectedMonth)
    try {
      const [year, month] = selectedMonth.split('-')
      const startDate = `${year}-${month}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0] // Last day of month
      
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_number, client_name, client_id, work_type, job_date, site, city, total_amount, payment_status')
        .eq('client_id', selectedClient)
        .gte('job_date', startDate)
        .lte('job_date', endDate)
        .order('job_date')
      
      if (error) throw error
      
      const jobsWithSelection = (data || []).map(job => ({ ...job, selected: true }))
      setJobs(jobsWithSelection)
      calculateSummary(jobsWithSelection)
      
      // Check for older jobs
      checkOlderJobs()
      
      // Show message if no jobs found
      if (jobsWithSelection.length === 0) {
        // Set jobs to an empty array to show the "no results" UI
        setJobs([])
        toast({
          title: "חיפוש הושלם",
          description: `לא נמצאו עבודות עבור הלקוח בחודש שנבחר`,
        })
      }
      
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת העבודות",
        variant: "destructive",
      })
    } finally {
      setJobsLoading(false)
    }
  }
  
  // Calculate invoice summary
  const calculateSummary = (jobsList: Job[], manualItemsList?: typeof manualItems) => {
    const selectedJobs = jobsList.filter(job => job.selected)
    const jobsSubtotal = selectedJobs.reduce((sum, job) => sum + (job.total_amount || 0), 0)
    const items = manualItemsList ?? manualItems
    const manualSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const subtotal = jobsSubtotal + manualSubtotal
    const tax_amount = subtotal * 0.18 // 18% VAT
    const total_amount = subtotal + tax_amount

    setSummary({ subtotal, tax_amount, total_amount })
  }
  
  // Check if there are older jobs that haven't been invoiced
  const [hasOlderJobs, setHasOlderJobs] = useState(false)
  
  // Fetch older jobs that haven't been invoiced
  const fetchOlderJobs = async () => {
    if (!selectedClient || !selectedMonth) return
    
    try {
      let query = supabase
        .from('jobs')
        .select('id, job_number, client_name, client_id, work_type, job_date, site, city, total_amount, payment_status')
        .eq('client_id', selectedClient)
        .lt('job_date', `${selectedMonth}-01`)
        .order('job_date', { ascending: false })
      
      // Try to add invoice_id filter if column exists
      try {
        query = query.is('invoice_id', null) // Jobs that haven't been invoiced yet
      } catch {
        console.log('invoice_id column not found, fetching all older jobs')
      }
        
      const { data, error } = await query
      
      if (error) {
        console.warn('Could not fetch older jobs:', error)
        toast({
          title: "השגיאה",
          description: "לא ניתן לטעון עבודות ישנות - אולי אין נתונים",
          variant: "destructive",
        })
        return
      }
      
      const olderJobsWithSelection = (data || []).map(job => ({ ...job, selected: false }))
      
      if (olderJobsWithSelection.length === 0) {
        toast({
          title: "לא נמצאו עבודות ישנות",
          description: "אין עבודות מוקדמות שלא חויבו עבור לקוח זה",
        })
        return
      }
      
      // Add older jobs to the existing jobs list
      const combinedJobs = [...jobs, ...olderJobsWithSelection]
      setJobs(combinedJobs)
      calculateSummary(combinedJobs)
      
      toast({
        title: "נטענו עבודות ישנות",
        description: `נוספו ${olderJobsWithSelection.length} עבודות מוקדמות לרשימה`,
      })
      
    } catch (error) {
      console.error('Failed to fetch older jobs:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה כללית בטעינת עבודות ישנות",
        variant: "destructive",
      })
    }
  }
  
  // Check if older jobs exist without fetching them
  const checkOlderJobs = async () => {
    if (!selectedClient || !selectedMonth) return
    
    try {
      // Try to check for older jobs - if invoice_id column doesn't exist, fallback to simpler query
      let query = supabase
        .from('jobs')
        .select('id')
        .eq('client_id', selectedClient)
        .lt('job_date', `${selectedMonth}-01`)
        .limit(1)
      
      // Try to add invoice_id filter if column exists
      try {
        query = query.is('invoice_id', null)
      } catch {
        // If invoice_id column doesn't exist, continue without this filter
        console.log('invoice_id column not found, checking for older jobs without invoice filter')
      }
        
      const { data, error } = await query
      
      if (error) {
        // If there's still an error, just assume no older jobs exist
        console.warn('Could not check for older jobs:', error)
        setHasOlderJobs(false)
        return
      }
      
      setHasOlderJobs((data || []).length > 0)
      
    } catch (error) {
      console.warn('Failed to check older jobs - assuming none exist:', error)
      setHasOlderJobs(false)
    }
  }
  
  // Preview invoice
  const previewInvoice = () => {
    const selectedJobs = jobs.filter(job => job.selected)
    if (selectedJobs.length === 0 && manualItems.length === 0) {
      toast({
        title: "שגיאה",
        description: "יש לבחור עבודה או להוסיף שורה ידנית",
        variant: "destructive",
      })
      return
    }

    setShowPreview(true)
  }
  
  // Toggle job selection
  const toggleJobSelection = (jobId: string) => {
    const updatedJobs = jobs.map(job =>
      job.id === jobId ? { ...job, selected: !job.selected } : job
    )
    setJobs(updatedJobs)
    calculateSummary(updatedJobs, manualItems)
  }
  
  // Create invoice
  const createInvoice = async () => {
    const selectedJobs = jobs.filter(job => job.selected)
    const validManual = manualItems.filter(i => i.description && i.unit_price > 0)
    if (selectedJobs.length === 0 && validManual.length === 0) {
      toast({
        title: "שגיאה",
        description: "יש לבחור עבודה או להוסיף שורה ידנית",
        variant: "destructive",
      })
      return
    }
    
    setCreating(true)
    try {
      // Create invoice
      const clientData = clients.find(c => c.id === selectedClient)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30) // 30 days from today
      
      const invoiceData = {
        client_id: selectedClient,
        invoice_number: invoiceNumber,
        status: 'draft',
        subtotal: summary.subtotal,
        tax_amount: summary.tax_amount,
        total_amount: summary.total_amount,
        currency: 'ILS',
        due_date: dueDate.toISOString().split('T')[0],
        notes,
        payment_terms: paymentTerms,
        // created_by handled by Supabase auth.uid() column default
      }
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()
      
      if (invoiceError) throw invoiceError
      
      // Create line items from jobs + manual items
      const jobLineItems = selectedJobs.map(job => ({
        invoice_id: invoice.id,
        job_id: job.id,
        description: `${job.work_type} - עבודה #${job.job_number}`,
        quantity: 1,
        unit_price: job.total_amount || 0,
        line_total: job.total_amount || 0,
        work_type: job.work_type,
        job_date: job.job_date,
        site_location: `${job.site}, ${job.city}`
      }))
      const manualLineItems = manualItems.filter(i => i.description && i.unit_price > 0).map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
        work_type: 'ידני',
        job_date: new Date().toISOString().split('T')[0],
        site_location: '',
      }))
      const allLineItems = [...jobLineItems, ...manualLineItems]

      if (allLineItems.length > 0) {
        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(allLineItems)
        if (lineItemsError) throw lineItemsError
      }
      
      toast({
        title: "הצלחה",
        description: "החשבונית נוצרה בהצלחה",
      })
      
      // Clear auto-save after successful invoice creation
      autoSave.clear()
      
      // Navigate to invoice view or back to invoices list
      router.push('/invoices')
      
    } catch (error) {
      console.error('Failed to create invoice:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת החשבונית",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <PageLayout
        title="הפקת חשבונית"
        subtitle="צור חשבונית חדשה עבור לקוח ותקופה נבחרת"
        titleIcon={FileText}
        backHref="/invoices"
        variant="form"
        maxWidth="6xl"
      >
          <div className="space-y-6" dir="rtl">
            {/* Invoice Number */}
            <div className="flex justify-end">
              <div className="text-sm text-gray-500 font-hebrew">
                <span>מספר חשבונית: </span><span className="text-teal-600 font-semibold">{invoiceNumber || '...'}</span>
              </div>
            </div>
            {/* Client and Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-hebrew" dir="rtl">
                  <User className="h-5 w-5 text-teal-600" />
                  <span>בחירת לקוח ותקופה</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-right block">לקוח *</label>
                  <DatabaseDropdown
                    data={clients}
                    displayField="company_name"
                    valueField="id"
                    value={selectedClient}
                    onValueChange={setSelectedClient}
                    placeholder="בחר לקוח..."
                    loading={clientsLoading}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-right block">חודש *</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth} dir="rtl">
                    <SelectTrigger className="text-right font-hebrew">
                      <SelectValue placeholder="בחר חודש" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value} className="text-right">
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-right block">&nbsp;</label>
                  <Button
                    onClick={fetchJobs}
                    disabled={!selectedClient || !selectedMonth || jobsLoading}
                    className="bg-teal-600 hover:bg-teal-700 text-white w-full"
                  >
                    {jobsLoading ? "טוען..." : "אסוף עבודות"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            {jobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew" dir="rtl">
                    <Calendar className="h-5 w-5 text-teal-600" />
                    <span>עבודות לחיוב ({jobs.filter(j => j.selected).length} נבחרו)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
                      <div className="text-right">בחירה</div>
                      <div className="text-right">מספר עבודה</div>
                      <div className="text-right">תאריך</div>
                      <div className="text-right">סוג עבודה</div>
                      <div className="text-right">אתר</div>
                      <div className="text-right">סכום (₪)</div>
                    </div>
                    {jobs.map((job) => (
                      <div key={job.id} className={`grid grid-cols-6 gap-4 text-sm py-3 border-b hover:bg-gray-50 transition-colors ${
                        job.selected ? 'bg-teal-50 border-teal-200' : ''
                      }`}>
                        <div className="text-right">
                          <Checkbox
                            checked={job.selected || false}
                            onCheckedChange={() => toggleJobSelection(job.id)}
                          />
                        </div>
                        <div className="text-right font-medium">#{job.job_number}</div>
                        <div className="text-right">{new Date(job.job_date).toLocaleDateString('he-IL')}</div>
                        <div className="text-right">{job.work_type}</div>
                        <div className="text-right">{job.site}, {job.city}</div>
                        <div className="text-right font-bold">₪{(job.total_amount || 0).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Older Jobs Checkbox - at bottom of job list */}
                  {jobs.length > 0 && (
                    <div className={`mt-6 p-3 rounded-lg border ${
                      hasOlderJobs 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3 justify-end">
                        <label htmlFor="showOlderJobs" className="text-sm font-medium text-right cursor-pointer">
                          הצג עבודות ישנות שלא חויבו
                        </label>
                        <Checkbox
                          id="showOlderJobs"
                          checked={showOlderJobs}
                          onCheckedChange={(checked) => {
                            setShowOlderJobs(checked as boolean)
                            if (checked) {
                              fetchOlderJobs()
                            } else {
                              // Remove older jobs and recalculate
                              const monthJobs = jobs.filter(job => {
                                const jobDate = new Date(job.job_date)
                                const selectedDate = selectedMonth ? new Date(`${selectedMonth}-01`) : new Date()
                                return jobDate >= selectedDate || jobDate.getMonth() === selectedDate.getMonth()
                              })
                              setJobs(monthJobs)
                              calculateSummary(monthJobs)
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* No Results Found */}
            {searchPerformed && !jobsLoading && jobs.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew" dir="rtl">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span>תוצאות חיפוש</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">לא נמצאו עבודות</h3>
                    <p className="text-gray-600">
                      לא נמצאו עבודות עבור {clients.find(c => c.id === lastSearchedClient)?.company_name || 'הלקוח'} ב{months.find(m => m.value === lastSearchedMonth)?.label || 'החודש שנבחר'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      נסה לבחור חודש אחר או לבדוק עבודות ישנות שלא חויבו
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-hebrew" dir="rtl">
                  <Calculator className="h-5 w-5 text-teal-600" />
                  <span>שורות ידניות</span>
                  <Button variant="outline" size="sm" onClick={addManualItem} className="mr-auto font-hebrew text-xs h-7">
                    + הוסף שורה
                  </Button>
                </CardTitle>
              </CardHeader>
              {manualItems.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 border-b pb-1">
                      <div className="col-span-6 text-right font-hebrew">תיאור</div>
                      <div className="col-span-2 text-right font-hebrew">כמות</div>
                      <div className="col-span-2 text-right font-hebrew">מחיר יחידה</div>
                      <div className="col-span-1 text-right font-hebrew">סה״כ</div>
                      <div className="col-span-1"></div>
                    </div>
                    {manualItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <input
                            value={item.description}
                            onChange={(e) => updateManualItem(i, 'description', e.target.value)}
                            placeholder="תיאור פריט..."
                            className="w-full border rounded px-2 py-1 text-sm text-right font-hebrew"
                            dir="rtl"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateManualItem(i, 'quantity', Number(e.target.value))}
                            className="w-full border rounded px-2 py-1 text-sm text-left"
                            min={1}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateManualItem(i, 'unit_price', Number(e.target.value))}
                            className="w-full border rounded px-2 py-1 text-sm text-left"
                            min={0}
                          />
                        </div>
                        <div className="col-span-1 text-sm font-medium text-right">
                          ₪{(item.quantity * item.unit_price).toLocaleString()}
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => removeManualItem(i)}>
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                    {manualTotal > 0 && (
                      <div className="text-left text-sm font-bold pt-2 border-t">
                        סה״כ שורות ידניות: ₪{manualTotal.toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Invoice Details */}
            {(jobs.length > 0 || manualItems.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew" dir="rtl">
                    <FileText className="h-5 w-5 text-teal-600" />
                    <span>פרטי החשבונית</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-right block">תנאי תשלום</label>
                      <Select value={paymentTerms} onValueChange={setPaymentTerms} dir="rtl">
                        <SelectTrigger className="text-right font-hebrew">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="נטו 30" className="text-right">נטו 30</SelectItem>
                          <SelectItem value="נטו 45" className="text-right">נטו 45</SelectItem>
                          <SelectItem value="נטו 60" className="text-right">נטו 60</SelectItem>
                          <SelectItem value="מיידי" className="text-right">מיידי</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-right block">הערות</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="הערות נוספות לחשבונית... (אופציונלי)"
                      className="text-right"
                      dir="rtl"
                      rows={3}
                    />
                  </div>
                  
                  {/* Bank Account Details Checkbox */}
                  <div className="flex items-center gap-3 justify-end">
                    <label htmlFor="includeBankDetails" className="text-sm font-medium text-right cursor-pointer">
                      כלול פרטי חשבון בנק (מומלץ)
                    </label>
                    <Checkbox
                      id="includeBankDetails"
                      checked={includeBankDetails}
                      onCheckedChange={(checked) => setIncludeBankDetails(checked as boolean)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {(jobs.length > 0 || manualItems.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-hebrew" dir="rtl">
                    <Calculator className="h-5 w-5 text-teal-600" />
                    <span>סיכום חשבונית</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end">
                  <div className="space-y-3 w-72" dir="rtl">
                    <div className="flex justify-between text-sm font-hebrew">
                      <span>סכום חלקי:</span>
                      <span>₪{summary.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-hebrew">
                      <span>מע״מ (18%):</span>
                      <span>₪{summary.tax_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t pt-2 font-hebrew">
                      <span>סכום כולל:</span>
                      <span>₪{summary.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                  </div>

                  <div className="mt-6 flex gap-4 justify-start">
                    <Button
                      onClick={createInvoice}
                      disabled={creating || jobs.filter(j => j.selected).length === 0}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                    >
                      {creating ? "יוצר חשבונית..." : "צור חשבונית"}
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('האם אתה בטוח שברצונך לאפס את כל הטיוטה השמורה? פעולה זו בלתי הפיכה.')) {
                          autoSave.clear()
                          // Reset all form fields to initial state
                          setSelectedClient("")
                          setSelectedMonth("")
                          setNotes("")
                          setPaymentTerms("נטו 30")
                          setIncludeBankDetails(true)
                          setShowOlderJobs(false)
                          setJobs([])
                          setSummary({ subtotal: 0, tax_amount: 0, total_amount: 0 })
                          setSearchPerformed(false)
                          setLastSearchedClient("")
                          setLastSearchedMonth("")
                          toast({ title: 'טיוטת החשבונית אופסה בהצלחה!', variant: 'success' })
                        }
                      }}
                      variant="outline"
                      className="px-4 text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      איפוס טיוטה
                    </Button>
                    <Button
                      onClick={previewInvoice}
                      disabled={jobs.filter(j => j.selected).length === 0 && manualItems.length === 0}
                      variant="outline"
                      className="px-8"
                    >
                      תצוגה מקדימה
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
      </PageLayout>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        selectedJobs={jobs.filter(job => job.selected)}
        manualItems={manualItems.filter(i => i.description && i.unit_price > 0)}
        clientName={clients.find(c => c.id === selectedClient)?.company_name || ""}
        summary={summary}
        notes={notes}
        paymentTerms={paymentTerms}
        includeBankDetails={includeBankDetails}
      />
    </>
  )
}
