import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get existing jobs to include in sample invoices
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(10)

    if (jobsError) {
      return NextResponse.json({ error: `Failed to fetch jobs: ${jobsError.message}` }, { status: 500 })
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs found to create sample invoices' }, { status: 400 })
    }

    // Get clients to link invoices to
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5)

    if (clientsError || !clients || clients.length === 0) {
      return NextResponse.json({ error: 'No clients found to create sample invoices' }, { status: 400 })
    }

    const sampleInvoices = []
    const currentDate = new Date()

    // Create 3 sample invoices
    for (let i = 0; i < 3; i++) {
      const client = clients[i % clients.length]
      const invoiceDate = new Date(currentDate)
      invoiceDate.setDate(currentDate.getDate() - (i * 15)) // Space invoices 15 days apart

      const dueDate = new Date(invoiceDate)
      dueDate.setDate(invoiceDate.getDate() + 30) // 30 days payment terms

      // Select 2-4 jobs for this invoice
      const startIdx = i * 3
      const endIdx = Math.min(startIdx + 3, jobs.length)
      const invoiceJobs = jobs.slice(startIdx, endIdx)

      // Calculate totals
      const subtotal = invoiceJobs.reduce((sum, job) => sum + (parseFloat(job.total_amount) || 0), 0)
      const taxAmount = subtotal * 0.18 // 18% VAT
      const totalAmount = subtotal + taxAmount

      // Determine status
      let status = 'draft'
      if (i === 0) status = 'sent'
      if (i === 1) status = 'paid'
      if (i === 2) status = 'overdue'

      const invoiceData = {
        client_id: client.id,
        invoice_number: `INV-2025-${String(1000 + i).padStart(4, '0')}`,
        invoice_date: invoiceDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        status,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        currency: 'ILS',
        notes: `חשבונית דוגמה ${i + 1} - כוללת ${invoiceJobs.length} עבודות`,
        payment_terms: 'שוטף +30',
        created_by: 'admin@example.com'
      }

      console.log(`Creating sample invoice ${i + 1}:`, invoiceData)

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()

      if (invoiceError) {
        console.error(`Error creating sample invoice ${i + 1}:`, invoiceError)
        continue
      }

      // Create line items for this invoice
      const lineItems = invoiceJobs.map(job => ({
        invoice_id: invoice.id,
        job_id: job.id,
        description: `${job.work_type} - עבודה #${job.job_number}`,
        quantity: 1,
        unit_price: parseFloat(job.total_amount) || 0,
        line_total: parseFloat(job.total_amount) || 0,
        work_type: job.work_type,
        job_date: job.job_date,
        site_location: `${job.site}, ${job.city}`
      }))

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItems)

      if (lineItemsError) {
        console.error(`Error creating line items for invoice ${i + 1}:`, lineItemsError)
      }

      sampleInvoices.push({
        invoice,
        jobsCount: invoiceJobs.length,
        totalAmount: totalAmount.toFixed(2)
      })
    }

    return NextResponse.json({
      message: `Created ${sampleInvoices.length} sample invoices successfully`,
      data: sampleInvoices
    })

  } catch (error) {
    console.error('Error creating sample invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}