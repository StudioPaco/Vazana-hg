import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { jobs } = await request.json()

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: "No jobs provided" }, { status: 400 })
    }

    // Fetch existing jobs to determine next job number
    const { data: existingJobs } = await supabase
      .from("jobs")
      .select("job_number, is_deleted")

    const activeJobs = (existingJobs || []).filter((j: any) => !j.is_deleted)
    const highestNumber = activeJobs.length === 0
      ? 0
      : Math.max(...activeJobs.map((j: any) => parseInt(j.job_number) || 0))

    // Assign sequential job numbers and add required defaults
    const jobsWithNumbers = jobs.map((job: any, idx: number) => ({
      ...job,
      job_number: (highestNumber + idx + 1).toString().padStart(4, "0"),
      // Let database handle created_date/updated_date via DEFAULT NOW()
      // Let trigger handle user_id assignment
      is_sample: false,
    }))

    // Insert all jobs in a single batch
    const { data, error } = await supabase
      .from("jobs")
      .insert(jobsWithNumbers)
      .select()

    if (error) {
      console.error("Bulk import error:", error)

      // If batch fails, try one-by-one to identify which rows fail
      const results: { index: number; success: boolean; error?: string; data?: any }[] = []

      for (let i = 0; i < jobsWithNumbers.length; i++) {
        const { data: singleData, error: singleError } = await supabase
          .from("jobs")
          .insert([jobsWithNumbers[i]])
          .select()
          .single()

        if (singleError) {
          results.push({
            index: i,
            success: false,
            error: singleError.message,
          })
        } else {
          results.push({
            index: i,
            success: true,
            data: singleData,
          })
        }
      }

      const imported = results.filter((r) => r.success).length
      const errors = results
        .filter((r) => !r.success)
        .map((r) => ({ row: r.index + 1, error: r.error || "Unknown error" }))

      return NextResponse.json({
        imported,
        total: jobs.length,
        errors,
        partial: true,
      })
    }

    return NextResponse.json({
      imported: data?.length || 0,
      total: jobs.length,
      errors: [],
      partial: false,
    })
  } catch (error) {
    console.error("Import API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
