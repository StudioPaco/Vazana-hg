import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/gmail-service"

/**
 * POST /api/email/send
 * Send an email via the connected Gmail account.
 * Body: { to: string, subject: string, body: string, userId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const { to, subject, body: htmlBody, userId } = json

    if (!to || !subject || !htmlBody) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, body" },
        { status: 400 }
      )
    }

    // Use the provided userId or fall back to the current user
    const targetUserId = userId || user.id

    const result = await sendEmail(targetUserId, to, subject, htmlBody)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ data: { messageId: result.messageId } })
  } catch (err) {
    console.error("[api/email/send] Error:", err)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}
