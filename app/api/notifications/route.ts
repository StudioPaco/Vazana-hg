import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { emailService } from "@/lib/email-service"

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
    const { type, jobId, recipientEmail, additionalData } = body

    // Get job details
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

    const jobData = {
      jobNumber: job.job_number,
      clientName: job.client_name,
      workerName: job.worker_name,
      jobDate: new Date(job.job_date).toLocaleDateString("he-IL"),
      site: job.site,
      workType: job.work_type,
      totalAmount: job.total_amount,
    }

    let result

    switch (type) {
      case "job_assignment":
        result = await emailService.sendJobAssignmentNotification(recipientEmail, jobData)
        break

      case "job_completion":
        result = await emailService.sendJobCompletionNotification(recipientEmail, jobData)
        break

      case "payment_reminder":
        const daysOverdue = additionalData?.daysOverdue || 0
        result = await emailService.sendPaymentReminder(recipientEmail, jobData, daysOverdue)
        break

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
