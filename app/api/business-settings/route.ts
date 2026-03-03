import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from("business_settings")
      .select("*")
      .limit(1)
      .single()

    if (error) {
      // No row yet — return empty object so the UI can still render
      if (error.code === "PGRST116") {
        return NextResponse.json({ data: null })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await request.json()

    const settingsData = {
      company_name: body.company_name ?? null,
      company_email: body.company_email ?? null,
      registration_number: body.registration_number ?? null,
      address: body.address ?? null,
      phone: body.phone ?? null,
      bank_account_name: body.bank_account_name ?? null,
      bank_name: body.bank_name ?? null,
      bank_branch: body.bank_branch ?? null,
      bank_account_number: body.bank_account_number ?? null,
      updated_at: new Date().toISOString(),
    }

    // Try to get existing row first
    const { data: existing } = await supabase
      .from("business_settings")
      .select("id")
      .limit(1)
      .single()

    let result
    if (existing) {
      // Update existing row
      const { data, error } = await supabase
        .from("business_settings")
        .update(settingsData)
        .eq("id", existing.id)
        .select()
        .single()
      result = { data, error }
    } else {
      // Insert new row
      const { data, error } = await supabase
        .from("business_settings")
        .insert([settingsData])
        .select()
        .single()
      result = { data, error }
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ data: result.data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
