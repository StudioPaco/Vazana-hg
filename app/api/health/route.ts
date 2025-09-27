import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    // Test database connection
    const supabase = createClient()
    const { data, error } = await supabase.from("business_settings").select("id").limit(1)

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: !error,
        error: error?.message || null,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    }

    return NextResponse.json(healthStatus)
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
