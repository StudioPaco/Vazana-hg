import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calendarService } from "@/lib/calendar-service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { jobId } = body

    // Get job details with related data
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        clients:client_id(company_name, contact_person, email),
        workers:worker_id(name, phone_number)
      `)
      .eq("id", jobId)
      .eq("created_by_id", user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const jobCalendarData = {
      jobNumber: job.job_number,
      clientName: job.client_name,
      workerName: job.worker_name,
      workerEmail: job.workers?.phone_number, // You might want to add email field to workers
      jobDate: job.job_date,
      site: job.site,
      city: job.city,
      workType: job.work_type,
      shiftType: job.shift_type,
      notes: job.notes,
    }

    const result = await calendarService.createJobEvent(jobCalendarData)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Update job with calendar event ID
    if (result.data?.id) {
      await supabase
        .from("jobs")
        .update({ calendar_event_id: result.data.id })
        .eq("id", jobId)
        .eq("created_by_id", user.id)
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Calendar error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
