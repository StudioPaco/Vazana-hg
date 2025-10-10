import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // For API routes, we'll use a default user approach
    const userId = "00000000-0000-0000-0000-000000000001" // Sample user UUID that matches our sample data

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .or(`created_by_id.eq.${userId},is_sample.eq.true`)
      .order("created_date", { ascending: true }) // Show oldest first, newest at bottom

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: jobs })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Use default user for API routes
    const defaultUser = { id: "00000000-0000-0000-0000-000000000001", email: "admin@example.com" }

    const body = await request.json()

    // Generate job number if not provided
    const jobNumber = body.job_number || `${Date.now().toString().slice(-4)}`

    // Validate required fields
    const requiredFields = ['work_type', 'job_date', 'shift_type', 'site', 'city', 'client_name', 'worker_name', 'worker_id', 'vehicle_name', 'vehicle_id']
    const missingFields = requiredFields.filter(field => !body[field] || body[field] === '')
    
    if (missingFields.length > 0) {
      console.error('[v0] Missing required fields:', missingFields)
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missing_fields: missingFields 
      }, { status: 400 })
    }

    // Validate shift_type values
    if (!['day', 'night', 'double'].includes(body.shift_type)) {
      return NextResponse.json({ 
        error: `Invalid shift_type: ${body.shift_type}. Must be one of: day, night, double` 
      }, { status: 400 })
    }

    // Validate payment_status if provided
    if (body.payment_status && !['ממתין', 'בוצע', 'לתשלום', 'שולם'].includes(body.payment_status)) {
      return NextResponse.json({ 
        error: `Invalid payment_status: ${body.payment_status}. Must be one of: ממתין, בוצע, לתשלום, שולם` 
      }, { status: 400 })
    }

    const jobData = {
      ...body,
      job_number: jobNumber,
      // created_by_id: defaultUser.id, // Temporarily removed to avoid foreign key constraint
      created_by: defaultUser.email,
      // Let database handle timestamps with DEFAULT NOW()
      is_sample: true,
    }

    console.log('[v0] Creating job with data:', JSON.stringify(jobData, null, 2))

    const { data: job, error } = await supabase.from("jobs").insert([jobData]).select().single()

    if (error) {
      console.error('[v0] Supabase error creating job:', error)
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code 
      }, { status: 500 })
    }

    return NextResponse.json({ data: job }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
