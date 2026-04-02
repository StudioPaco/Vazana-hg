/**
 * Gmail API v1 — send email on behalf of a connected Google account.
 * Uses raw fetch against the Gmail REST API.
 */

import { getValidToken } from "@/lib/google-auth"

const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"

/**
 * Build an RFC 2822 email message and base64url-encode it.
 */
function buildRawEmail(to: string, subject: string, htmlBody: string, fromEmail?: string): string {
  const headers = [
    fromEmail ? `From: ${fromEmail}` : "",
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ]
    .filter(Boolean)
    .join("\r\n")

  const raw = `${headers}\r\n\r\n${Buffer.from(htmlBody, "utf-8").toString("base64")}`

  // base64url encode the entire message
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email via the Gmail API using the user's connected Google account.
 */
export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<SendEmailResult> {
  const token = await getValidToken(userId)
  if (!token) {
    return { success: false, error: "אין חיבור Google פעיל — יש להתחבר מהגדרות" }
  }

  const raw = buildRawEmail(to, subject, htmlBody)

  const res = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[gmail-service] Send failed:", res.status, body)
    return { success: false, error: `שליחת דואר נכשלה (${res.status})` }
  }

  const data = await res.json()
  return { success: true, messageId: data.id }
}
