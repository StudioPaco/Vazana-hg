"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, FileText, Calendar, User, Calculator, CheckCircle } from "lucide-react"
import Link from "next/link"
import SidebarNavigation, { MainContent } from "@/components/layout/sidebar-navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import DatabaseDropdown from "@/components/ui/database-dropdown"
import { BackButton } from "@/components/ui/back-button"
import InvoicePreviewModal from "@/components/invoices/invoice-preview-modal"

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
  const [lastSearchedClient, setLastSearchedClient] = useState("")
  const [lastSearchedMonth, setLastSearchedMonth] = useState("")

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
  const calculateSummary = (jobsList: Job[]) => {
    const selectedJobs = jobsList.filter(job => job.selected)
    const subtotal = selectedJobs.reduce((sum, job) => sum + (job.total_amount || 0), 0)
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
    if (selectedJobs.length === 0) {
      toast({
        title: "שגיאה",
        description: "יש לבחור לפחות עבודה אחת",
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
    calculateSummary(updatedJobs)
  }
  
  // Create invoice
  const createInvoice = async () => {
    const selectedJobs = jobs.filter(job => job.selected)
    if (selectedJobs.length === 0) {
      toast({
        title: "שגיאה",
        description: "יש לבחור לפחות עבודה אחת",
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
        status: 'draft',
        subtotal: summary.subtotal,
        tax_amount: summary.tax_amount,
        total_amount: summary.total_amount,
        currency: 'ILS',
        due_date: dueDate.toISOString().split('T')[0],
        notes,
        payment_terms: paymentTerms,
        created_by: 'root' // Will be updated with proper auth
      }
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()
      
      if (invoiceError) throw invoiceError
      
      // Create line items
      const lineItems = selectedJobs.map(job => ({
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
      
      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItems)
      
      if (lineItemsError) throw lineItemsError
      
      toast({
        title: "הצלחה",
        description: "החשבונית נוצרה בהצלחה",
      })
      
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
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <MainContent>
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="relative mb-6">
            <div className="absolute top-0 right-0 text-right z-10">
              <h1 className="text-2xl font-bold text-gray-900">הפקת חשבונית</h1>
              <p className="text-gray-600">צור חשבונית חדשה עבור לקוח ותקופה נבחרת</p>
            </div>
            <div className="absolute top-0 left-0 z-10">
              <BackButton href="/invoices" />
            </div>
            <div className="h-16"></div>
          </div>

          <div className="space-y-6">
            {/* Client and Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
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
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="text-right">
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
                    {jobsLoading ? "טוען..." : "הביא עבודות"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            {jobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
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
                  <CardTitle className="flex items-center justify-between">
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

            {/* Invoice Details */}
            {jobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <FileText className="h-5 w-5 text-teal-600" />
                    <span>פרטי החשבונית</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-right block">תנאי תשלום</label>
                      <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                        <SelectTrigger className="text-right">
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
                      onCheckedChange={setIncludeBankDetails}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {jobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <Calculator className="h-5 w-5 text-teal-600" />
                    <span>סיכום חשבונית</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <div>₪{summary.subtotal.toLocaleString()}</div>
                      <div>סכום חלקי:</div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>₪{summary.tax_amount.toLocaleString()}</div>
                      <div>מע"מ (18%):</div>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t pt-2">
                      <div>₪{summary.total_amount.toLocaleString()}</div>
                      <div>סכום כולל:</div>
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
                      onClick={previewInvoice}
                      disabled={jobs.filter(j => j.selected).length === 0}
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
        </div>
      </MainContent>
      <SidebarNavigation />
      
      {/* Invoice Preview Modal */}
      <InvoicePreviewModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        selectedJobs={jobs.filter(job => job.selected)}
        clientName={clients.find(c => c.id === selectedClient)?.company_name || ""}
        summary={summary}
        notes={notes}
        paymentTerms={paymentTerms}
        includeBankDetails={includeBankDetails}
      />
    </div>
  )
}
