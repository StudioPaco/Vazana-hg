import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const diagnostics: Record<string, any> = {}

  try {
    const supabase = await createClient()

    // 1. Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    diagnostics.auth = {
      authenticated: !!user,
      userId: user?.id || null,
      authError: authError?.message || null,
    }

    if (!user) {
      return NextResponse.json({ diagnostics, error: "Not authenticated" })
    }

    // 2. Check clients table columns
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name_param: 'clients' })
    
    if (colError) {
      // Fallback: just try to read a client
      const { data: sampleClient, error: readError } = await supabase
        .from("clients")
        .select("*")
        .limit(1)
      
      diagnostics.columns = {
        error: colError.message,
        fallback_keys: sampleClient?.[0] ? Object.keys(sampleClient[0]) : null,
        readError: readError?.message || null,
      }
    } else {
      diagnostics.columns = columns
    }

    // 3. Try minimal insert
    const testData = {
      company_name: "__TEST_DIAGNOSTIC__",
      contact_person: "Test",
      email: "test@test.com",
      phone: "000",
      status: "active",
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      is_sample: true,
      created_by_id: user.id,
      payment_method: 1,
      security_rate: 0,
      installation_rate: 0,
    }

    const { data: inserted, error: insertError } = await supabase
      .from("clients")
      .insert([testData])
      .select()
      .single()

    diagnostics.insert_test = {
      success: !insertError,
      error: insertError ? {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      } : null,
      inserted_id: inserted?.id || null,
    }

    // 4. Clean up test row
    if (inserted?.id) {
      await supabase.from("clients").delete().eq("id", inserted.id)
      diagnostics.cleanup = "deleted test row"
    }

    return NextResponse.json({ diagnostics })
  } catch (error: unknown) {
    diagnostics.crash = {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 3) : undefined,
    }
    return NextResponse.json({ diagnostics })
  }
}
