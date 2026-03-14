import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ user: null, profile: null })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id, username, email, full_name, role")
      .eq("id", user.id)
      .single()

    return NextResponse.json({ user: { id: user.id, email: user.email }, profile })
  } catch {
    return NextResponse.json({ user: null, profile: null })
  }
}
